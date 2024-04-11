use starknet::ContractAddress;

#[starknet::interface]
pub trait IChallenge0<T> {
    fn mint_item(ref self: T, recipient: ContractAddress) -> u256;
}
#[starknet::contract]
mod Challenge0 {
    use super::IChallenge0;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::ERC721Component;
    use starknet::ContractAddress;

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // ERC721Mixin
    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    //pub impl ERC721MetadataImpl = ERC721Component::ERC721MetadataImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        let name: ByteArray = "YourCollectible";
        let symbol: ByteArray = "YCB";
        let base_uri: ByteArray =
            "https://ipfs.io/ipfs/QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr"; // bison nft

        self.erc721.initializer(name, symbol, base_uri);
    }

    #[abi(embed_v0)]
    pub impl Challenge0Impl of IChallenge0<ContractState> {
        fn mint_item(ref self: ContractState, recipient: ContractAddress) -> u256 {
            let id: u256 = 1;
            self.erc721._mint(recipient, id); // _mint include _setTokenURI()
            id
        }
    }
}
