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
pub trait IStructs<TContractState> {
    // Struct getters
    fn get_sample_struct(self: @TContractState) -> SampleStruct;
    fn get_sample_nested_struct(self: @TContractState) -> SampleNestedStruct;
    fn get_sample_enum(self: @TContractState) -> SampleEnum;
    fn get_struct_with_five_elements(self: @TContractState) -> StructWithFiveElements;
    fn get_struct_with_eight_elements(self: @TContractState) -> StructWithEightElements;
    fn get_struct_with_4_layers(self: @TContractState) -> StructWith4Layers;

    // Struct getters with keys
    fn get_sample_struct_with_key(self: @TContractState, key: felt252) -> SampleStruct;
    fn get_sample_nested_struct_with_key(self: @TContractState, key: felt252) -> SampleNestedStruct;
    fn get_sample_enum_with_key(self: @TContractState, key: felt252) -> SampleEnum;
    fn get_struct_with_five_elements_with_key(
        self: @TContractState, key: felt252
    ) -> StructWithFiveElements;
    fn get_struct_with_eight_elements_with_key(
        self: @TContractState, key: felt252
    ) -> StructWithEightElements;
    fn get_struct_with_4_layers_with_key(self: @TContractState, key: felt252) -> StructWith4Layers;

    // Struct getters with values
    fn get_sample_struct_with_value(self: @TContractState, value: SampleStruct) -> SampleStruct;
    fn get_sample_nested_struct_with_value(
        self: @TContractState, value: SampleNestedStruct
    ) -> SampleNestedStruct;
    fn get_sample_enum_with_value(self: @TContractState, value: SampleEnum) -> SampleEnum;
    fn get_struct_with_five_elements_with_value(
        self: @TContractState, value: StructWithFiveElements
    ) -> StructWithFiveElements;
    fn get_struct_with_eight_elements_with_value(
        self: @TContractState, value: StructWithEightElements
    ) -> StructWithEightElements;
    fn get_struct_with_4_layers_with_value(
        self: @TContractState, value: StructWith4Layers
    ) -> StructWith4Layers;

    // Struct setters with keys
    fn set_sample_struct_with_key(ref self: TContractState, key: felt252, value: SampleStruct);
    fn set_sample_nested_struct_with_key(
        ref self: TContractState, key: felt252, value: SampleNestedStruct
    );
    fn set_sample_enum_with_key(ref self: TContractState, key: felt252, value: SampleEnum);
    fn set_struct_with_five_elements_with_key(
        ref self: TContractState, key: felt252, value: StructWithFiveElements
    );
    fn set_struct_with_eight_elements_with_key(
        ref self: TContractState, key: felt252, value: StructWithEightElements
    );
    fn set_struct_with_4_layers_with_key(
        ref self: TContractState, key: felt252, value: StructWith4Layers
    );
}

#[starknet::contract]
mod Structs {
    use starknet::storage::Map;
    use super::{
        ContractAddress, IStructs, SampleEnum, SampleNestedStruct, SampleStruct,
        StructWithFiveElements, StructWithEightElements, StructWith4Layers
    };

    #[storage]
    struct Storage {
        mapping_sample_struct: Map<felt252, SampleStruct>,
        mapping_sample_nested_struct: Map<felt252, SampleNestedStruct>,
        mapping_sample_enum: Map<felt252, SampleEnum>,
        mapping_struct_with_five_elements: Map<felt252, StructWithFiveElements>,
        mapping_struct_with_eight_elements: Map<felt252, StructWithEightElements>,
        mapping_struct_with_4_layers: Map<felt252, StructWith4Layers>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl StructsImpl of IStructs<ContractState> {
        // Struct getters
        fn get_sample_struct(self: @ContractState) -> SampleStruct {
            self.mapping_sample_struct.read(0)
        }

        fn get_sample_nested_struct(self: @ContractState) -> SampleNestedStruct {
            self.mapping_sample_nested_struct.read(0)
        }

        fn get_sample_enum(self: @ContractState) -> SampleEnum {
            self.mapping_sample_enum.read(0)
        }

        fn get_struct_with_five_elements(self: @ContractState) -> StructWithFiveElements {
            self.mapping_struct_with_five_elements.read(0)
        }

        fn get_struct_with_eight_elements(self: @ContractState) -> StructWithEightElements {
            self.mapping_struct_with_eight_elements.read(0)
        }

        fn get_struct_with_4_layers(self: @ContractState) -> StructWith4Layers {
            self.mapping_struct_with_4_layers.read(0)
        }

        // Struct getters with keys
        fn get_sample_struct_with_key(self: @ContractState, key: felt252) -> SampleStruct {
            self.mapping_sample_struct.read(key)
        }

        fn get_sample_nested_struct_with_key(
            self: @ContractState, key: felt252
        ) -> SampleNestedStruct {
            self.mapping_sample_nested_struct.read(key)
        }

        fn get_sample_enum_with_key(self: @ContractState, key: felt252) -> SampleEnum {
            self.mapping_sample_enum.read(key)
        }

        fn get_struct_with_five_elements_with_key(
            self: @ContractState, key: felt252
        ) -> StructWithFiveElements {
            self.mapping_struct_with_five_elements.read(key)
        }

        fn get_struct_with_eight_elements_with_key(
            self: @ContractState, key: felt252
        ) -> StructWithEightElements {
            self.mapping_struct_with_eight_elements.read(key)
        }

        fn get_struct_with_4_layers_with_key(
            self: @ContractState, key: felt252
        ) -> StructWith4Layers {
            self.mapping_struct_with_4_layers.read(key)
        }

        // Struct getters with values
        fn get_sample_struct_with_value(self: @ContractState, value: SampleStruct) -> SampleStruct {
            value
        }

        fn get_sample_nested_struct_with_value(
            self: @ContractState, value: SampleNestedStruct
        ) -> SampleNestedStruct {
            value
        }

        fn get_sample_enum_with_value(self: @ContractState, value: SampleEnum) -> SampleEnum {
            value
        }

        fn get_struct_with_five_elements_with_value(
            self: @ContractState, value: StructWithFiveElements
        ) -> StructWithFiveElements {
            value
        }

        fn get_struct_with_eight_elements_with_value(
            self: @ContractState, value: StructWithEightElements
        ) -> StructWithEightElements {
            value
        }

        fn get_struct_with_4_layers_with_value(
            self: @ContractState, value: StructWith4Layers
        ) -> StructWith4Layers {
            value
        }

        // Struct setters with keys
        fn set_sample_struct_with_key(ref self: ContractState, key: felt252, value: SampleStruct) {
            self.mapping_sample_struct.write(key, value);
        }

        fn set_sample_nested_struct_with_key(
            ref self: ContractState, key: felt252, value: SampleNestedStruct
        ) {
            self.mapping_sample_nested_struct.write(key, value);
        }

        fn set_sample_enum_with_key(ref self: ContractState, key: felt252, value: SampleEnum) {
            self.mapping_sample_enum.write(key, value);
        }

        fn set_struct_with_five_elements_with_key(
            ref self: ContractState, key: felt252, value: StructWithFiveElements
        ) {
            self.mapping_struct_with_five_elements.write(key, value);
        }

        fn set_struct_with_eight_elements_with_key(
            ref self: ContractState, key: felt252, value: StructWithEightElements
        ) {
            self.mapping_struct_with_eight_elements.write(key, value);
        }

        fn set_struct_with_4_layers_with_key(
            ref self: ContractState, key: felt252, value: StructWith4Layers
        ) {
            self.mapping_struct_with_4_layers.write(key, value);
        }
    }
}
