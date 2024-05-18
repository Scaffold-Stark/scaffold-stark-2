use starknet::ContractAddress;
#[starknet::interface]
pub trait IHelloStarknet<TContractState> {
    fn increase_balance(ref self: TContractState, amount: u32);
    fn get_balance(self: @TContractState) -> u32;
    fn get_balance_and_balance(self: @TContractState) -> (u32, u32);
    fn get_caller_and_get_contract(self: @TContractState) -> (ContractAddress, ContractAddress);
    fn is_even_balance(self: @TContractState) -> bool;
}

#[starknet::contract]
mod HelloStarknet {
    use super::ContractAddress;
    use starknet::{get_contract_address, get_caller_address};

    #[storage]
    struct Storage {
        balance: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        BalanceIncreased: BalanceIncreased,
    }

    #[derive(Drop, starknet::Event)]
    struct BalanceIncreased {
        #[key]
        prev_balance: u32,
        #[key]
        new_balance: u32,
    }

    #[abi(embed_v0)]
    impl HelloStarknetImpl of super::IHelloStarknet<ContractState> {
        fn increase_balance(ref self: ContractState, amount: u32) {
            assert(amount != 0, 'amount cannot be 0');
            let prev_balance = self.get_balance();
            let new_balance = prev_balance + amount;
            self.balance.write(new_balance);

            self.emit(BalanceIncreased { prev_balance, new_balance });
        }

        fn get_balance(self: @ContractState) -> u32 {
            self.balance.read()
        }

        fn get_balance_and_balance(self: @ContractState) -> (u32, u32) {
            let balance = self.balance.read();
            (balance, balance)
        }

        fn get_caller_and_get_contract(
            self: @ContractState
        ) -> (super::ContractAddress, super::ContractAddress) {
            (get_caller_address(), get_contract_address())
        }
        fn is_even_balance(self: @ContractState) -> bool {
            if self.balance.read() % 2 == 0 {
                true
            } else {
                false
            }
        }
    }
}
