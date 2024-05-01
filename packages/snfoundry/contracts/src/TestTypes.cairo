#[starknet::interface]
pub trait ITestTypes<TContractState> {
    // Methods to increase balance with different integer sizes
    fn set_uint8(ref self: TContractState, amount: u8);
    fn set_uint16(ref self: TContractState, amount: u16);
    fn set_uint32(ref self: TContractState, amount: u32);
    fn set_uint64(ref self: TContractState, amount: u64);
    fn set_uint128(ref self: TContractState, amount: u128);
    fn set_uint256(ref self: TContractState, amount: u256);

    // Methods to get balances with different integer sizes and increments
    fn get_uint8(self: @TContractState) -> u8;
    fn get_uint8_increment(self: @TContractState, amount: u8) -> u8;

    fn get_uint16(self: @TContractState) -> u16;
    fn get_uint16_increment(self: @TContractState, amount: u16) -> u16;

    fn get_uint32(self: @TContractState) -> u32;
    fn get_uint32_increment(self: @TContractState, amount: u32) -> u32;

    fn get_uint64(self: @TContractState) -> u64;
    fn get_uint64_increment(self: @TContractState, amount: u64) -> u64;

    fn get_uint128(self: @TContractState) -> u128;
    fn get_uint128_increment(self: @TContractState, amount: u128) -> u128;

    fn get_uint256(self: @TContractState) -> u256;
    fn get_uint256_increment(self: @TContractState, amount: u256) -> u256;

    // Methods for boolean values
    fn set_bool(ref self: TContractState, value: bool);
    fn get_bool(self: @TContractState) -> bool;
    fn toggle_bool(ref self: TContractState);

    // Method for a void type action
    fn void(ref self: TContractState);

    // Methods for boolean values
    fn set_byte_array(ref self: TContractState, value: ByteArray);
    fn get_byte_array(self: @TContractState) -> ByteArray;
}

#[starknet::contract]
mod TestTypes {
    #[storage]
    struct Storage {
        uint8: u8,
        uint16: u16,
        uint32: u32,
        uint64: u64,
        uint128: u128,
        uint256: u256,
        //  balance7: u512,
        bool_value: bool,
        byte_array: ByteArray,
    }

    #[abi(embed_v0)]
    impl TestTypes of super::ITestTypes<ContractState> {
        fn set_uint8(ref self: ContractState, amount: u8) {
            assert!(amount != 0, "Amount cannot be 0");
            self.uint8.write(self.uint8.read() + amount);
        }

        fn set_uint16(ref self: ContractState, amount: u16) {
            assert!(amount != 0, "Amount cannot be 0");
            self.uint16.write(self.uint16.read() + amount);
        }

        fn set_uint32(ref self: ContractState, amount: u32) {
            assert!(amount != 0, "Amount cannot be 0");
            self.uint32.write(self.uint32.read() + amount);
        }

        fn set_uint64(ref self: ContractState, amount: u64) {
            assert!(amount != 0, "Amount cannot be 0");
            self.uint64.write(self.uint64.read() + amount);
        }

        fn set_uint128(ref self: ContractState, amount: u128) {
            assert!(amount != 0, "Amount cannot be 0");
            self.uint128.write(self.uint128.read() + amount);
        }

        fn set_uint256(ref self: ContractState, amount: u256) {
            assert!(amount != 0, "Amount cannot be 0");
            self.uint256.write(self.uint256.read() + amount);
        }

        fn get_uint8(self: @ContractState) -> u8 {
            self.uint8.read()
        }

        fn get_uint16(self: @ContractState) -> u16 {
            self.uint16.read()
        }

        fn get_uint32(self: @ContractState) -> u32 {
            self.uint32.read()
        }

        fn get_uint64(self: @ContractState) -> u64 {
            self.uint64.read()
        }

        fn get_uint128(self: @ContractState) -> u128 {
            self.uint128.read()
        }

        fn get_uint256(self: @ContractState) -> u256 {
            self.uint256.read()
        }

        fn get_uint8_increment(self: @ContractState, amount: u8) -> u8 {
            self.uint8.read() + amount
        }

        fn get_uint16_increment(self: @ContractState, amount: u16) -> u16 {
            self.uint16.read() + amount
        }

        fn get_uint32_increment(self: @ContractState, amount: u32) -> u32 {
            self.uint32.read() + amount
        }

        fn get_uint64_increment(self: @ContractState, amount: u64) -> u64 {
            self.uint64.read() + amount
        }

        fn get_uint128_increment(self: @ContractState, amount: u128) -> u128 {
            self.uint128.read() + amount
        }

        fn get_uint256_increment(self: @ContractState, amount: u256) -> u256 {
            self.uint256.read() + amount
        }


        fn set_bool(ref self: ContractState, value: bool) {
            self.bool_value.write(value);
        }

        fn get_bool(self: @ContractState) -> bool {
            self.bool_value.read()
        }

        fn toggle_bool(ref self: ContractState) {
            let current = self.bool_value.read();
            self.bool_value.write(!current);
        }

        fn void(ref self: ContractState) {}


        fn set_byte_array(ref self: ContractState, value: ByteArray) {
            self.byte_array.write(value);
        }

        fn get_byte_array(self: @ContractState) -> ByteArray {
            self.byte_array.read()
        }
    }
}
