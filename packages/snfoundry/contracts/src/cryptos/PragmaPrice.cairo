//core import
use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
use pragma_lib::types::{AggregationMode, DataType, PragmaPricesResponse};
use starknet::ContractAddress;
use starknet::contract_address::contract_address_const;


#[starknet::interface]
pub trait IPragmaPrice<TContractState> {
    fn get_asset_price_median(
        self: @TContractState, oracle_address: ContractAddress, asset: DataType
    ) -> u128;
    fn set_asset_price_median_checkoint(
        self: @TContractState, oracle_address: ContractAddress, asset: DataType
    );
}

#[starknet::component]
pub mod PragmaPrice {
    use super::ContractAddress;
    use super::IPragmaPrice;
    use super::contract_address_const;
    use super::{AggregationMode, DataType, PragmaPricesResponse};
    use super::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[embeddable_as(PragmaPriceImpl)]
    impl PragmaImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IPragmaPrice<ComponentState<TContractState>> {
        fn get_asset_price_median(
            self: @ComponentState<TContractState>, oracle_address: ContractAddress, asset: DataType
        ) -> u128 {
            let oracle_dispatcher = IPragmaABIDispatcher { contract_address: oracle_address };
            let output: PragmaPricesResponse = oracle_dispatcher
                .get_data(asset, AggregationMode::Median(()));
            return output.price;
        }

        fn set_asset_price_median_checkoint(
            self: @ComponentState<TContractState>, oracle_address: ContractAddress, asset: DataType
        ) {
            let oracle_dispatcher = IPragmaABIDispatcher { contract_address: oracle_address };
            let output = oracle_dispatcher.set_checkpoint(asset, AggregationMode::Median(()));
            return output;
        }
    }
}
