use core::byte_array::ByteArray;
use sncast_std::{
    declare, deploy, invoke, call, DeclareResult, DeclareResultTrait, DeployResult, InvokeResult,
    CallResult, get_nonce, FeeSettings, EthFeeSettings
};


// build the constructor calldata here
fn build_constructor_calldata() -> Array::<felt252> {
    //constructor calldata goes here
    // dev-network owner address argument goes here as an argument
    //let owner = 0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec;
    // sepolia owner address argument goes here as an argument
    let owner = 0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691;
    array![owner.into()]
}

fn build_contract_name() -> ByteArray{
    "YourContract"
}


fn main() {
    let max_fee = 99999999999999999;
    let salt = 0x3;
    let declare_nonce = get_nonce('latest');
    let contract_name = build_contract_name();
    let declare_result = declare(
        contract_name,
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(declare_nonce)
    ).expect('declare failed'); 
    let class_hash = declare_result.class_hash();
    println!("declare result: {}", declare_result);

    let constructor_calldata = build_constructor_calldata();
    let deploy_nonce = get_nonce('pending');
    let deploy_result = deploy(
        *class_hash,
        constructor_calldata,
        Option::Some(salt),
        true,
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(deploy_nonce)
    ).expect('contract deploy failed');

    println!("Deployed the contract to address: {}", deploy_result);
}