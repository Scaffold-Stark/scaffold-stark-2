use starknet::ContractAddress;

#[starknet::interface]
trait IChallenge0<T> {
    fn mint_item(ref self: T, recipient: ContractAddress //, uri: ByteArray
    ) -> u256;
    fn tokenIdCounter(self: @T) -> u256;
    fn full_token_uri(self: @T, token_id: u256) -> ByteArray;
}
#[starknet::contract]
mod Challenge0 {
    use super::{IChallenge0, ContractAddress};
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::access::ownable::OwnableComponent;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);


    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721MetadataImpl = ERC721Component::ERC721MetadataImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        counter: u256,
        token_uris: LegacyMap<u256, ByteArray>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name: ByteArray = "YourCollectible";
        let symbol: ByteArray = "YCB";
        let base_uri: ByteArray = "https://ipfs.io/";

        self.erc721.initializer(name, symbol, base_uri);
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl Challenge0Impl of IChallenge0<ContractState> {
        fn mint_item(
            ref self: ContractState, recipient: ContractAddress //, uri: ByteArray
        ) -> u256 {
            self._increment();
            let token_id = self._current();
            self.erc721._mint(recipient, token_id);
            let uri: ByteArray =
                "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr"; // Pass this as an argument
            self._setTokenURI(token_id, uri);
            token_id
        }
        fn tokenIdCounter(self: @ContractState) -> u256 {
            self._current()
        }

        fn full_token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            format!("{}{}", self.erc721._base_uri(), self.token_uris.read(token_id))
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _increment(ref self: ContractState) {
            self.counter.write(self.counter.read() + 1);
        }

        fn _current(self: @ContractState) -> u256 {
            self.counter.read()
        }

        fn _setTokenURI(ref self: ContractState, token_id: u256, uri: ByteArray) {
            self.token_uris.write(token_id, uri);
        }
    }
}
