use starknet::ContractAddress;
#[starknet::interface]
trait ITransferETH<T> {
    fn read_balance_contract(self: @T) -> u256;
    fn read_balance_caller(self: @T) -> u256;
    fn caller_and_contract(self: @T) -> (ContractAddress, ContractAddress);
}

#[starknet::contract]
mod TransferETH {
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{get_caller_address, get_contract_address, ContractAddress};
    #[storage]
    struct Storage {
        token: IERC20Dispatcher,
    }

    #[constructor]
    fn constructor(ref self: ContractState //, external_contract_address: ContractAddress
    ) {
        self
            .token
            .write(
                IERC20Dispatcher {
                    contract_address: 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
                        .try_into()
                        .unwrap()
                }
            );
    }

    #[abi(embed_v0)]
    impl TransferETHImpl of super::ITransferETH<ContractState> {
        fn read_balance_contract(self: @ContractState) -> u256 {
            self.token.read().balance_of(get_contract_address())
        }
        fn read_balance_caller(self: @ContractState) -> u256 {
            self.token.read().balance_of(get_caller_address())
        }
        fn caller_and_contract(self: @ContractState) -> (ContractAddress, ContractAddress) {
            (get_caller_address(), get_contract_address())
        }
    }
}
