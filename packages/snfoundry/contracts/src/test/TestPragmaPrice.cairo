use contracts::cryptos::PragmaPrice::{IPragmaPriceDispatcher, IPragmaPriceDispatcherTrait};
use openzeppelin::tests::utils::constants::OWNER;
use openzeppelin::utils::serde::SerializedAppend;
use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
use pragma_lib::types::{AggregationMode, DataType, PragmaPricesResponse};
use snforge_std::{CheatSpan, CheatTarget, ContractClassTrait, declare, prank};
use starknet::ContractAddress;
use starknet::contract_address::contract_address_const;


const KEY: felt252 = 18669995996566340; // felt252 conversion of "BTC/USD",

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap();
    let mut calldata = array![];
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    contract_address
}
