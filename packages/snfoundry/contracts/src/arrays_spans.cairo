use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
enum SampleEnum {
    enum1: u256,
    enum2: u256,
    enum3: ByteArray,
}

#[derive(Drop, Serde, starknet::Store)]
struct SampleStruct {
    id: u256,
    name: ByteArray,
    status: SampleEnum,
}

#[derive(Drop, Serde, starknet::Store)]
struct SampleNestedStruct {
    user: ContractAddress,
    data: SampleStruct,
    status: SampleEnum,
}

#[derive(Drop, Serde, starknet::Store)]
struct StructWithFiveElements {
    element1: u256,
    element2: felt252,
    element3: ByteArray,
    element4: ContractAddress,
    element5: bool,
}

#[derive(Drop, Serde, starknet::Store)]
struct StructWithEightElements {
    element1: u256,
    element2: felt252,
    element3: ByteArray,
    element4: ContractAddress,
    element5: bool,
    element6: u64,
    element7: i128,
    element8: bytes31,
}

#[derive(Drop, Serde, starknet::Store)]
struct Layer1 {
    layer1_element: u256,
}

#[derive(Drop, Serde, starknet::Store)]
struct Layer2 {
    layer2_element: Layer1,
}

#[derive(Drop, Serde, starknet::Store)]
struct Layer3 {
    layer3_element: Layer2,
}

#[derive(Drop, Serde, starknet::Store)]
struct StructWith4Layers {
    layer4_element: Layer3,
}

#[starknet::interface]
pub trait IArraysSpans<TContractState> {
    // Getters for Array
    fn get_array_u256(self: @TContractState, array: Array<u256>) -> Array<u256>;
    fn get_array_felt252(self: @TContractState, array: Array<felt252>) -> Array<felt252>;
    fn get_array_bool(self: @TContractState, array: Array<bool>) -> Array<bool>;
    fn get_array_contract_address(
        self: @TContractState, array: Array<ContractAddress>
    ) -> Array<ContractAddress>;
    fn get_array_sample_struct(
        self: @TContractState, array: Array<SampleStruct>
    ) -> Array<SampleStruct>;
    fn get_array_sample_nested_struct(
        self: @TContractState, array: Array<SampleNestedStruct>
    ) -> Array<SampleNestedStruct>;
    fn get_array_struct_with_five_elements(
        self: @TContractState, array: Array<StructWithFiveElements>
    ) -> Array<StructWithFiveElements>;
    fn get_array_struct_with_eight_elements(
        self: @TContractState, array: Array<StructWithEightElements>
    ) -> Array<StructWithEightElements>;
    fn get_array_struct_with_4_layers(
        self: @TContractState, array: Array<StructWith4Layers>
    ) -> Array<StructWith4Layers>;

    // Getters for Span
    fn get_span_u256(self: @TContractState, span: Span<u256>) -> Span<u256>;
    fn get_span_felt252(self: @TContractState, span: Span<felt252>) -> Span<felt252>;
    fn get_span_bool(self: @TContractState, span: Span<bool>) -> Span<bool>;
    fn get_span_contract_address(
        self: @TContractState, span: Span<ContractAddress>
    ) -> Span<ContractAddress>;

    // Get value at index for Array
    fn get_array_value_u256(self: @TContractState, array: Array<u256>, index: u32) -> u256;
    fn get_array_value_felt252(self: @TContractState, array: Array<felt252>, index: u32) -> felt252;
    fn get_array_value_bool(self: @TContractState, array: Array<bool>, index: u32) -> bool;
    fn get_array_value_contract_address(
        self: @TContractState, array: Array<ContractAddress>, index: u32
    ) -> ContractAddress;
    fn get_array_value_sample_struct(
        self: @TContractState, array: Array<SampleStruct>, index: u32
    ) -> SampleStruct;
    fn get_array_value_sample_nested_struct(
        self: @TContractState, array: Array<SampleNestedStruct>, index: u32
    ) -> SampleNestedStruct;
    fn get_array_value_struct_with_five_elements(
        self: @TContractState, array: Array<StructWithFiveElements>, index: u32
    ) -> StructWithFiveElements;
    fn get_array_value_struct_with_eight_elements(
        self: @TContractState, array: Array<StructWithEightElements>, index: u32
    ) -> StructWithEightElements;
    fn get_array_value_struct_with_4_layers(
        self: @TContractState, array: Array<StructWith4Layers>, index: u32
    ) -> StructWith4Layers;

    // Get value at index for Span
    fn get_span_value_u256(self: @TContractState, span: Span<u256>, index: u32) -> u256;
    fn get_span_value_felt252(self: @TContractState, span: Span<felt252>, index: u32) -> felt252;
    fn get_span_value_bool(self: @TContractState, span: Span<bool>, index: u32) -> bool;
    fn get_span_value_contract_address(
        self: @TContractState, span: Span<ContractAddress>, index: u32
    ) -> ContractAddress;
}

#[starknet::contract]
mod ArraysSpans {
    use core::num::traits::Zero;
    use core::traits::Into;
    use super::{
        IArraysSpans, SampleEnum, ContractAddress, SampleStruct, SampleNestedStruct,
        StructWithFiveElements, StructWithEightElements, StructWith4Layers, Layer3, Layer2, Layer1
    };

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl ArraysSpansImpl of IArraysSpans<ContractState> {
        // Getters for Array
        fn get_array_u256(self: @ContractState, array: Array<u256>) -> Array<u256> {
            array
        }

        fn get_array_felt252(self: @ContractState, array: Array<felt252>) -> Array<felt252> {
            array
        }

        fn get_array_bool(self: @ContractState, array: Array<bool>) -> Array<bool> {
            array
        }

        fn get_array_contract_address(
            self: @ContractState, array: Array<ContractAddress>
        ) -> Array<ContractAddress> {
            array
        }

        fn get_array_sample_struct(
            self: @ContractState, array: Array<SampleStruct>
        ) -> Array<SampleStruct> {
            array
        }

        fn get_array_sample_nested_struct(
            self: @ContractState, array: Array<SampleNestedStruct>
        ) -> Array<SampleNestedStruct> {
            array
        }

        fn get_array_struct_with_five_elements(
            self: @ContractState, array: Array<StructWithFiveElements>
        ) -> Array<StructWithFiveElements> {
            array
        }

        fn get_array_struct_with_eight_elements(
            self: @ContractState, array: Array<StructWithEightElements>
        ) -> Array<StructWithEightElements> {
            array
        }

        fn get_array_struct_with_4_layers(
            self: @ContractState, array: Array<StructWith4Layers>
        ) -> Array<StructWith4Layers> {
            array
        }

        // Getters for Span
        fn get_span_u256(self: @ContractState, span: Span<u256>) -> Span<u256> {
            span
        }

        fn get_span_felt252(self: @ContractState, span: Span<felt252>) -> Span<felt252> {
            span
        }

        fn get_span_bool(self: @ContractState, span: Span<bool>) -> Span<bool> {
            span
        }

        fn get_span_contract_address(
            self: @ContractState, span: Span<ContractAddress>
        ) -> Span<ContractAddress> {
            span
        }

        // Get value at index for Array
        fn get_array_value_u256(self: @ContractState, mut array: Array<u256>, index: u32) -> u256 {
            let mut result: u256 = 0;
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_felt252(
            self: @ContractState, mut array: Array<felt252>, index: u32
        ) -> felt252 {
            let mut result: felt252 = 0.into();
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_bool(self: @ContractState, mut array: Array<bool>, index: u32) -> bool {
            let mut result: bool = false;
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_contract_address(
            self: @ContractState, mut array: Array<ContractAddress>, index: u32
        ) -> ContractAddress {
            let mut result: ContractAddress = Zero::zero();
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_sample_struct(
            self: @ContractState, mut array: Array<SampleStruct>, index: u32
        ) -> SampleStruct {
            let mut result: SampleStruct = SampleStruct {
                id: 0, name: "", status: SampleEnum::enum1(0),
            };
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_sample_nested_struct(
            self: @ContractState, mut array: Array<SampleNestedStruct>, index: u32
        ) -> SampleNestedStruct {
            let mut result: SampleNestedStruct = SampleNestedStruct {
                user: Zero::zero(),
                data: SampleStruct { id: 0, name: "", status: SampleEnum::enum1(0), },
                status: SampleEnum::enum1(0),
            };
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_struct_with_five_elements(
            self: @ContractState, mut array: Array<StructWithFiveElements>, index: u32
        ) -> StructWithFiveElements {
            let mut result: StructWithFiveElements = StructWithFiveElements {
                element1: 0,
                element2: 0.into(),
                element3: "",
                element4: Zero::zero(),
                element5: false,
            };
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_struct_with_eight_elements(
            self: @ContractState, mut array: Array<StructWithEightElements>, index: u32
        ) -> StructWithEightElements {
            let mut result: StructWithEightElements = StructWithEightElements {
                element1: 0,
                element2: 0.into(),
                element3: "",
                element4: Zero::zero(),
                element5: false,
                element6: 0,
                element7: 0,
                element8: index.into(),
            };
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        fn get_array_value_struct_with_4_layers(
            self: @ContractState, mut array: Array<StructWith4Layers>, index: u32
        ) -> StructWith4Layers {
            let mut result: StructWith4Layers = StructWith4Layers {
                layer4_element: Layer3 {
                    layer3_element: Layer2 { layer2_element: Layer1 { layer1_element: 0 }, },
                },
            };
            loop {
                if array.len() == index {
                    result = array.pop_front().unwrap();
                    break;
                }
                let _ = array.pop_front().unwrap();
            };
            result
        }

        // Get value at index for Span
        fn get_span_value_u256(self: @ContractState, mut span: Span<u256>, index: u32) -> u256 {
            let mut result: u256 = 0;
            loop {
                if span.len() == index {
                    result = *span.pop_front().unwrap();
                    break;
                }
                let _ = span.pop_front().unwrap();
            };
            result
        }

        fn get_span_value_felt252(
            self: @ContractState, mut span: Span<felt252>, index: u32
        ) -> felt252 {
            let mut result: felt252 = 0.into();
            loop {
                if span.len() == index {
                    result = *span.pop_front().unwrap();
                    break;
                }
                let _ = span.pop_front().unwrap();
            };
            result
        }

        fn get_span_value_bool(self: @ContractState, mut span: Span<bool>, index: u32) -> bool {
            let mut result: bool = false;
            loop {
                if span.len() == index {
                    result = *span.pop_front().unwrap();
                    break;
                }
                let _ = span.pop_front().unwrap();
            };
            result
        }

        fn get_span_value_contract_address(
            self: @ContractState, mut span: Span<ContractAddress>, index: u32
        ) -> ContractAddress {
            let mut result: ContractAddress = Zero::zero();
            loop {
                if span.len() == index {
                    result = *span.pop_front().unwrap();
                    break;
                }
                let _ = span.pop_front().unwrap();
            };
            result
        }
    }
}
