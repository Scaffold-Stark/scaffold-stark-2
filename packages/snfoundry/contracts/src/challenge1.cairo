use starknet::ContractAddress;
#[starknet::interface]
pub trait IChallenge1<T> {
    fn execute(ref self: T);
    fn stake(ref self: T, amount: u256);
    fn withdraw(ref self: T);
    fn balances(self: @T, account: ContractAddress) -> u256;
    fn completed(self: @T) -> bool;
    fn deadline(self: @T) -> u64;
    fn example_external_contract(self: @T) -> ContractAddress;
    fn open_for_withdraw(self: @T) -> bool;
    fn threshold(self: @T) -> u256;
    fn total_balance(self: @T) -> u256;
    fn time_left(self: @T) -> u64;
}

#[starknet::contract]
mod Challenge1 {
    use contracts::exampleExternalContract::{
        IExampleExternalContractDispatcher, IExampleExternalContractDispatcherTrait
    };
    use super::{ContractAddress, IChallenge1};
    use starknet::{get_block_timestamp, get_caller_address, get_contract_address};
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};

    pub const THRESHOLD: u256 = 100000000000000000; // ONE_ETH_IN_WEI: 10 ^ 18;
    #[storage]
    struct Storage {
        token: IERC20CamelDispatcher,
        balances: LegacyMap<ContractAddress, u256>,
        deadline: u64,
        open_for_withdraw: bool,
        external_contract_address: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        external_contract_address: ContractAddress,
        eth_contract_address: ContractAddress
    ) {
        self.token.write(IERC20CamelDispatcher { contract_address: eth_contract_address });
        self.deadline.write(get_block_timestamp() + 100); // 45 seconds
        self.external_contract_address.write(external_contract_address);
    }

    #[abi(embed_v0)]
    impl Challenge1Impl of IChallenge1<ContractState> {
        fn stake(ref self: ContractState, amount: u256) {
            // ToDo in UI: Sender should approve to transfer the amount to the staker contract
            self._not_completed();
            assert(get_block_timestamp() < self.deadline.read(), 'Staking period has ended');
            let sender = get_caller_address();
            let sender_current_amount = self.balances.read(sender);
            self.token.read().transferFrom(sender, get_contract_address(), amount);
            self.balances.write(sender, sender_current_amount + amount);
        }

        // Function to execute the transfer or allow withdrawals after the deadline
        fn execute(ref self: ContractState) {
            self._not_completed();
            assert(get_block_timestamp() >= self.deadline.read(), 'Staking period has not ended');
            let staked_amount = self.token.read().balanceOf(get_contract_address());
            if (staked_amount >= THRESHOLD) {
                self._complete_transfer(staked_amount);
            } else {
                self.open_for_withdraw.write(true);
            }
        }

        fn withdraw(ref self: ContractState) {
            // Todo in UI: Staker contract should approve to transfer back the sender_amount to the sender
            assert(self.open_for_withdraw.read(), 'Withdrawal not allowed');
            let sender = get_caller_address();
            let sender_amount = self.balances.read(sender);
            assert(sender_amount > 0, 'No balance to withdraw');
            self.token.read().transferFrom(get_contract_address(), sender, sender_amount);
            self.balances.write(sender, 0);
        }

        fn balances(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn total_balance(self: @ContractState) -> u256 {
            self.balances.read(get_contract_address())
        }

        fn deadline(self: @ContractState) -> u64 {
            self.deadline.read()
        }

        fn threshold(self: @ContractState) -> u256 {
            THRESHOLD
        }

        fn open_for_withdraw(self: @ContractState) -> bool {
            self.open_for_withdraw.read()
        }

        fn example_external_contract(self: @ContractState) -> ContractAddress {
            self.external_contract_address.read()
        }

        fn completed(self: @ContractState) -> bool {
            let external_contract = IExampleExternalContractDispatcher {
                contract_address: self.external_contract_address.read()
            };
            external_contract.completed()
        }

        fn time_left(self: @ContractState) -> u64 {
            let current_time = get_block_timestamp();
            let deadline = self.deadline.read();
            if current_time < deadline {
                deadline - current_time
            } else {
                0
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _complete_transfer(ref self: ContractState, amount: u256) {
            let external_contract_address = self.external_contract_address.read();
            let external_contract_dispatcher = IExampleExternalContractDispatcher {
                contract_address: external_contract_address
            };
            // Todo in UI: Staker contract should approve to transfer the staked_amount to the external contract
            self.token.read().transfer(external_contract_address, amount);
            external_contract_dispatcher.complete(amount);
        }
        fn _not_completed(ref self: ContractState) {
            assert(!self.completed(), 'Action already completed');
        }
    }
}
