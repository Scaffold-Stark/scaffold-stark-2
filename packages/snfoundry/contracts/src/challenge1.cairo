use starknet::ContractAddress;
#[starknet::interface]
pub trait IChallenge1<T> {
    fn stake(ref self: T, amount: u256);
    fn withdraw(ref self: T);
    fn balances(self: @T, account: ContractAddress) -> u256;
    fn execute(ref self: T);
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

    pub const THRESHOLD: u256 = 100000000000000000; // ONE_ETH_IN_WEI: 10 ^ 18;
    #[storage]
    struct Storage {
        balances: LegacyMap<ContractAddress, u256>,
        deadline: u64,
        open_for_withdraw: bool,
        external_contract_address: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, external_contract_address: ContractAddress) {
        self.deadline.write(get_block_timestamp() + 45); // 45 seconds
        self.external_contract_address.write(external_contract_address);
    }

    #[abi(embed_v0)]
    impl Challenge1Impl of IChallenge1<ContractState> {
        fn stake(ref self: ContractState, amount: u256) {
            self._not_completed();
            assert(get_block_timestamp() < self.deadline.read(), 'Staking period has ended');
            let sender = get_caller_address();
            let contract_address = get_contract_address();
            let sender_current_amount = self.balances.read(sender);
            self.balances.write(sender, sender_current_amount + amount);
            self.balances.write(contract_address, self.balances.read(contract_address) + amount);
        }

        // Function to execute the transfer or allow withdrawals after the deadline
        fn execute(ref self: ContractState) {
            self._not_completed();
            assert(get_block_timestamp() >= self.deadline.read(), 'Staking period has not ended');
            let contract_address = get_contract_address();
            let contract_amount = self.balances.read(contract_address);
            if (contract_amount >= THRESHOLD) {
                self._complete_transfer(contract_amount, self.external_contract_address.read());
            } else {
                self.open_for_withdraw.write(true);
            }
        }

        fn withdraw(ref self: ContractState) {
            assert(self.open_for_withdraw.read(), 'Withdrawal not allowed');
            let sender = get_caller_address();
            let sender_amount = self.balances.read(sender);
            assert(sender_amount > 0, 'No balance to withdraw');
            let contract_amount = self.balances.read(get_contract_address());
            self.balances.write(sender, 0);
            self.balances.write(get_contract_address(), contract_amount - sender_amount);
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
        fn _complete_transfer(
            ref self: ContractState, amount: u256, external_contract_address: ContractAddress
        ) {
            let external_contract = IExampleExternalContractDispatcher {
                contract_address: external_contract_address
            };
            self.balances.write(get_contract_address(), 0);
            external_contract.complete(amount);
        }

        fn _not_completed(ref self: ContractState) {
            assert(!self.completed(), 'Action already completed');
        }
    }
}
