use sncast_std::{call, CallResult};

// The example below uses a contract deployed to the Sepolia testnet
fn main() {
    let contract_address = 0x07e867f1fa6da2108dd2b3d534f1fbec411c5ec9504eb3baa1e49c7a0bef5ab5;
    let call_result = call(contract_address.try_into().unwrap(), selector!("get_greeting"), array![]).expect('call failed');
    assert(*call_result.data[1]=='Hello, Starknet!', *call_result.data[1]);
    println!("{:?}", call_result);
}
