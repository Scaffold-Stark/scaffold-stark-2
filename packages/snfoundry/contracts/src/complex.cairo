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

#[derive(Drop, Serde, starknet::Store)]
struct StructWithTuple {
    tuple_element: (u256, ByteArray, bool),
    element2: ContractAddress,
}

#[derive(Drop, Serde, starknet::Store)]
struct ComplexStruct {
    u256_id: u256,
    optional_data: Option<SampleStruct>,
    result_status: Result<bool, u64>,
    nested_struct: StructWith4Layers,
    tuple_data: (u256, ByteArray),
}

#[starknet::interface]
pub trait IComplex<TContractState> {
    // Struct getters
    fn get_struct_with_tuple(self: @TContractState) -> StructWithTuple;
    fn get_complex_struct(self: @TContractState) -> ComplexStruct;
    fn get_tuple_of_complex_struct_which_contains_tuple(
        self: @TContractState
    ) -> (ComplexStruct, StructWithTuple);

    // Struct getters with keys
    fn get_struct_with_tuple_with_key(self: @TContractState, key: felt252) -> StructWithTuple;
    fn get_complex_struct_with_key(self: @TContractState, key: felt252) -> ComplexStruct;
    fn get_tuple_of_complex_struct_which_contains_tuple_with_key(
        self: @TContractState, key: felt252
    ) -> (ComplexStruct, StructWithTuple);

    // Struct getters with values
    fn get_struct_with_tuple_with_value(
        self: @TContractState, value: StructWithTuple
    ) -> StructWithTuple;
    fn get_complex_struct_with_value(self: @TContractState, value: ComplexStruct) -> ComplexStruct;
    fn get_tuple_of_complex_struct_which_contains_tuple_with_value(
        self: @TContractState, value: (ComplexStruct, StructWithTuple)
    ) -> (ComplexStruct, StructWithTuple);

    // Struct setters with keys
    fn set_struct_with_tuple_with_key(
        ref self: TContractState, key: felt252, value: StructWithTuple
    );
    fn set_complex_struct_with_key(ref self: TContractState, key: felt252, value: ComplexStruct);
    fn set_tuple_of_complex_struct_which_contains_tuple_with_key(
        ref self: TContractState, key: felt252, value: (ComplexStruct, StructWithTuple)
    );

    // Function to read multiple values from complex types
    fn read_two_complex_values(
        self: @TContractState, key1: felt252, key2: felt252
    ) -> (StructWithTuple, ComplexStruct);
}

#[starknet::contract]
mod Complex {
    use super::{
        ContractAddress, IComplex, StructWithTuple, ComplexStruct, SampleStruct, StructWith4Layers
    };

    #[storage]
    struct Storage {
        mapping_struct_with_tuple: LegacyMap<felt252, StructWithTuple>,
        mapping_complex_struct: LegacyMap<felt252, ComplexStruct>,
        mapping_tuple_of_complex_struct_which_contains_tuple: LegacyMap<
            felt252, (ComplexStruct, StructWithTuple)
        >,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl ComplexImpl of IComplex<ContractState> {
        // Struct getters
        fn get_struct_with_tuple(self: @ContractState) -> StructWithTuple {
            self.mapping_struct_with_tuple.read(0)
        }

        fn get_complex_struct(self: @ContractState) -> ComplexStruct {
            self.mapping_complex_struct.read(0)
        }

        fn get_tuple_of_complex_struct_which_contains_tuple(
            self: @ContractState
        ) -> (ComplexStruct, StructWithTuple) {
            self.mapping_tuple_of_complex_struct_which_contains_tuple.read(0)
        }

        // Struct getters with keys
        fn get_struct_with_tuple_with_key(self: @ContractState, key: felt252) -> StructWithTuple {
            self.mapping_struct_with_tuple.read(key)
        }

        fn get_complex_struct_with_key(self: @ContractState, key: felt252) -> ComplexStruct {
            self.mapping_complex_struct.read(key)
        }

        fn get_tuple_of_complex_struct_which_contains_tuple_with_key(
            self: @ContractState, key: felt252
        ) -> (ComplexStruct, StructWithTuple) {
            self.mapping_tuple_of_complex_struct_which_contains_tuple.read(key)
        }

        // Struct getters with values
        fn get_struct_with_tuple_with_value(
            self: @ContractState, value: StructWithTuple
        ) -> StructWithTuple {
            value
        }

        fn get_complex_struct_with_value(
            self: @ContractState, value: ComplexStruct
        ) -> ComplexStruct {
            value
        }

        fn get_tuple_of_complex_struct_which_contains_tuple_with_value(
            self: @ContractState, value: (ComplexStruct, StructWithTuple)
        ) -> (ComplexStruct, StructWithTuple) {
            value
        }

        // Struct setters with keys
        fn set_struct_with_tuple_with_key(
            ref self: ContractState, key: felt252, value: StructWithTuple
        ) {
            self.mapping_struct_with_tuple.write(key, value);
        }

        fn set_complex_struct_with_key(
            ref self: ContractState, key: felt252, value: ComplexStruct
        ) {
            self.mapping_complex_struct.write(key, value);
        }

        fn set_tuple_of_complex_struct_which_contains_tuple_with_key(
            ref self: ContractState, key: felt252, value: (ComplexStruct, StructWithTuple)
        ) {
            self.mapping_tuple_of_complex_struct_which_contains_tuple.write(key, value);
        }

        // Function to read multiple values from complex types
        fn read_two_complex_values(
            self: @ContractState, key1: felt252, key2: felt252
        ) -> (StructWithTuple, ComplexStruct) {
            let value1 = self.mapping_struct_with_tuple.read(key1);
            let value2 = self.mapping_complex_struct.read(key2);
            (value1, value2)
        }
    }
}
