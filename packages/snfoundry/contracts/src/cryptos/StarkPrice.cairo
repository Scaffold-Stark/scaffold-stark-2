#[starknet::interface]
pub trait IStarkPrice<TContractState> {}

#[starknet::contract]
pub mod StarkPrice {
    use super::IStarkPrice;
    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl StarkImpl of IStarkPrice<ContractState> {}
}
