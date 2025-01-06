// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^0.20.0
use starknet::ContractAddress;

#[starknet::interface]
trait ICardCollection<TContractState> {
    fn mint(ref self: TContractState, account: ContractAddress, token_id: u256, value: u256);
    fn batch_mint(
        ref self: TContractState,
        account: ContractAddress,
        token_ids: Span<u256>,
        values: Span<u256>,
    );
    fn batchMint(
        ref self: TContractState,
        account: ContractAddress,
        tokenIds: Span<u256>,
        values: Span<u256>,
    );
}

#[starknet::contract]
mod CardCollection {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::security::pausable::PausableComponent;
    use openzeppelin::token::erc1155::ERC1155Component;
    use openzeppelin::token::erc1155::interface::IERC1155MetadataURI as MetadataURI;
    use openzeppelin::upgrades::interface::IUpgradeable;
    use openzeppelin::upgrades::UpgradeableComponent;
    use starknet::{ClassHash, ContractAddress, get_caller_address};
    use starknet::storage::Map;

    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);

    // External
    #[abi(embed_v0)]
    impl ERC1155MixinImpl = ERC1155Component::ERC1155MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    // Internal
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        // caller address => is allowed
        allowedCaller: Map::<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        card_factory: ContractAddress,
        base_uri: ByteArray,
    ) {
        self.erc1155.initializer(base_uri);
        self.ownable.initializer(owner);
        self.allowedCaller.write(owner, true);
        self.allowedCaller.write(card_factory, true);
    }

    impl ERC1155HooksImpl of ERC1155Component::ERC1155HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC1155Component::ComponentState<ContractState>,
            from: ContractAddress,
            to: ContractAddress,
            token_ids: Span<u256>,
            values: Span<u256>,
        ) {
            let contract_state = self.get_contract();
            contract_state.pausable.assert_not_paused();
        }
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn pause(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.pausable.pause();
        }

        #[external(v0)]
        fn unpause(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.pausable.unpause();
        }

        #[external(v0)]
        fn burn(ref self: ContractState, account: ContractAddress, token_id: u256, value: u256) {
            let caller = get_caller_address();
            if account != caller {
                assert(
                    self.erc1155.is_approved_for_all(account, caller),
                    ERC1155Component::Errors::UNAUTHORIZED,
                );
            }
            self.erc1155.burn(account, token_id, value);
        }

        #[external(v0)]
        fn batch_burn(
            ref self: ContractState,
            account: ContractAddress,
            token_ids: Span<u256>,
            values: Span<u256>,
        ) {
            let caller = get_caller_address();
            if account != caller {
                assert(
                    self.erc1155.is_approved_for_all(account, caller),
                    ERC1155Component::Errors::UNAUTHORIZED,
                );
            }
            self.erc1155.batch_burn(account, token_ids, values);
        }

        #[external(v0)]
        fn batchBurn(
            ref self: ContractState,
            account: ContractAddress,
            tokenIds: Span<u256>,
            values: Span<u256>,
        ) {
            self.batch_burn(account, tokenIds, values);
        }

        #[external(v0)]
        fn mint(ref self: ContractState, account: ContractAddress, token_id: u256, value: u256) {
            self.assert_only_allowed_caller(get_caller_address());

            self
                .erc1155
                .mint_with_acceptance_check(account, token_id, value, ArrayTrait::new().span());
        }

        #[external(v0)]
        fn batch_mint(
            ref self: ContractState,
            account: ContractAddress,
            token_ids: Span<u256>,
            values: Span<u256>,
        ) {
            self.assert_only_allowed_caller(get_caller_address());

            self
                .erc1155
                .batch_mint_with_acceptance_check(account, token_ids, values, array![].span());
        }

        #[external(v0)]
        fn batchMint(
            ref self: ContractState,
            account: ContractAddress,
            tokenIds: Span<u256>,
            values: Span<u256>,
        ) {
            self.batch_mint(account, tokenIds, values);
        }

        #[external(v0)]
        fn set_base_uri(ref self: ContractState, base_uri: ByteArray) {
            self.ownable.assert_only_owner();
            self.erc1155._set_base_uri(base_uri);
        }

        #[external(v0)]
        fn setBaseUri(ref self: ContractState, baseUri: ByteArray) {
            self.set_base_uri(baseUri);
        }

        #[external(v0)]
        fn set_allowed_caller(
            ref self: ContractState, contract: ContractAddress, is_allowed: bool,
        ) {
            self.ownable.assert_only_owner();
            self.allowedCaller.write(contract, is_allowed);
        }

        #[external(v0)]
        fn setAllowedCaller(ref self: ContractState, contract: ContractAddress, isAllowed: bool) {
            self.set_allowed_caller(contract, isAllowed);
        }

        #[external(v0)]
        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            let base_uri = MetadataURI::uri(self.erc1155, token_id);

            if base_uri.len() == 0 {
                return "";
            } else {
                return format!("{}{}", base_uri, token_id);
            }
        }

        #[external(v0)]
        fn tokenURI(self: @ContractState, tokenId: u256) -> ByteArray {
            return self.token_uri(tokenId);
        }
    }

    #[generate_trait]
    impl InternalImpl of IInternalImpl {
        fn assert_only_allowed_caller(self: @ContractState, caller: ContractAddress) {
            assert(self.allowedCaller.read(caller), 'Only Allowed Caller');
        }
    }

    //
    // Upgradeable
    //

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
