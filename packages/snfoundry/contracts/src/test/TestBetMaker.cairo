use contracts::BetMaker::{IBetMakerDispatcher, IBetMakerDispatcherTrait};
use contracts::BetMaker::{
    StrategyInfos, CreateBetOutcomesArgument, ERC20BetTokenType, BetType, PositionType
};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use openzeppelin_utils::serde::SerializedAppend;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan};
use starknet::{ContractAddress, contract_address_const};

// Real contract address deployed on Mainnet with Eth
fn OWNER() -> ContractAddress {
    contract_address_const::<0x0213c67ed78bc280887234fe5ed5e77272465317978ae86c25a71531d9332a2d>()
}

// Real contract address deployed on Mainnet with Usdc
fn USER_WITH_USDC() -> ContractAddress {
    contract_address_const::<0x033180a861dca5d6cc2cf4816f08a666891e38722859e3fd12eb91296a1a157a>()
}

// Address for npeETH strategy of Nimbora
fn NIMBORA_CONTRACT_ADDRESS() -> ContractAddress {
    contract_address_const::<0x3759ed21701538d2e1bc5896611166a06585cdbbeeddd1fbdd25da10b2174d3>()
}

fn ETH_CONTRACT_ADDRESS() -> ContractAddress {
    contract_address_const::<0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7>()
}

fn USDC_CONTRACT_ADDRESS() -> ContractAddress {
    contract_address_const::<0x053C91253BC9682c04929cA02ED00b3E423f6710D2ee7e0D5EBB06F3eCF368A8>()
}

// Token adress for npeEth
fn NIMBORA_TOKEN_ADDRESS() -> ContractAddress {
    contract_address_const::<0x0316ec509f7ad89b7e6e03d15a436df634454f95e815536d616af03edc850fa3>()
}

fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract_class = declare(name).unwrap().contract_class();
    let mut calldata = array![];
    calldata.append_serde(OWNER());
    let (contract_address, _) = contract_class.deploy(@calldata).unwrap();
    contract_address
}

fn initialize_crypto_nimbora_bet(
    contract_address: ContractAddress, dispatcher: IBetMakerDispatcher
) {
    let name = "Bitcoin above 75000 on December 1?";
    let image = "https://cdn.pixabay.com/photo/2015/08/27/11/20/bitcoin-910307_1280.png";
    let category = 'Crypto';
    let description = "";
    let deadline = 1764547200; // December 2025
    let vote_deadline = 1764547200;
    let yield_strategy_infos = StrategyInfos {
        name: 'Nimbora Pendle EtherFi Eth',
        symbol: 'npeETH',
        address: NIMBORA_CONTRACT_ADDRESS(),
        yield_strategy_type: 1
    };
    let reference_price_key = 'BTC/USD';
    let reference_price = 7500000000000;
    let bet_condition = 1;
    let bet_token_address = ERC20BetTokenType::Eth(ETH_CONTRACT_ADDRESS());
    let outcomes = CreateBetOutcomesArgument {
        outcome_yes: 'Bitcoin is higher', outcome_no: 'Bitcoin is lower'
    };

    cheat_caller_address(contract_address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher
        .create_crypto_bet(
            name,
            image,
            category,
            description,
            deadline,
            vote_deadline,
            yield_strategy_infos,
            reference_price_key,
            reference_price,
            bet_condition,
            bet_token_address,
            outcomes
        );
}

fn initialize_crypto_classic_bet(
    contract_address: ContractAddress, dispatcher: IBetMakerDispatcher
) {
    let name = "Bitcoin above 75000 on December 1?";
    let image = "https://cdn.pixabay.com/photo/2015/08/27/11/20/bitcoin-910307_1280.png";
    let category = 'Crypto';
    let description = "";
    let deadline = 1764547200;
    let vote_deadline = 1764547200;
    let yield_strategy_infos = StrategyInfos {
        // For type 0, name, symbol and address are useless
        name: '', symbol: '', address: USDC_CONTRACT_ADDRESS(), yield_strategy_type: 0
    };
    let reference_price_key = 'BTC/USD';
    let reference_price = 7500000000000;
    let bet_condition = 1;
    let bet_token_address = ERC20BetTokenType::Eth(USDC_CONTRACT_ADDRESS());
    let outcomes = CreateBetOutcomesArgument {
        outcome_yes: 'Bitcoin is higher', outcome_no: 'Bitcoin is lower'
    };

    cheat_caller_address(contract_address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher
        .create_crypto_bet(
            name,
            image,
            category,
            description,
            deadline,
            vote_deadline,
            yield_strategy_infos,
            reference_price_key,
            reference_price,
            bet_condition,
            bet_token_address,
            outcomes
        );
}

#[test]
fn test_create_crypto_bets() {
    let contract_address = deploy_contract("BetMaker");

    let dispatcher = IBetMakerDispatcher { contract_address };
    assert(dispatcher.get_crypto_bets_count() == 0, 'Should have no bets yet.');
    initialize_crypto_nimbora_bet(contract_address, dispatcher);
    assert(dispatcher.get_crypto_bets_count() == 1, 'Should have 1 bet.');
    initialize_crypto_classic_bet(contract_address, dispatcher);
    assert(dispatcher.get_crypto_bets_count() == 2, 'Should have 2 bets.');
}


#[test]
#[fork("MAINNET_LATEST")]
fn test_create_user_position_from_crypto_nimbora_bet() {
    let contract_address = deploy_contract("BetMaker");

    let dispatcher = IBetMakerDispatcher { contract_address };
    let nimbora_dispatcher = IERC20Dispatcher { contract_address: NIMBORA_TOKEN_ADDRESS() };
    let eth_dispatcher = IERC20Dispatcher { contract_address: ETH_CONTRACT_ADDRESS() };
    initialize_crypto_nimbora_bet(contract_address, dispatcher);
    assert(nimbora_dispatcher.balance_of(contract_address) == 0, 'Bet should not have shares');

    let amount_to_transfer = 500;
    cheat_caller_address(ETH_CONTRACT_ADDRESS(), OWNER(), CheatSpan::TargetCalls(1));
    eth_dispatcher.approve(contract_address, amount_to_transfer);
    let approved_amount = eth_dispatcher.allowance(OWNER(), contract_address);
    assert(approved_amount == amount_to_transfer, 'Not the right amount approved');

    cheat_caller_address(contract_address, OWNER(), CheatSpan::TargetCalls(1));
    dispatcher.create_user_position(1, BetType::Crypto, PositionType::Yes, amount_to_transfer);

    assert(nimbora_dispatcher.balance_of(contract_address) != 0, 'Bet should have shares');
    assert(eth_dispatcher.balance_of(contract_address) == 0, 'Funds should be on Nimbora');
    assert(dispatcher.get_user_total_positions(OWNER(), 1, BetType::Crypto) == 1, '')
}
#[test]
#[fork("MAINNET_LATEST")]
fn test_create_user_position_from_crypto_classic_bet() {
    let contract_address = deploy_contract("BetMaker");

    let dispatcher = IBetMakerDispatcher { contract_address };
    let usdc_dispatcher = IERC20Dispatcher { contract_address: USDC_CONTRACT_ADDRESS() };
    initialize_crypto_classic_bet(contract_address, dispatcher);
    assert(usdc_dispatcher.balance_of(contract_address) == 0, 'Bet should not have money');

    let amount_to_transfer = 500;
    cheat_caller_address(USDC_CONTRACT_ADDRESS(), USER_WITH_USDC(), CheatSpan::TargetCalls(1));
    usdc_dispatcher.approve(contract_address, amount_to_transfer);
    let approved_amount = usdc_dispatcher.allowance(USER_WITH_USDC(), contract_address);
    assert(approved_amount == amount_to_transfer, 'Not the right amount approved');

    cheat_caller_address(contract_address, USER_WITH_USDC(), CheatSpan::TargetCalls(1));
    dispatcher.create_user_position(1, BetType::Crypto, PositionType::Yes, amount_to_transfer);

    assert(usdc_dispatcher.balance_of(contract_address) != 0, 'Contract should have funds');
    assert(dispatcher.get_user_total_positions(USER_WITH_USDC(), 1, BetType::Crypto) == 1, '')
}

