use contracts::YourContract::{
    IYourContractDispatcher, IYourContractDispatcherTrait, YourContract::STRK_CONTRACT_ADDRESS,
};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{CheatSpan, ContractClassTrait, DeclareResultTrait, cheat_caller_address, declare};
use starknet::{ContractAddress};

// Real contract address deployed on Sepolia
const OWNER: felt252 = 0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918;

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract_class = declare(name).unwrap().contract_class();
    let mut calldata = array![];
    calldata.append_serde(OWNER);
    let (contract_address, _) = contract_class.deploy(@calldata).unwrap();
    contract_address
}

#[test]
fn test_set_greetings() {
    let contract_address = deploy_contract("YourContract");

    let dispatcher = IYourContractDispatcher { contract_address };

    let current_greeting = dispatcher.greeting();
    let expected_greeting: ByteArray = "Building Unstoppable Apps!!!";
    assert(current_greeting == expected_greeting, 'Should have the right message');

    let new_greeting: ByteArray = "Learn Scaffold-Stark 2! :)";
    dispatcher.set_greeting(new_greeting.clone(), Option::None); // we dont transfer any eth
    assert(dispatcher.greeting() == new_greeting, 'Should allow set new message');
}

#[test]
#[fork("SEPOLIA_LATEST")]
fn test_transfer() {
    let user: ContractAddress = OWNER.try_into().unwrap();
    let strk_contract_address = STRK_CONTRACT_ADDRESS.try_into().unwrap();
    let your_contract_address = deploy_contract("YourContract");

    let your_contract_dispatcher = IYourContractDispatcher {
        contract_address: your_contract_address,
    };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: strk_contract_address };
    let amount_to_transfer = 500;
    cheat_caller_address(strk_contract_address, user, CheatSpan::TargetCalls(1));
    erc20_dispatcher.approve(your_contract_address, amount_to_transfer);
    let approved_amount = erc20_dispatcher.allowance(user, your_contract_address);
    assert(approved_amount == amount_to_transfer, 'Not the right amount approved');

    let new_greeting: ByteArray = "Learn Scaffold-Stark 2! :)";

    cheat_caller_address(your_contract_address, user, CheatSpan::TargetCalls(1));
    your_contract_dispatcher
        .set_greeting(
            new_greeting.clone(), Option::Some(amount_to_transfer),
        ); // we transfer 500 wei
    assert(your_contract_dispatcher.greeting() == new_greeting, 'Should allow set new message');
}
