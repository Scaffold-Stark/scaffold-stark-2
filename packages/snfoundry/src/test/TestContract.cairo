use contracts::YourContract::{IYourContractDispatcher, IYourContractDispatcherTrait};
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use starknet::{ContractAddress, contract_address_const};

fn OWNER() -> ContractAddress {
    contract_address_const::<'OWNER'>()
}

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let mut calldata = array![];
    calldata.append_serde(OWNER());
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}

#[test]
fn test_deployment_values() {
    let contract_address = deploy_contract("YourContract");

    let dispatcher = IYourContractDispatcher { contract_address };

    let current_greeting = dispatcher.greeting();
    let expected_greeting: ByteArray = "Building Unstoppable Apps!!!";
    assert(current_greeting == expected_greeting, 'Should have the right message');

    let new_greeting: ByteArray = "Learn Scaffold-Stark 2! :)";
    dispatcher.set_greeting(new_greeting.clone(), 0); // we transfer 0 eth
    assert(dispatcher.greeting() == new_greeting, 'Should allow set new message');
}
