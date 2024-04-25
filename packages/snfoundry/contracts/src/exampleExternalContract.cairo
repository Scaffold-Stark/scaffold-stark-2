#[starknet::interface]
pub trait IExampleExternalContract<T> {
    fn complete(ref self: T, amount: u256);
    fn completed(ref self: T) -> bool;
}

#[starknet::contract]
mod ExampleExternalContract {
    #[storage]
    struct Storage {
        completed: bool,
        balance: u256,
    }

    #[abi(embed_v0)]
    impl ExampleExternalContractImpl of super::IExampleExternalContract<ContractState> {
        fn complete(ref self: ContractState, amount: u256) {
            self.completed.write(true);
            self.balance.write(self.balance.read() + amount);
        }
        fn completed(ref self: ContractState) -> bool {
            self.completed.read()
        }
    }
}
