
u can usging  `sncast --account account-1 script run my_script --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7` at folder `scripts`
then will return

```bash
Result::Err(ScriptCommandError::ProviderError(ProviderError::StarknetError(StarknetError::DuplicateTx(()))))
command: script run
status: success

```

the source cairo code is 

```cairo

use sncast_std::{
    declare, deploy, invoke, call, DeclareResult, DeclareResultTrait, DeployResult, InvokeResult,
    CallResult, get_nonce, FeeSettings, EthFeeSettings
};

fn main() {
    // let contract_address = 0x07e867f1fa6da2108dd2b3d534f1fbec411c5ec9504eb3baa1e49c7a0bef5ab5;
    // let call_result = call(contract_address.try_into().unwrap(), selector!("get_greeting"), array![]).expect('call failed');
    // assert(*call_result.data[1]=='Hello, Starknet!', *call_result.data[1]);
    // println!("{:?}", call_result);

    let max_fee = 999999999999999;
    let salt = 0x3;

    let declare_nonce = get_nonce('latest');

    let declare_result = declare(
        "MapContract",
        FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
        Option::Some(declare_nonce)
    );

    println!("{:?}", declare_result);

    // let class_hash = declare_result.class_hash();
    // let deploy_nonce = get_nonce('pending');

    // let deploy_result = deploy(
    //     *class_hash,
    //     ArrayTrait::new(),
    //     Option::Some(salt),
    //     true,
    //     FeeSettings::Eth(EthFeeSettings { max_fee: Option::Some(max_fee) }),
    //     Option::Some(deploy_nonce)
    // )
    //     .expect('map deploy failed');

    // assert(deploy_result.transaction_hash != 0, deploy_result.transaction_hash);
}

```




sncast script run my_script --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

sncast --account account-1 script run my_script --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

sncast account import --url https://starknet-sepolia.reddio.com/rpc/v0_7    --address 0x04097f4882C50bDdBaFe1A79337bDaBDf001456430aDede37F36E47E22d135De    --private-key 0x028a46eddc7615d00e21d31dc959d2721c3cc5b267e381b7fd4c7931f3e61dfe  --type argent


sncast account import --url http://127.0.0.0:5050    --address 0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec    --private-key 0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912  --type oz

sncast account import --url http://127.0.0.1:5050  --address 0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec --private-key 0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912 --type oz


sncast --account account-2 script run my_script --url http://127.0.0.1:5050




