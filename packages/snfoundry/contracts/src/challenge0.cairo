use starknet::ContractAddress;

#[starknet::interface]
pub trait IChallenge0<T> {
    fn mint_item(ref self: T, recipient: ContractAddress) -> u256;
    fn mint_id(ref self: T, recipient: ContractAddress, id: u256);
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
        counter: u256
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
        let base_uri: ByteArray =
            "https://ipfs.io/ipfs/QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr"; // bison nft

        self.erc721.initializer(name, symbol, base_uri);
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    pub impl Challenge0Impl of IChallenge0<ContractState> {
        fn mint_item(ref self: ContractState, recipient: ContractAddress) -> u256 {
            self._increment();
            let token_id = self._current();
            let data = array![].span();
            self.erc721._safe_mint(recipient, token_id, data);
            token_id
        }
        fn mint_id(ref self: ContractState, recipient: ContractAddress, id: u256) {
            self.erc721._mint(recipient, id);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _increment(ref self: ContractState) {
            self.counter.write(self.counter.read() + 1);
        }

        fn _current(ref self: ContractState) -> u256 {
            self.counter.read()
        }
    }
}
