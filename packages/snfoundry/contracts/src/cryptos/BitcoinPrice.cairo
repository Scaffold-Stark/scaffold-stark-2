#[starknet::interface]
pub trait IBitcoinPrice<TContractState> {}

#[starknet::contract]
pub mod BitcoinPrice {
    use super::IBitcoinPrice;
    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {  
    }

    #[abi(embed_v0)]
    impl BitcoinImpl of IBitcoinPrice<ContractState> {
    }
}