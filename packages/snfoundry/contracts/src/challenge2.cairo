use starknet::ContractAddress;
#[starknet::interface]
pub trait IChallenge2<T> {
    fn buy_tokens(ref self: T, eth_amount_wei: u256);
    fn withdraw(ref self: T);
    fn sell_tokens(ref self: T, amount_tokens: u256);
}

#[starknet::contract]
mod Challenge2 {
    use openzeppelin::access::ownable::interface::IOwnable;
    use core::traits::Destruct;
    use openzeppelin::access::ownable::OwnableComponent;
    use contracts::yourToken::{IYourTokenDispatcher, IYourTokenDispatcherTrait};
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use super::{ContractAddress, IChallenge2};
    use starknet::{get_caller_address, get_contract_address};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    pub const TokensPerEth: u256 = 100;
    pub const Eth: u256 = 1000000000000000000; // ONE_ETH_IN_WEI: 10 ^ 18;


    #[storage]
    struct Storage {
        erc20_token: IERC20CamelDispatcher,
        your_token: IYourTokenDispatcher,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_address: ContractAddress,
        eth_contract_address: ContractAddress,
        owner: ContractAddress
    ) {
        self.erc20_token.write(IERC20CamelDispatcher { contract_address: eth_contract_address });
        self.your_token.write(IYourTokenDispatcher { contract_address: token_address });
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl Challenge1Impl of IChallenge2<ContractState> {
        fn buy_tokens(ref self: ContractState, eth_amount_wei: u256) {
            assert(eth_amount_wei > 0, 'Amount must be greater than 0');
            let tokens_to_buy = eth_amount_wei * TokensPerEth / Eth;
            let vendor_token_balance = self.your_token.read().balance_of(get_contract_address());
            assert(vendor_token_balance >= tokens_to_buy, 'Not Enough tokens');
            //call fn approve() on UI 
            self
                .erc20_token
                .read()
                .transferFrom(get_caller_address(), get_contract_address(), eth_amount_wei);
            let sent = self.your_token.read().transfer(get_caller_address(), tokens_to_buy);
            assert(sent, 'Token Transfer failed');
        }

        fn withdraw(ref self: ContractState) {
            self.ownable.assert_only_owner();
            let balance = self.erc20_token.read().balanceOf(get_contract_address());
            let sent = self.erc20_token.read().transfer(self.ownable.owner(), balance);
            assert(sent, 'Eth Transfer failed');
        }

        fn sell_tokens(ref self: ContractState, amount_tokens: u256) {
            assert(amount_tokens > 0, 'Amount must be greater than 0');
            let eth_amount_wei = amount_tokens * Eth / TokensPerEth;
            let contract_eth_balance = self.erc20_token.read().balanceOf(get_caller_address());
            assert(contract_eth_balance >= eth_amount_wei, 'Not Enough tokens');
            // call fn approve() on UI 
            let sent = self
                .your_token
                .read()
                .transfer_from(get_caller_address(), get_contract_address(), amount_tokens);
            assert(sent, 'Tokens Transfer failed');

            let sent = self.erc20_token.read().transfer(get_caller_address(), eth_amount_wei);
            assert(sent, 'Eth Transfer failed');
        }
    }
}

