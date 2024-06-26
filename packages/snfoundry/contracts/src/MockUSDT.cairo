use starknet::ContractAddress;

#[starknet::interface]
pub trait IMockToken<TContractState> {
    fn faucet(ref self: TContractState, recipient: ContractAddress, amount: u256);
}

#[starknet::contract]
mod MockUsdt {
    use openzeppelin::token::erc20::ERC20Component;
    use starknet::{ContractAddress, get_caller_address};
    use super::IMockToken;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl MockTokenImpl of IMockToken<ContractState> {
        fn faucet(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.erc20._mint(recipient, amount);
        }
    }

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        recipient: ContractAddress,
    ) {
        // supply 10000 * 10^18
        let initial_supply: u256 = 10000_000_000_000_000_000_000;
        self.erc20.initializer("USD Tether", "USDT");
        self.erc20._mint(recipient, initial_supply);
    }
}