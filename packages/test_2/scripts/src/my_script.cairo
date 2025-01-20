use sncast_std::{
    declare, deploy, invoke, call, DeclareResult, DeclareResultTrait, DeployResult, InvokeResult,
    CallResult, get_nonce, FeeSettings, EthFeeSettings
};

fn main() {
    let contract_address = 0x07e867f1fa6da2108dd2b3d534f1fbec411c5ec9504eb3baa1e49c7a0bef5ab5;
    let call_result = call(contract_address.try_into().unwrap(), selector!("get_greeting"), array![]).expect('call failed');
    assert(*call_result.data[1]=='Hello, Starknet!', *call_result.data[1]);
    println!("{:?}", call_result);

    let max_fee = 999999999999999;
    let salt = 0x3;

    let declare_nonce = get_nonce('latest');

    let declare_result = declare(
        "MapContract",
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(declare_nonce)
    ).expect('map declare failed');

    let class_hash = declare_result.class_hash();
    let deploy_nonce = get_nonce('pending');

    let deploy_result = deploy(
        *class_hash,
        ArrayTrait::new(),
        Option::Some(salt),
        true,
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(deploy_nonce)
    )
        .expect('map deploy failed');

    assert(deploy_result.transaction_hash != 0, deploy_result.transaction_hash);
}