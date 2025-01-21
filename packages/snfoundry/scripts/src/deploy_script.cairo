use core::byte_array::ByteArray;
use sncast_std::{
    declare, deploy, invoke, call, DeclareResult, DeclareResultTrait, DeployResult, InvokeResult,
    CallResult, get_nonce, FeeSettings, EthFeeSettings
};


fn main() {
    let max_fee = 99999999999999999;
    let salt = 0x3;
    let declare_nonce = get_nonce('latest');
    //owner address argument goes here as an argument
    //let owner = 0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691;

    let declare_result = declare(
        "YourContract",
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(declare_nonce)
    ).expect('declare failed'); 
    let class_hash = declare_result.class_hash();
    println!("declare result: {}", declare_result);

    //FOR SEPOLIA DEPLOYMENT, IF DECLARE FAILED WITH ERROR "TRANSACTION REJECTED, Class with hash 0X123... IS ALREADY DECLARED",
    // COMMENT OUT THE DECLARE PROCESS AND, UNCOMMENT THE BELOW, THEN PASS IN THE ALREADY DECLARED HASH (ONLY FOR SEPOLIA DEPLOYMENT)
    // let class_hash = ;

    // let deploy_nonce = get_nonce('pending');
    // let deploy_result = deploy(
    //     *class_hash,
    //     array![owner.into()],
    //     Option::Some(salt),
    //     true,
    //     FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
    //     Option::Some(deploy_nonce)
    // ).expect('contract deploy failed');

    // println!("Deployed the contract to address: {}", deploy_result);
}