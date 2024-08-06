use sncast_std::{
    declare, deploy, invoke, call, DeclareResult, DeployResult, InvokeResult, CallResult, get_nonce,
    FeeSettings, EthFeeSettings, ScriptCommandError
};
use core::serde::Serde;
use starknet::{testing::cheatcode, ContractAddress, ClassHash};

fn main() {
    let max_fee = 99999999999999999;
    let salt = 0x3;
    let declare_nonce = get_nonce('latest');
    //owner address argument goes here as an argument
    //todo obtain owner address from environment variable .env
    let owner = 0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691;
    
    let declare_result = declare(
        "YourContract",
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(declare_nonce)
    ).expect('declare failed'); 
    let class_hash : ClassHash = declare_result.class_hash.try_into()
    .expect('Invalid class hash value');
    println!("declare result: {}", declare_result);

    
    let deploy_nonce = get_nonce('pending');
    let deploy_result = deploy(
        class_hash,
        array![owner.into()],
        Option::Some(salt),
        true,
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(deploy_nonce)
    ).expect('contract deploy failed');

    println!("Deployed the contract to address: {}", deploy_result);
}

