use starknet::ContractAddress;

#[starknet::interface]
pub trait IChallenge1<T> {
    fn stake(ref self: T, amount: u256);
    //fn withdraw(ref self: TContractState, shares: u256);
    fn balances(self: @T, account: ContractAddress) -> u256;
    fn total_balance(self: @T) -> u256;
    fn deadline(self: @T) -> u64;
    fn threshold(self: @T) -> u256;
}

#[starknet::contract]
mod Challenge1 {
    use super::{ContractAddress, IChallenge1};
    use starknet::{get_block_timestamp, get_caller_address, get_contract_address};

    pub const THRESHOLD: u256 = 100000000000000000; // ONE_ETH_IN_WEI: 10 ^ 18;
    #[storage]
    struct Storage {
        balances: LegacyMap<ContractAddress, u256>,
        deadline: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.deadline.write(get_block_timestamp() + 45);
    }

    #[abi(embed_v0)]
    impl Challenge1Impl of IChallenge1<ContractState> {
        fn stake(ref self: ContractState, amount: u256) {
            assert(get_block_timestamp() < self.deadline.read(), 'Staking priod has ended');
            let sender = get_caller_address();
            let contract_address = get_contract_address();
            let sender_current_amount = self.balances.read(sender);
            self.balances.write(sender, sender_current_amount + amount);
            self.balances.write(contract_address, self.balances.read(contract_address) + amount);
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
    }
}
