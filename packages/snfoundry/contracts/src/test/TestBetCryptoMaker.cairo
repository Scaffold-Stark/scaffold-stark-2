use contracts::cryptos::BetCryptoMaker::BetInfos;
use contracts::cryptos::BetCryptoMaker::{IBetCryptoMakerDispatcher, IBetCryptoMakerDispatcherTrait};
use contracts::cryptos::BetCryptoMaker::{ITokenManagerDispatcher, ITokenManagerDispatcherTrait};
use core::array::ArrayTrait;
use core::traits::Into;
use core::traits::TryInto;
use openzeppelin::tests::utils::constants::OWNER;
use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
use openzeppelin::utils::serde::SerializedAppend;
use snforge_std::{
    CheatSpan, CheatTarget, ContractClassTrait, declare, map_entry_address, prank, start_warp,
    stop_warp, store,
};
use starknet::ContractAddress;
use starknet::contract_address::contract_address_const;

const ETH_CONTRACT_ADDRESS: felt252 =
    0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7; // address eth for mainnet


fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap();
    let mut calldata = array![];
    let ORACLE_ADDRESS: ContractAddress = contract_address_const::<
        0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b // address for pragma oracle for mainnet
    >();

    calldata.append_serde(OWNER());
    calldata.append_serde(ORACLE_ADDRESS);
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}

fn setup() -> (IERC20CamelDispatcher, IERC20CamelDispatcher) {
    let eth_contract_address = ETH_CONTRACT_ADDRESS.try_into().unwrap();
    let eth_token = IERC20CamelDispatcher { contract_address: eth_contract_address };

    let nimbora_token_address: ContractAddress = contract_address_const::<
        0x316ec509f7ad89b7e6e03d15a436df634454f95e815536d616af03edc850fa3 // address for nimbora pendle for mainnet
    >();
    let nimbora_token = IERC20CamelDispatcher { contract_address: nimbora_token_address };
    (eth_token, nimbora_token)
}

#[test]
#[fork("TEST")]
fn test_create_bet() {
    let NIMBORA_ADDRESS: ContractAddress = contract_address_const::<
        0x3759ed21701538d2e1bc5896611166a06585cdbbeeddd1fbdd25da10b2174d3 // address for nimbora pendle for mainnet
    >();

    let contract_address = deploy_contract("BetCryptoMaker");
    let (eth_token, _) = setup();

    let dispatcher = IBetCryptoMakerDispatcher { contract_address };

    assert!(dispatcher.getTotalBets() == 0, "Total bets should be 0.");

    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher
        .createBet(
            "",
            "",
            'Cryptos',
            652086109850,
            1720083600000,
            1720083600000,
            eth_token.contract_address,
            NIMBORA_ADDRESS,
            '18669995996566340',
        );

    assert!(dispatcher.getTotalBets() == 1, "Total bets should be 1.");
    //dispatcher.claimRewards(78);
}


#[test]
#[fork("TEST")]
fn test_vote_yes() {
    let user_address: ContractAddress =
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d
        .try_into()
        .unwrap();
    let NIMBORA_ADDRESS: ContractAddress = contract_address_const::<
        0x3759ed21701538d2e1bc5896611166a06585cdbbeeddd1fbdd25da10b2174d3 // address for nimbora pendle for mainnet
    >();
    let contract_address = deploy_contract("BetCryptoMaker");
    let (eth_token, nimbora_token) = setup();

    let dispatcher = IBetCryptoMakerDispatcher { contract_address };

    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher
        .createBet(
            "",
            "",
            'Cryptos',
            652086109850,
            1720083600000,
            1720083600000,
            eth_token.contract_address,
            NIMBORA_ADDRESS,
            '18669995996566340',
        );

    let bet_id = dispatcher.getTotalBets();

    assert!(dispatcher.getBet(bet_id).total_shares_amount == 0, "Nimbora shares should be 0");
    assert!(
        dispatcher.get_yes_position(user_address, bet_id).amount == 0,
        "User balance is suposed to be 0",
    );
    assert!(eth_token.balanceOf(contract_address) == 0, "Contract balance is suposed to be 0");
    assert!(
        nimbora_token.balanceOf(contract_address) == 0,
        "Contract Nimbora balance is suposed to be 0",
    );

    prank(CheatTarget::One(eth_token.contract_address), user_address, CheatSpan::TargetCalls(1));
    eth_token.approve(contract_address, 7);

    prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(1));
    dispatcher.vote_yes(7, bet_id);

    assert!(
        dispatcher.get_yes_position(user_address, bet_id).amount == 7,
        "User balance is suposed to be 7",
    );

    assert!(eth_token.balanceOf(contract_address) == 0, "Contract balance is suposed to be 0");

    assert!(
        nimbora_token.balanceOf(contract_address) == 6,
        "Contract Nimbora balance is suposed to be 6",
    );

    assert!(dispatcher.getBet(bet_id).total_shares_amount == 6, "Nimbora shares should be 6");
}


#[test]
#[fork("TEST")]
fn test_settle_bet() {
    let user_address: ContractAddress =
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d
        .try_into()
        .unwrap();
    let NIMBORA_ADDRESS: ContractAddress = contract_address_const::<
        0x3759ed21701538d2e1bc5896611166a06585cdbbeeddd1fbdd25da10b2174d3 // address for nimbora pendle for mainnet
    >();
    let contract_address = deploy_contract("BetCryptoMaker");
    let (eth_token, nimbora_token) = setup();

    let dispatcher = IBetCryptoMakerDispatcher { contract_address };

    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher
        .createBet(
            "",
            "",
            'Cryptos',
            652086109850,
            1720083600000,
            1720083600000,
            eth_token.contract_address,
            NIMBORA_ADDRESS,
            'BTC/USD',
        );

    let bet_id = dispatcher.getTotalBets();

    prank(CheatTarget::One(eth_token.contract_address), user_address, CheatSpan::TargetCalls(1));
    eth_token.approve(contract_address, 7000000000000000000);

    prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(1));
    dispatcher.vote_yes(7000000000000000000, bet_id);

    assert!(dispatcher.getBet(bet_id).is_bet_ended == false, "Bet should be open");
    assert!(
        dispatcher.getBet(bet_id).winner_result.is_settled == false, "Bet should not be settled",
    );
    assert!(dispatcher.getBet(bet_id).is_nimbora_claimed == false, "Nimbora should not be claimed");

    assert!(
        nimbora_token.balanceOf(contract_address) == 6941957145251430232,
        "Contract Nimbora balance is suposed to be 6941957145251430232",
    );
    assert!(eth_token.balanceOf(contract_address) == 0, "Contract balance is suposed to be 0");

    // Settle the bet
    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.settleBet(bet_id);

    assert!(dispatcher.getBet(bet_id).winner_result.is_settled == true, "Bet should be settled");
    assert!(dispatcher.getBet(bet_id).winner_result.is_yes_outcome == true, "Winner should be yes");
    assert!(
        dispatcher.getBet(bet_id).winner_result.result_token_price == 6625086109850,
        "Result price not settled",
    );
    assert!(dispatcher.getBet(bet_id).is_bet_ended == true, "Bet should be closed");

    assert!(dispatcher.getBet(bet_id).is_nimbora_claimed == true, "Nimbora should be claimed");

    assert!(
        nimbora_token.balanceOf(contract_address) == 0,
        "Contract Nimbora balance is suposed to be 0",
    );

    let new_epoch: u256 = dispatcher.getBet(bet_id).nimbora.handled_epoch_withdrawal_len() + 2;

    let handled_epoch_withdrawal_len_array_value: Array<felt252> = array![
        new_epoch.low.into(), new_epoch.high.into(),
    ];

    store(
        NIMBORA_ADDRESS,
        selector!("handled_epoch_withdrawal_len"),
        handled_epoch_withdrawal_len_array_value.span(),
    );

    // let underlying = dispatcher.getBet(bet_id).nimbora.underlying();

    let amount = dispatcher
        .getBet(bet_id)
        .nimbora
        .convert_to_assets(dispatcher.getBet(bet_id).total_shares_amount);
    let map_value_balance: Array<felt252> = array![amount.low.into(), amount.high.into()];

    let map_key_balance: Array<felt252> = array![
        dispatcher.getBet(bet_id).nimbora.contract_address.try_into().unwrap(),
    ];

    store(
        eth_token.contract_address,
        map_entry_address(selector!("ERC20_balances"), map_key_balance.span()),
        map_value_balance.span(),
    );
    dispatcher.getBet(bet_id).nimbora.claim_withdrawal(contract_address, 0);
    assert!(
        eth_token.balanceOf(contract_address) == 6999999999999999999,
        "Contract balance is suposed to be 6999999999999999999",
    );
}
//652086109850
// 6625086109850  => value of btc from pragma at this block

#[test]
#[ignore]
#[fork("TEST")]
fn test_claim_rewards() {
    let user_address: ContractAddress =
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d
        .try_into()
        .unwrap();
    let NIMBORA_ADDRESS: ContractAddress = contract_address_const::<
        0x3759ed21701538d2e1bc5896611166a06585cdbbeeddd1fbdd25da10b2174d3 // address for nimbora pendle for mainnet
    >();
    let contract_address = deploy_contract("BetCryptoMaker");
    let (eth_token, nimbora_token) = setup();

    prank(CheatTarget::One(eth_token.contract_address), user_address, CheatSpan::TargetCalls(1));
    eth_token.approve(contract_address, 7000000000000000000);

    prank(
        CheatTarget::One(eth_token.contract_address), contract_address, CheatSpan::TargetCalls(1),
    );
    eth_token.transferFrom(user_address, contract_address, 7000000000000000000);

    let dispatcher = IBetCryptoMakerDispatcher { contract_address };

    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher
        .createBet(
            "",
            "",
            'Cryptos',
            652086109850,
            1720083600000,
            1720083600000,
            eth_token.contract_address,
            NIMBORA_ADDRESS,
            'BTC/USD',
        );

    let bet_id = dispatcher.getTotalBets();

    let initial_balanceOf_user = eth_token.balanceOf(user_address);

    prank(CheatTarget::One(eth_token.contract_address), user_address, CheatSpan::TargetCalls(1));
    eth_token.approve(contract_address, 7);

    prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(1));
    dispatcher.vote_yes(7, bet_id);

    assert!(dispatcher.getBet(bet_id).is_bet_ended == false, "Bet should be open");
    assert!(
        dispatcher.getBet(bet_id).winner_result.is_settled == false, "Bet should not be settled",
    );
    assert!(dispatcher.getBet(bet_id).is_nimbora_claimed == false, "Nimbora should not be claimed");

    assert!(
        nimbora_token.balanceOf(contract_address) == 6,
        "Contract Nimbora balance is suposed to be 6",
    );

    // Settle the bet
    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.settleBet(bet_id);

    assert!(dispatcher.getBet(bet_id).winner_result.is_settled == true, "Bet should be settled");
    assert!(dispatcher.getBet(bet_id).winner_result.is_yes_outcome == true, "Winner should be yes");
    assert!(
        dispatcher.getBet(bet_id).winner_result.result_token_price == 6625086109850,
        "Result price not settled",
    );
    assert!(dispatcher.getBet(bet_id).is_bet_ended == true, "Bet should be closed");

    assert!(dispatcher.getBet(bet_id).is_nimbora_claimed == true, "Nimbora should be claimed");

    assert!(
        nimbora_token.balanceOf(contract_address) == 0,
        "Contract Nimbora balance is suposed to be 0",
    );

    let new_epoch: u256 = dispatcher.getBet(bet_id).nimbora.handled_epoch_withdrawal_len() + 2;

    let handled_epoch_withdrawal_len_array_value: Array<felt252> = array![
        new_epoch.low.into(), new_epoch.high.into(),
    ];

    store(
        NIMBORA_ADDRESS,
        selector!("handled_epoch_withdrawal_len"),
        handled_epoch_withdrawal_len_array_value.span(),
    );

    // let underlying = dispatcher.getBet(bet_id).nimbora.underlying();

    let amount = dispatcher
        .getBet(bet_id)
        .nimbora
        .convert_to_assets(dispatcher.getBet(bet_id).total_shares_amount);
    let map_value_balance: Array<felt252> = array![amount.low.into(), amount.high.into()];

    let map_key_balance: Array<felt252> = array![
        dispatcher.getBet(bet_id).nimbora.contract_address.try_into().unwrap(),
    ];

    store(
        eth_token.contract_address,
        map_entry_address(selector!("ERC20_balances"), map_key_balance.span()),
        map_value_balance.span(),
    );
    dispatcher.getBet(bet_id).nimbora.claim_withdrawal(contract_address, 0);

    //prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(1));
    assert!(!dispatcher.checkHasClaimed(user_address, bet_id), "Bet is not supposed to be claimed");

    //Refaire un checkHasClaimed à faux à la toute fin

    prank(CheatTarget::One(contract_address), user_address, CheatSpan::TargetCalls(1));
    //(PLUS TARD) essayer de claim no et vérifier que cela ne fait rien car l'user n'a pas voté de
    //no

    assert!(
        eth_token.balanceOf(user_address) == initial_balanceOf_user - 7, "Wrong user balance (2)",
    );
    println!("BEFORE- {:?}", eth_token.balanceOf(user_address));
    dispatcher.claimRewards(bet_id, true);
    println!("AFTER- {:?}", eth_token.balanceOf(user_address));
    assert!(
        eth_token.balanceOf(user_address) == initial_balanceOf_user - 1, "Wrong user balance (3)",
    );
    assert!(dispatcher.checkHasClaimed(user_address, bet_id), "Bet is supposed to be claimed");
}
