use starknet::ContractAddress;
#[starknet::interface]
pub trait IChallenge2<T> {
    fn buy_tokens(ref self: T, amount: u256);
}

#[starknet::contract]
mod Challenge1 {
    use core::traits::Destruct;
    use openzeppelin::access::ownable::OwnableComponent;
    use contracts::yourToken::{IYourTokenDispatcher, IYourTokenDispatcherTrait};
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use super::{ContractAddress, IChallenge2};
    use starknet::{get_caller_address, get_contract_address};


    pub const TokensPerEth: u256 = 100;

    #[storage]
    struct Storage {
        erc20_token: IERC20CamelDispatcher,
        your_token: IYourTokenDispatcher,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_address: ContractAddress,
        eth_contract_address: ContractAddress
    ) {
        self.erc20_token.write(IERC20CamelDispatcher { contract_address: eth_contract_address });
        self.your_token.write(IYourTokenDispatcher { contract_address: token_address });
    }

    #[abi(embed_v0)]
    impl Challenge1Impl of IChallenge2<ContractState> {
        fn buy_tokens(ref self: ContractState, amount: u256) {
            assert(amount > 0, 'Amount must be greater than 0');
            let amount_to_buy = amount * TokensPerEth;
            let vendor_balance = self.your_token.read().balance_of(get_contract_address());
            assert(vendor_balance >= amount_to_buy, 'Not Enough tokens');
        }
    }
}

