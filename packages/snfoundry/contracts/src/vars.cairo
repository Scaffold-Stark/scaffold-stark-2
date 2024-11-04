use starknet::{ContractAddress};

#[starknet::interface]
pub trait IVars<TContractState> {
    // contract variables
    fn get_u256(self: @TContractState) -> u256;
    fn get_felt(self: @TContractState) -> felt252;
    fn get_byte_array(self: @TContractState) -> ByteArray;
    fn get_contract_address(self: @TContractState) -> ContractAddress;
    fn get_bool(self: @TContractState) -> bool;
    fn get_u8(self: @TContractState) -> u8;
    fn get_u16(self: @TContractState) -> u16;
    fn get_u32(self: @TContractState) -> u32;
    fn get_u64(self: @TContractState) -> u64;
    fn get_u128(self: @TContractState) -> u128;
    fn get_i8(self: @TContractState) -> i8;
    fn get_i16(self: @TContractState) -> i16;
    fn get_i32(self: @TContractState) -> i32;
    fn get_i64(self: @TContractState) -> i64;
    fn get_i128(self: @TContractState) -> i128;
    fn get_bytes31(self: @TContractState) -> bytes31;
    fn get_non_zero_u256(self: @TContractState) -> NonZero<u256>;


    // get with value
    fn get_u256_with_value(self: @TContractState, value: u256) -> u256;
    fn get_felt_with_value(self: @TContractState, value: felt252) -> felt252;
    fn get_byte_array_with_value(self: @TContractState, value: ByteArray) -> ByteArray;
    fn get_contract_address_with_value(
        self: @TContractState, value: ContractAddress
    ) -> ContractAddress;
    fn get_bool_with_value(self: @TContractState, value: bool) -> bool;
    fn get_u8_with_value(self: @TContractState, value: u8) -> u8;
    fn get_u16_with_value(self: @TContractState, value: u16) -> u16;
    fn get_u32_with_value(self: @TContractState, value: u32) -> u32;
    fn get_u64_with_value(self: @TContractState, value: u64) -> u64;
    fn get_u128_with_value(self: @TContractState, value: u128) -> u128;
    fn get_i8_with_value(self: @TContractState, value: i8) -> i8;
    fn get_i16_with_value(self: @TContractState, value: i16) -> i16;
    fn get_i32_with_value(self: @TContractState, value: i32) -> i32;
    fn get_i64_with_value(self: @TContractState, value: i64) -> i64;
    fn get_i128_with_value(self: @TContractState, value: i128) -> i128;
    fn get_bytes31_with_value(self: @TContractState, value: bytes31) -> bytes31;
    fn get_non_zero_u256_with_value(self: @TContractState, value: NonZero<u256>) -> NonZero<u256>;

    // get with key
    fn get_u256_with_key(self: @TContractState, key: felt252) -> u256;
    fn get_felt_with_key(self: @TContractState, key: felt252) -> felt252;
    fn get_byte_array_with_key(self: @TContractState, key: felt252) -> ByteArray;
    fn get_contract_address_with_key(self: @TContractState, key: felt252) -> ContractAddress;
    fn get_bool_with_key(self: @TContractState, key: felt252) -> bool;
    fn get_u8_with_key(self: @TContractState, key: felt252) -> u8;
    fn get_u16_with_key(self: @TContractState, key: felt252) -> u16;
    fn get_u32_with_key(self: @TContractState, key: felt252) -> u32;
    fn get_u64_with_key(self: @TContractState, key: felt252) -> u64;
    fn get_u128_with_key(self: @TContractState, key: felt252) -> u128;
    fn get_i8_with_key(self: @TContractState, key: felt252) -> i8;
    fn get_i16_with_key(self: @TContractState, key: felt252) -> i16;
    fn get_i32_with_key(self: @TContractState, key: felt252) -> i32;
    fn get_i64_with_key(self: @TContractState, key: felt252) -> i64;
    fn get_i128_with_key(self: @TContractState, key: felt252) -> i128;
    fn get_bytes31_with_key(self: @TContractState, key: felt252) -> bytes31;
    fn get_non_zero_u256_with_key(self: @TContractState, key: felt252) -> NonZero<u256>;


    // setters
    fn set_u256_with_key(ref self: TContractState, key: felt252, value: u256);
    fn set_felt_with_key(ref self: TContractState, key: felt252, value: felt252);
    fn set_byte_array_with_key(ref self: TContractState, key: felt252, value: ByteArray);
    fn set_contract_address_with_key(
        ref self: TContractState, key: felt252, value: ContractAddress
    );
    fn set_bool_with_key(ref self: TContractState, key: felt252, value: bool);
    fn set_u8_with_key(ref self: TContractState, key: felt252, value: u8);
    fn set_u16_with_key(ref self: TContractState, key: felt252, value: u16);
    fn set_u32_with_key(ref self: TContractState, key: felt252, value: u32);
    fn set_u64_with_key(ref self: TContractState, key: felt252, value: u64);
    fn set_u128_with_key(ref self: TContractState, key: felt252, value: u128);
    fn set_i8_with_key(ref self: TContractState, key: felt252, value: i8);
    fn set_i16_with_key(ref self: TContractState, key: felt252, value: i16);
    fn set_i32_with_key(ref self: TContractState, key: felt252, value: i32);
    fn set_i64_with_key(ref self: TContractState, key: felt252, value: i64);
    fn set_i128_with_key(ref self: TContractState, key: felt252, value: i128);
    fn set_bytes31_with_key(ref self: TContractState, key: felt252, value: bytes31);
    fn set_non_zero_u256_with_key(ref self: TContractState, key: felt252, value: NonZero<u256>);
}

#[starknet::contract]
mod Vars {
    use starknet::storage::Map;
    use super::{ContractAddress, IVars};

    #[storage]
    struct Storage {
        mapping_u256: Map<felt252, u256>,
        mapping_felt: Map<felt252, felt252>,
        mapping_byte_array: Map<felt252, ByteArray>,
        mapping_contract_address: Map<felt252, ContractAddress>,
        mapping_bool: Map<felt252, bool>,
        mapping_u8: Map<felt252, u8>,
        mapping_u16: Map<felt252, u16>,
        mapping_u32: Map<felt252, u32>,
        mapping_u64: Map<felt252, u64>,
        mapping_u128: Map<felt252, u128>,
        mapping_i8: Map<felt252, i8>,
        mapping_i16: Map<felt252, i16>,
        mapping_i32: Map<felt252, i32>,
        mapping_i64: Map<felt252, i64>,
        mapping_i128: Map<felt252, i128>,
        mapping_bytes31: Map<felt252, bytes31>,
        mapping_non_zero_u256: Map<felt252, NonZero<u256>>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl VarsImpl of IVars<ContractState> {
        // contract variables
        fn get_u256(self: @ContractState) -> u256 {
            self.mapping_u256.read(0)
        }

        fn get_bool(self: @ContractState) -> bool {
            self.mapping_bool.read(0)
        }

        fn get_felt(self: @ContractState) -> felt252 {
            self.mapping_felt.read(0)
        }

        fn get_byte_array(self: @ContractState) -> ByteArray {
            self.mapping_byte_array.read(0)
        }

        fn get_contract_address(self: @ContractState) -> ContractAddress {
            self.mapping_contract_address.read(0)
        }

        fn get_u8(self: @ContractState) -> u8 {
            self.mapping_u8.read(0)
        }

        fn get_u16(self: @ContractState) -> u16 {
            self.mapping_u16.read(0)
        }

        fn get_u32(self: @ContractState) -> u32 {
            self.mapping_u32.read(0)
        }

        fn get_u64(self: @ContractState) -> u64 {
            self.mapping_u64.read(0)
        }

        fn get_u128(self: @ContractState) -> u128 {
            self.mapping_u128.read(0)
        }

        fn get_i8(self: @ContractState) -> i8 {
            self.mapping_i8.read(0)
        }

        fn get_i16(self: @ContractState) -> i16 {
            self.mapping_i16.read(0)
        }

        fn get_i32(self: @ContractState) -> i32 {
            self.mapping_i32.read(0)
        }

        fn get_i64(self: @ContractState) -> i64 {
            self.mapping_i64.read(0)
        }

        fn get_i128(self: @ContractState) -> i128 {
            self.mapping_i128.read(0)
        }

        fn get_bytes31(self: @ContractState) -> bytes31 {
            self.mapping_bytes31.read(0)
        }

        fn get_non_zero_u256(self: @ContractState) -> NonZero<u256> {
            self.mapping_non_zero_u256.read(0)
        }


        // get with key
        fn get_u256_with_key(self: @ContractState, key: felt252) -> u256 {
            self.mapping_u256.read(key)
        }

        fn get_bool_with_key(self: @ContractState, key: felt252) -> bool {
            self.mapping_bool.read(key)
        }

        fn get_felt_with_key(self: @ContractState, key: felt252) -> felt252 {
            self.mapping_felt.read(key)
        }

        fn get_byte_array_with_key(self: @ContractState, key: felt252) -> ByteArray {
            self.mapping_byte_array.read(key)
        }

        fn get_contract_address_with_key(self: @ContractState, key: felt252) -> ContractAddress {
            self.mapping_contract_address.read(key)
        }

        fn get_u8_with_key(self: @ContractState, key: felt252) -> u8 {
            self.mapping_u8.read(key)
        }

        fn get_u16_with_key(self: @ContractState, key: felt252) -> u16 {
            self.mapping_u16.read(key)
        }

        fn get_u32_with_key(self: @ContractState, key: felt252) -> u32 {
            self.mapping_u32.read(key)
        }

        fn get_u64_with_key(self: @ContractState, key: felt252) -> u64 {
            self.mapping_u64.read(key)
        }

        fn get_u128_with_key(self: @ContractState, key: felt252) -> u128 {
            self.mapping_u128.read(key)
        }

        fn get_i8_with_key(self: @ContractState, key: felt252) -> i8 {
            self.mapping_i8.read(key)
        }

        fn get_i16_with_key(self: @ContractState, key: felt252) -> i16 {
            self.mapping_i16.read(key)
        }

        fn get_i32_with_key(self: @ContractState, key: felt252) -> i32 {
            self.mapping_i32.read(key)
        }

        fn get_i64_with_key(self: @ContractState, key: felt252) -> i64 {
            self.mapping_i64.read(key)
        }

        fn get_i128_with_key(self: @ContractState, key: felt252) -> i128 {
            self.mapping_i128.read(key)
        }

        fn get_bytes31_with_key(self: @ContractState, key: felt252) -> bytes31 {
            self.mapping_bytes31.read(key)
        }

        fn get_non_zero_u256_with_key(self: @ContractState, key: felt252) -> NonZero<u256> {
            self.mapping_non_zero_u256.read(key)
        }


        // get with value

        fn get_u256_with_value(self: @ContractState, value: u256) -> u256 {
            value
        }

        fn get_bool_with_value(self: @ContractState, value: bool) -> bool {
            value
        }

        fn get_felt_with_value(self: @ContractState, value: felt252) -> felt252 {
            value
        }

        fn get_byte_array_with_value(self: @ContractState, value: ByteArray) -> ByteArray {
            value
        }

        fn get_contract_address_with_value(
            self: @ContractState, value: ContractAddress
        ) -> ContractAddress {
            value
        }

        fn get_u8_with_value(self: @ContractState, value: u8) -> u8 {
            value
        }

        fn get_u16_with_value(self: @ContractState, value: u16) -> u16 {
            value
        }

        fn get_u32_with_value(self: @ContractState, value: u32) -> u32 {
            value
        }

        fn get_u64_with_value(self: @ContractState, value: u64) -> u64 {
            value
        }

        fn get_u128_with_value(self: @ContractState, value: u128) -> u128 {
            value
        }

        fn get_i8_with_value(self: @ContractState, value: i8) -> i8 {
            value
        }

        fn get_i16_with_value(self: @ContractState, value: i16) -> i16 {
            value
        }

        fn get_i32_with_value(self: @ContractState, value: i32) -> i32 {
            value
        }

        fn get_i64_with_value(self: @ContractState, value: i64) -> i64 {
            value
        }

        fn get_i128_with_value(self: @ContractState, value: i128) -> i128 {
            value
        }

        fn get_bytes31_with_value(self: @ContractState, value: bytes31) -> bytes31 {
            value
        }

        fn get_non_zero_u256_with_value(
            self: @ContractState, value: NonZero<u256>
        ) -> NonZero<u256> {
            value
        }


        // set with key
        fn set_u256_with_key(ref self: ContractState, key: felt252, value: u256) {
            self.mapping_u256.write(key, value);
        }

        fn set_bool_with_key(ref self: ContractState, key: felt252, value: bool) {
            self.mapping_bool.write(key, value);
        }

        fn set_felt_with_key(ref self: ContractState, key: felt252, value: felt252) {
            self.mapping_felt.write(key, value);
        }

        fn set_byte_array_with_key(ref self: ContractState, key: felt252, value: ByteArray) {
            self.mapping_byte_array.write(key, value);
        }

        fn set_contract_address_with_key(
            ref self: ContractState, key: felt252, value: ContractAddress
        ) {
            self.mapping_contract_address.write(key, value);
        }

        fn set_u8_with_key(ref self: ContractState, key: felt252, value: u8) {
            self.mapping_u8.write(key, value);
        }

        fn set_u16_with_key(ref self: ContractState, key: felt252, value: u16) {
            self.mapping_u16.write(key, value);
        }

        fn set_u32_with_key(ref self: ContractState, key: felt252, value: u32) {
            self.mapping_u32.write(key, value);
        }

        fn set_u64_with_key(ref self: ContractState, key: felt252, value: u64) {
            self.mapping_u64.write(key, value);
        }

        fn set_u128_with_key(ref self: ContractState, key: felt252, value: u128) {
            self.mapping_u128.write(key, value);
        }

        fn set_i8_with_key(ref self: ContractState, key: felt252, value: i8) {
            self.mapping_i8.write(key, value);
        }

        fn set_i16_with_key(ref self: ContractState, key: felt252, value: i16) {
            self.mapping_i16.write(key, value);
        }

        fn set_i32_with_key(ref self: ContractState, key: felt252, value: i32) {
            self.mapping_i32.write(key, value);
        }

        fn set_i64_with_key(ref self: ContractState, key: felt252, value: i64) {
            self.mapping_i64.write(key, value);
        }

        fn set_i128_with_key(ref self: ContractState, key: felt252, value: i128) {
            self.mapping_i128.write(key, value);
        }

        fn set_bytes31_with_key(ref self: ContractState, key: felt252, value: bytes31) {
            self.mapping_bytes31.write(key, value);
        }

        fn set_non_zero_u256_with_key(ref self: ContractState, key: felt252, value: NonZero<u256>) {
            self.mapping_non_zero_u256.write(key, value);
        }
    }
}
