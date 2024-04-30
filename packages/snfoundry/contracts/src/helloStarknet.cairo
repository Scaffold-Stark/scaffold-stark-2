#[starknet::interface]
pub trait IHelloStarknet<TContractState> {
    fn increase_balance(ref self: TContractState, amount: u32);
    fn get_balance(self: @TContractState) -> u32;
    fn get_balance_increment(self: @TContractState, amount: u32) -> u32;
}

#[starknet::contract]
mod HelloStarknet {
    #[storage]
    struct Storage {
        balance: u32,
    }

    #[abi(embed_v0)]
    impl HelloStarknetImpl of super::IHelloStarknet<ContractState> {
        fn increase_balance(ref self: ContractState, amount: u32) {
            assert(amount != 0, 'amount cannot be 0');
            self.balance.write(self.balance.read() + amount);
        }

        fn get_balance(self: @ContractState) -> u32 {
            self.balance.read()
        }

        fn get_balance_increment(self: @ContractState, amount: u32) -> u32 {
            self.balance.read() + amount
        }
    }
}
