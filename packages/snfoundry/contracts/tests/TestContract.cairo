use contracts::YourContract::{IYourContractDispatcher, IYourContractDispatcherTrait};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{CheatSpan, ContractClassTrait, DeclareResultTrait, cheat_caller_address, declare};
use starknet::{ContractAddress, contract_address_const};

// Real contract address deployed on Sepolia
fn OWNER() -> ContractAddress {
    contract_address_const::<0x02dA5254690b46B9C4059C25366D1778839BE63C142d899F0306fd5c312A5918>()
}

const ETH_CONTRACT_ADDRESS: felt252 =
    0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract_class = declare(name).unwrap().contract_class();
    let mut calldata = array![];
    calldata.append_serde(OWNER());
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
    let user = OWNER();
    let eth_contract_address = contract_address_const::<ETH_CONTRACT_ADDRESS>();
    let your_contract_address = deploy_contract("YourContract");

    let your_contract_dispatcher = IYourContractDispatcher {
        contract_address: your_contract_address,
    };
    let erc20_dispatcher = IERC20Dispatcher { contract_address: eth_contract_address };
    let amount_to_transfer = 500;
    cheat_caller_address(eth_contract_address, user, CheatSpan::TargetCalls(1));
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

