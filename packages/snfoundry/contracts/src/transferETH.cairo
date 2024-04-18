use starknet::ContractAddress;
#[starknet::interface]
trait ITransferETH<T> {
    fn read_balance_contract(self: @T) -> u256;
    fn read_balance_account(self: @T, account: ContractAddress) -> u256;
    fn caller_and_contract(self: @T) -> (ContractAddress, ContractAddress);
    fn transfer_to_contract(ref self: T, amount: u256);
    fn approve(ref self: T, spender: ContractAddress, amount: u256) -> bool;
    fn allowance(self: @T, owner: ContractAddress, spender: ContractAddress) -> u256;
}

#[starknet::contract]
mod TransferETH {
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use starknet::{get_caller_address, get_contract_address, ContractAddress};
    #[storage]
    struct Storage {
        token: IERC20CamelDispatcher,
    }

    #[constructor]
    fn constructor(ref self: ContractState //, external_contract_address: ContractAddress
    ) {
        self
            .token
            .write(
                IERC20CamelDispatcher {
                    contract_address: 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
                        .try_into()
                        .unwrap()
                }
            );
    }

    #[abi(embed_v0)]
    impl TransferETHImpl of super::ITransferETH<ContractState> {
        fn read_balance_contract(self: @ContractState) -> u256 {
            self.token.read().balanceOf(get_contract_address())
        }
        fn read_balance_account(self: @ContractState, account: ContractAddress) -> u256 {
            self.token.read().balanceOf(account)
        }

        fn caller_and_contract(self: @ContractState) -> (ContractAddress, ContractAddress) {
            (get_caller_address(), get_contract_address())
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            //self.token.read().approve(spender, amount)
            let dispatcher = IERC20CamelDispatcher {
                contract_address: 0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
                    .try_into()
                    .unwrap()
            };
            dispatcher.approve(spender, amount)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress
        ) -> u256 {
            self.token.read().allowance(owner, spender)
        }

        fn transfer_to_contract(ref self: ContractState, amount: u256) {
            let caller = 0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
                .try_into()
                .unwrap();
            self.token.read().transferFrom(caller, get_contract_address(), amount);
        }
    }
}
