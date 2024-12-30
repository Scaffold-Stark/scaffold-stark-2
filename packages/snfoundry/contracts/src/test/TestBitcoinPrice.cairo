use contracts::cryptos::BitcoinPrice::BetInfos;
use contracts::cryptos::BitcoinPrice::{IBitcoinPriceDispatcher, IBitcoinPriceDispatcherTrait};
use core::traits::TryInto;
use openzeppelin::tests::utils::constants::OWNER;
use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
use openzeppelin::utils::serde::SerializedAppend;
use snforge_std::{
    CheatSpan, CheatTarget, ContractClassTrait, declare, prank, start_warp, stop_warp,
};
use starknet::ContractAddress;
use starknet::contract_address::contract_address_const;


const ETH_CONTRACT_ADDRESS: felt252 =
    0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7;

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap();
    let mut calldata = array![];

    let end_vote_bet_timestamp: u64 = 1719168900000;
    let end_bet_timestamp: u64 = 1719168900000_u64;
    let oracle_address: ContractAddress = contract_address_const::<
        0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b,
    >();
    calldata.append_serde(end_vote_bet_timestamp);
    calldata.append_serde(end_bet_timestamp);
    calldata.append_serde(6525086850_u256);
    calldata.append_serde(OWNER());
    calldata.append_serde(oracle_address);
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}

fn setup() -> IERC20CamelDispatcher {
    //let contract_address = deploy_contract("BitcoinPrice");
    //contract_address.print();
    //let dispatcher = IBitcoinPriceDispatcher { contract_address };

    let eth_contract_address = ETH_CONTRACT_ADDRESS.try_into().unwrap();
    let eth_token = IERC20CamelDispatcher { contract_address: eth_contract_address };
    eth_token
}


#[test]
#[fork("TEST")]
fn test_vote_yes() {
    let user_address: ContractAddress =
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d
        .try_into()
        .unwrap();
    let contract_address = deploy_contract("BitcoinPrice");
    let eth_token = setup();
    prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(3));
    let dispatcher = IBitcoinPriceDispatcher { contract_address };
    let current_bet_id = dispatcher.get_current_bet().id;
    assert!(
        dispatcher.get_own_yes_amount(user_address, current_bet_id) == 0,
        "User balance is suposed to be 0",
    );

    assert!(
        eth_token.balanceOf(dispatcher.contract_address) == 0,
        "Contract balance is suposed to be 0",
    );
    prank(CheatTarget::One(eth_token.contract_address), user_address, CheatSpan::TargetCalls(1));
    eth_token.approve(contract_address, 1);
    dispatcher.vote_yes(1);

    assert!(
        eth_token.balanceOf(dispatcher.contract_address) == 1,
        "Contract balance is suposed to be 1",
    );

    let new_state = dispatcher.get_current_bet();
    assert!(new_state.total_amount == 1, "State is suposed to be 1");
    assert!(new_state.total_amount_yes == 1, "State is suposed to be 1");
    assert!(new_state.total_amount_no == 0, "State is suposed to be 0");

    prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(1));
    assert!(
        dispatcher.get_own_yes_amount(user_address, current_bet_id) == 1,
        "User balance is suposed to be 1",
    );
}


#[test]
#[fork("TEST")]
fn test_vote_no() {
    let user_address: ContractAddress =
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d
        .try_into()
        .unwrap();
    let contract_address = deploy_contract("BitcoinPrice");
    let eth_token = setup();
    prank(
        CheatTarget::One(contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(3),
    );
    let dispatcher = IBitcoinPriceDispatcher { contract_address };
    let current_bet_id = dispatcher.get_current_bet().id;
    assert!(
        dispatcher.get_own_no_amount(user_address, current_bet_id) == 0,
        "User balance is suposed to be 0",
    );

    assert!(
        eth_token.balanceOf(dispatcher.contract_address) == 0,
        "Contract balance is suposed to be 0",
    );
    prank(
        CheatTarget::One(eth_token.contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    eth_token.approve(contract_address, 1);
    dispatcher.vote_no(1);

    assert!(
        eth_token.balanceOf(dispatcher.contract_address) == 1,
        "Contract balance is suposed to be 1",
    );

    let new_state = dispatcher.get_current_bet();
    assert!(new_state.total_amount == 1, "State is suposed to be 1");
    assert!(new_state.total_amount_no == 1, "State is suposed to be 1");
    assert!(new_state.total_amount_yes == 0, "State is suposed to be 0");

    prank(
        CheatTarget::One(contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    assert!(
        dispatcher.get_own_no_amount(user_address, current_bet_id) == 1,
        "User balance is suposed to be 1",
    );
}

#[test]
#[fork("TEST")]
fn test_get_bitcoin_price_from_pragma() {
    let contract_address = deploy_contract("BitcoinPrice");

    let dispatcher = IBitcoinPriceDispatcher { contract_address };

    let price = dispatcher.get_current_bet().token_price_start;

    assert!(price != 0, "Price is 0");
}


#[test]
#[fork("TEST")]
fn test_set_pragma_checkpoint() {
    let contract_address = deploy_contract("BitcoinPrice");

    let dispatcher = IBitcoinPriceDispatcher { contract_address };

    dispatcher.set_pragma_checkpoint();
}

#[test]
#[fork("TEST")]
fn test_set_bet_result_price() {
    let contract_address = deploy_contract("BitcoinPrice");

    let dispatcher = IBitcoinPriceDispatcher { contract_address };

    prank(
        CheatTarget::One(contract_address), OWNER().try_into().unwrap(), CheatSpan::TargetCalls(1),
    );
    dispatcher.set_bet_result_price();
}


#[test]
#[fork("TEST")]
fn test_claim_rewards() {
    let contract_address = deploy_contract("BitcoinPrice");

    let dispatcher = IBitcoinPriceDispatcher { contract_address };
    let current_bet_id = dispatcher.get_current_bet().id;
    let eth_token = setup();

    // Fund smart contract to cover gas fees
    prank(
        CheatTarget::One(eth_token.contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(2),
    );
    eth_token.approve(contract_address, 100000000);
    eth_token.transfer(contract_address, 100000000);

    // Set bet result price
    prank(
        CheatTarget::One(contract_address), OWNER().try_into().unwrap(), CheatSpan::TargetCalls(1),
    );
    dispatcher.set_bet_result_price();

    let current_bet = dispatcher.get_current_bet();
    assert!(
        current_bet.token_price_end == 6625086109850, "Result price is not correct",
    ); // reference price is 6525086109850
    assert!(current_bet.is_token_price_end_set == true, "Result price is not set");

    start_warp(CheatTarget::All, 4102444801_u64); // Change blocktimestamp to simulate end of bet
    prank(
        CheatTarget::One(contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    let rewards = dispatcher.claimRewards(current_bet_id);
    assert!(rewards == 0, "Rewards is not 0");
    stop_warp(CheatTarget::All);

    // Vote yes
    prank(
        CheatTarget::One(eth_token.contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    eth_token.approve(contract_address, 1);
    prank(
        CheatTarget::One(contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    dispatcher.vote_yes(1);

    // Vote no
    prank(
        CheatTarget::One(eth_token.contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    eth_token.approve(contract_address, 1);
    prank(
        CheatTarget::One(contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    dispatcher.vote_no(1);

    start_warp(CheatTarget::All, 4102444801_u64); // Change blocktimestamp

    prank(
        CheatTarget::One(contract_address),
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d.try_into().unwrap(),
        CheatSpan::TargetCalls(1),
    );
    let rewards = dispatcher.claimRewards(current_bet_id);
    assert!(rewards == 2, "Rewards is not 2");
}
