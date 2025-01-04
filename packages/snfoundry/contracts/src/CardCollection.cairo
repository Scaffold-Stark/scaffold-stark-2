use starknet::ContractAddress;

#[starknet::interface]
trait ICardCollection<TContractState> {
    fn claim_single_card(
        ref self: TContractState, minter: ContractAddress, tokenId: u256, amount: u256,
    );
    fn set_allowed_caller(ref self: TContractState, contract: ContractAddress, allowed: bool);
    fn claim_batch_cards(
        ref self: TContractState,
        minter: ContractAddress,
        token_ids: Span<u256>,
        amounts: Span<u256>,
    );
    fn set_base_uri(ref self: TContractState, base_uri: ByteArray);
    fn token_uri(self: @TContractState, token_id: u256) -> ByteArray;
}

#[starknet::contract]
mod CardCollection {
    use openzeppelin::token::erc1155::erc1155::ERC1155Component::InternalTrait;
    use openzeppelin::security::{PausableComponent, ReentrancyGuardComponent};
    use openzeppelin::token::erc1155::{ERC1155Component, ERC1155HooksEmptyImpl};
    use openzeppelin::token::erc1155::interface::IERC1155MetadataURI as MetadataURI;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::access::ownable::OwnableComponent;
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::Map;
    use core::array::ArrayTrait;
    use core::byte_array::ByteArray;

    component!(path: ERC1155Component, storage: erc1155, event: erc1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: ownableEvent);
    component!(path: ReentrancyGuardComponent, storage: reentrancy, event: reentrancyEvent);
    component!(path: PausableComponent, storage: pausable, event: pausableEvent);

    #[abi(embed_v0)]
    impl ERC1155Impl = ERC1155Component::ERC1155MixinImpl<ContractState>;

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;

    impl InternalOwnableImple = OwnableComponent::InternalImpl<ContractState>;

    impl InternalPausableImpl = PausableComponent::InternalImpl<ContractState>;

    impl InternalReentrancyImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;


    #[storage]
    struct Storage {
        // caller address => is allowed
        allowedCaller: Map::<ContractAddress, bool>,
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        reentrancy: ReentrancyGuardComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        erc1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        ownableEvent: OwnableComponent::Event,
        #[flat]
        reentrancyEvent: ReentrancyGuardComponent::Event,
        #[flat]
        pausableEvent: PausableComponent::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        card_factory: ContractAddress,
        base_uri: ByteArray,
    ) {
        self.ownable.initializer(owner);
        self.erc1155.initializer(base_uri);
        self.allowedCaller.write(card_factory, true);
    }

    #[abi(embed_v0)]
    impl CardsImpl of super::ICardCollection<ContractState> {
        fn claim_single_card(
            ref self: ContractState, minter: ContractAddress, tokenId: u256, amount: u256,
        ) {
            self.reentrancy.start();
            let caller = get_caller_address();
            self.assert_only_allowed_caller(caller);

            self
                .erc1155
                .mint_with_acceptance_check(minter, tokenId, amount, ArrayTrait::new().span());

            self.reentrancy.end();
        }

        fn claim_batch_cards(
            ref self: ContractState,
            minter: ContractAddress,
            token_ids: Span<u256>,
            amounts: Span<u256>,
        ) {
            self.reentrancy.start();
            let caller = get_caller_address();
            self.assert_only_allowed_caller(caller);

            self
                .erc1155
                .batch_mint_with_acceptance_check(minter, token_ids, amounts, array![].span());

            self.reentrancy.end();
        }

        fn set_allowed_caller(ref self: ContractState, contract: ContractAddress, allowed: bool) {
            self.ownable.assert_only_owner();
            self.allowedCaller.write(contract, allowed);
        }

        fn set_base_uri(ref self: ContractState, base_uri: ByteArray) {
            self.ownable.assert_only_owner();
            self.erc1155._set_base_uri(base_uri);
        }

        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            let base_uri = MetadataURI::uri(self.erc1155, token_id);

            if base_uri.len() == 0 {
                return "";
            } else {
                return format!("{}{}", base_uri, token_id);
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of IInternalImpl {
        fn assert_only_allowed_caller(self: @ContractState, caller: ContractAddress) {
            assert(self.allowedCaller.read(caller), 'Collection: Only Allowed Caller');
        }
    }
}
