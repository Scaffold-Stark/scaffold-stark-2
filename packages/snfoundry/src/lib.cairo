#[starknet::interface]
pub trait IHelloStarknet<TContractState> {
    fn increase_balance(ref self: TContractState, amount: felt252);
    fn get_balance(self: @TContractState) -> felt252;
    fn get_balance2(self: @TContractState) -> felt252;
    fn doubleInput(self: @TContractState, input: felt252, input2: felt252) -> felt252;
}

#[starknet::contract]
mod HelloStarknet {
    #[storage]
    struct Storage {
        balance: felt252, 
    }

    #[abi(embed_v0)]
    impl HelloStarknetImpl of super::IHelloStarknet<ContractState> {
        fn increase_balance(ref self: ContractState, amount: felt252) {
            assert(amount != 0, 'amount cant be 0');
            self.balance.write(self.balance.read() + amount);
        }

        fn get_balance(self: @ContractState) -> felt252 {
            self.balance.read()
        }

        fn get_balance2(self: @ContractState) -> felt252 {
            self.balance.read()
        }

        fn doubleInput(self: @ContractState, input: felt252, input2: felt252) -> felt252 {
            input * 2
        }
    }
}
