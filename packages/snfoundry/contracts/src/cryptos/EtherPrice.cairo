#[starknet::interface]
pub trait IEtherPrice<TContractState> {}

#[starknet::contract]
pub mod EtherPrice {
    use super::IEtherPrice;
    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl EtherImpl of IEtherPrice<ContractState> {}
}
