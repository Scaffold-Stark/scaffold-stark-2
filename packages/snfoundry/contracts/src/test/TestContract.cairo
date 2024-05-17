use starknet::{ContractAddress, contract_address_const};

use snforge_std::{declare, ContractClassTrait};
use openzeppelin::utils::serde::SerializedAppend;

use contracts::YourContract::{
    IYourContractSafeDispatcher, IYourContractSafeDispatcherTrait, IYourContractDispatcher,
    IYourContractDispatcherTrait
};

use openzeppelin::tests::utils::constants::{
    ZERO, OWNER, SPENDER, RECIPIENT, NAME, SYMBOL, DECIMALS, SUPPLY, VALUE
};

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name);
    let mut calldata = array![];
    calldata.append_serde(OWNER());
    contract.deploy(@calldata).unwrap()
}

#[test]
fn test_deployment_values() {
    let contract_address = deploy_contract("YourContract");

    let dispatcher = IYourContractDispatcher { contract_address };

    let current_gretting = dispatcher.gretting();
    let expected_gretting: ByteArray = "Building Unstoppable Apps!!!";
    assert_eq!(current_gretting, expected_gretting, "Should have the right message on deploy");

    let new_greeting: ByteArray = "Learn Scaffold-ETH 2! :)";
    dispatcher.set_gretting(new_greeting.clone(), 0); // we transfer 0 eth

    assert_eq!(dispatcher.gretting(), new_greeting, "Should allow setting a new message");
}
