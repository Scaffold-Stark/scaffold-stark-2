use starknet::ContractAddress;

#[starknet::interface]
pub trait IMultisigWallet<TContractState> {
    fn transfer_funds(
        ref self: TContractState, token: ContractAddress, to: ContractAddress, amount: u256,
    );
}

#[starknet::contract]
mod CustomMultisigWallet {
    use contracts::CustomMultisigComponent::MultisigComponent;
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::contract_address_const;
    use super::{ContractAddress, IMultisigWallet};

    const ETH_CONTRACT_ADDRESS: felt252 =
        0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;

    component!(path: MultisigComponent, storage: multisig, event: MultisigEvent);

    #[abi(embed_v0)]
    impl MultisigImpl = MultisigComponent::MultisigImpl<ContractState>;
    impl MultisigInternalImpl = MultisigComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        multisig: MultisigComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MultisigEvent: MultisigComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, quorum: u32, signer: ContractAddress) {
        self.multisig.initializer(quorum, signer);
    }

    #[abi(embed_v0)]
    impl MultisigWalletImpl of IMultisigWallet<ContractState> {
        fn transfer_funds(
            ref self: ContractState, token: ContractAddress, to: ContractAddress, amount: u256,
        ) {
            let token_dispatcher = IERC20Dispatcher { contract_address: token };
            token_dispatcher.transfer(to, amount);
        }
    }
}
