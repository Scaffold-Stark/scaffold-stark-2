//core import
use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
use pragma_lib::types::{AggregationMode, DataType, PragmaPricesResponse};
use starknet::ContractAddress;


#[starknet::interface]
pub trait IPragmaComponent<TContractState> {
    fn initializer(ref self: TContractState, pragma_address: ContractAddress);
    fn get_asset_price_median(self: @TContractState, asset: DataType) -> u128;
    fn set_asset_price_median_checkoint(self: @TContractState, asset: DataType);
}

#[starknet::component]
pub mod PragmaComponent {
    use super::ContractAddress;
    use super::{AggregationMode, DataType, PragmaPricesResponse};
    use super::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};

    #[storage]
    struct Storage {
        pragma_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[embeddable_as(PragmaComponentImpl)]
    impl PragmaImpl<
        TContractState, +HasComponent<TContractState>,
    > of super::IPragmaComponent<ComponentState<TContractState>> {
        fn initializer(ref self: ComponentState<TContractState>, pragma_address: ContractAddress) {
            self.pragma_address.write(pragma_address);
        }

        fn get_asset_price_median(self: @ComponentState<TContractState>, asset: DataType) -> u128 {
            let oracle_dispatcher = IPragmaABIDispatcher {
                contract_address: self.pragma_address.read(),
            };
            let output: PragmaPricesResponse = oracle_dispatcher
                .get_data(asset, AggregationMode::Median(()));
            return output.price;
        }

        fn set_asset_price_median_checkoint(
            self: @ComponentState<TContractState>, asset: DataType,
        ) {
            let oracle_dispatcher = IPragmaABIDispatcher {
                contract_address: self.pragma_address.read(),
            };
            let output = oracle_dispatcher.set_checkpoint(asset, AggregationMode::Median(()));
            return output;
        }
    }
}
