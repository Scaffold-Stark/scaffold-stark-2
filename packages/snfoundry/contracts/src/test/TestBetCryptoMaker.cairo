use contracts::cryptos::BetCryptoMaker::BetInfos;
use contracts::cryptos::BetCryptoMaker::{IBetCryptoMakerDispatcher, IBetCryptoMakerDispatcherTrait};
use core::traits::TryInto;
use openzeppelin::tests::utils::constants::OWNER;
use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
use openzeppelin::utils::serde::SerializedAppend;
use snforge_std::{
    declare, ContractClassTrait, prank, CheatTarget, CheatSpan, start_warp, stop_warp
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

fn setup() -> IERC20CamelDispatcher {
    let eth_contract_address = ETH_CONTRACT_ADDRESS.try_into().unwrap();
    let eth_token = IERC20CamelDispatcher { contract_address: eth_contract_address };
    eth_token
}

#[test]
#[fork("TEST")]
fn test_create_bet() {
    let user_address: ContractAddress =
        0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d
        .try_into()
        .unwrap();
    let contract_address = deploy_contract("BetCryptoMaker");
    let eth_token = setup();
    
    let dispatcher = IBetCryptoMakerDispatcher { contract_address };
    
    assert!(dispatcher.getTotalBets() == 0, "Total bets should be 0.");

    prank(CheatTarget::One(contract_address), OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.createBet("", "", 'Cryptos', 652086109850, 1720083600000, 1720083600000, ('Bitcoin above', 'Bitcoin not above'), eth_token.contract_address);

    assert!(dispatcher.getTotalBets() == 1, "Total bets should be 1.");

}

