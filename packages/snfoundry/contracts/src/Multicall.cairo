use starknet::ContractAddress;

#[starknet::interface]
pub trait IMulticall<T> {
    fn call_contracts(
        self: @T,
        contracts: Span<ContractAddress>,
        entry_point_selectors: Span<felt252>,
        calldata: Span<Span<felt252>>,
    ) -> Array<Span<felt252>>;
}

#[starknet::contract]
pub mod Multicall {
    use starknet::ContractAddress;
    use super::IMulticall;
    use core::array::ArrayTrait;
    use starknet::syscalls::call_contract_syscall;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl MulticallImpl of IMulticall<ContractState> {
        fn call_contracts(
            self: @ContractState,
            contracts: Span<ContractAddress>,
            entry_point_selectors: Span<felt252>,
            calldata: Span<Span<felt252>>,
        ) -> Array<Span<felt252>> {
            let mut results: Array<Span<felt252>> = ArrayTrait::new();
            for i in 0..contracts.len() {
                let contract = *contracts[i];
                let entry_point_selector = *entry_point_selectors[i];
                let calldata = *calldata[i];
                let result = call_contract_syscall(contract, entry_point_selector, calldata);
                results.append(result.unwrap());
            }
            results
        }
    }
} 