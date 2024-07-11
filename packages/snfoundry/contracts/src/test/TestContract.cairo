use contracts::YourContract::{IYourContractDispatcher, IYourContractDispatcherTrait};
use openzeppelin::utils::serde::SerializedAppend;
use snforge_std::{declare, ContractClassTrait};
use starknet::{ContractAddress, contract_address_const};

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap();
    let mut calldata = array![];
    let owner = contract_address_const::<'OWNER'>();
    calldata.append_serde(owner);
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}

#[test]
fn test_deployment_values() {
    let contract_address = deploy_contract("YourContract");

    let dispatcher = IYourContractDispatcher { contract_address };

    let current_gretting = dispatcher.gretting();
    let expected_gretting: ByteArray = "Building Unstoppable Apps!!!";
    assert_eq!(current_gretting, expected_gretting, "Should have the right message on deploy");

    let new_greeting: ByteArray = "Learn Scaffold-Stark 2! :)";
    dispatcher.set_gretting(new_greeting.clone(), 0); // we transfer 0 eth

    assert_eq!(dispatcher.gretting(), new_greeting, "Should allow setting a new message");
}
