use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub enum SampleEnum {
    #[default]
    enum1: u256,
    enum2: u256,
    enum3: ByteArray,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct SampleStruct {
    pub id: u256,
    pub name: ByteArray,
    pub status: SampleEnum,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct SampleNestedStruct {
    pub user: ContractAddress,
    pub data: SampleStruct,
    pub status: SampleEnum,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct StructWithFiveElements {
    pub element1: u256,
    pub element2: felt252,
    pub element3: ByteArray,
    pub element4: ContractAddress,
    pub element5: bool,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct StructWithEightElements {
    pub element1: u256,
    pub element2: felt252,
    pub element3: ByteArray,
    pub element4: ContractAddress,
    pub element5: bool,
    pub element6: u64,
    pub element7: i128,
    pub element8: bytes31,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Layer1 {
    pub layer1_element: u256,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Layer2 {
    pub layer2_element: Layer1,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Layer3 {
    pub layer3_element: Layer2,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct StructWith4Layers {
    pub layer4_element: Layer3,
}
