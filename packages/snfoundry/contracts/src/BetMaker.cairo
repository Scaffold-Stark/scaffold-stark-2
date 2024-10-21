use starknet::{ContractAddress};

#[derive(Drop, Serde, starknet::Store)]
pub struct StrategyInfos {
    name: felt252,
    symbol: felt252,
    address: ContractAddress,
    yield_strategy_type: u256 // TODO: u256 -> u8
}

trait ProcessingYield {
    fn deposit_liquidity(self: YieldStrategy);
}

impl ProcessingYieldImpl of ProcessingYield {
    fn deposit_liquidity(self: YieldStrategy) {
        match self {
            YieldStrategy::Nimbora(value) => { println!("Nimbora! {:?}", value.symbol) },
            YieldStrategy::Nostra => { println!("Nostra!") },
            YieldStrategy::None => { println!("None!") },
        }
    }
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub enum BetType {
    Crypto,
    Sports,
    Other
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub enum PositionType {
    Yes,
    No,
}

#[derive(Drop, Serde, starknet::Store)]
pub enum YieldStrategy {
    None, // index 0
    Nimbora: StrategyInfos, // index 1
    Nostra: StrategyInfos
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub struct CreateBetOutcomesArgument {
    outcome_yes: felt252,
    outcome_no: felt252
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub struct Outcome {
    name: felt252,
    bought_amount: u256,
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub struct Outcomes {
    outcome_yes: Outcome,
    outcome_no: Outcome,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct CryptoBet {
    bet_id: u256,
    name: ByteArray,
    image: ByteArray,
    category: felt252,
    description: ByteArray,
    is_settled: bool,
    is_active: bool,
    deadline: u256, // TODO: u256 -> u64
    vote_deadline: u256, // TODO: u256 -> u64
    total_money_betted: u256,
    yield_strategy: YieldStrategy,
    reference_price_key: felt252, // Key representing the reference price for the asset pair, e.g., BTC/USD for Bitcoin in USD
    reference_price: u256,
    bet_condition: u256, // 0 => less than reference_price, 1 => greater than reference_price // TODO: bet_condition u256 -> u8
    outcomes: Outcomes,
    winner_outcome: Option<Outcome>,
}

#[starknet::interface]
pub trait IBetMaker<TContractState> {
    fn create_crypto_bet(
        ref self: TContractState,
        name: ByteArray,
        image: ByteArray,
        category: felt252,
        description: ByteArray,
        deadline: u256, // TODO: u256 -> u64
        vote_deadline: u256, // TODO: u256 -> u64   
        yield_strategy_infos: StrategyInfos,
        reference_price_key: felt252,
        reference_price: u256,
        bet_condition: u256, // TODO: bet_condition u256 -> u8
        outcomes: CreateBetOutcomesArgument
    );
    fn create_user_position(
        ref self: TContractState,
        bet_id: u256,
        bet_type: BetType,
        position_type: PositionType,
        amount: u256
    );
    fn get_crypto_bet(self: @TContractState, bet_id: u256) -> CryptoBet;
    fn get_crypto_bets_count(self: @TContractState) -> u256;
}

#[starknet::contract]
mod BetMaker {
    use openzeppelin_access::ownable::OwnableComponent;
    // use openzeppelin_token::erc20::interface::{IERC20CamelDispatcher,
    // IERC20CamelDispatcherTrait};
    use starknet::storage::Map;
    use starknet::{ContractAddress};
    // use starknet::{get_caller_address, get_contract_address};
    use super::{
        IBetMaker, CryptoBet, Outcome, Outcomes, CreateBetOutcomesArgument, YieldStrategy,
        StrategyInfos, BetType, PositionType
    };

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        CryptoBetCreated: CryptoBetCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct CryptoBetCreated {
        market: CryptoBet
    }

    #[storage]
    struct Storage {
        // user_bet: Map<(ContractAddress, u256, u8, u8), UserBet>,
        crypto_bets: Map<u256, CryptoBet>,
        total_crypto_bets: u256,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }


    fn create_yield_strategy(yield_strategy_infos: StrategyInfos) -> YieldStrategy {
        let yield_type = yield_strategy_infos.yield_strategy_type;

        let converted_yield_type: u8 = yield_type
            .try_into()
            .unwrap(); // TODO: Not necessary when u8 will be used for yield_type

        match converted_yield_type {
            0 => YieldStrategy::None,
            1 => YieldStrategy::Nimbora(yield_strategy_infos),
            2 => YieldStrategy::Nostra(yield_strategy_infos),
            _ => YieldStrategy::None
        }
    }

    #[abi(embed_v0)]
    impl BetMakerImpl of IBetMaker<ContractState> {
        fn create_crypto_bet(
            ref self: ContractState,
            name: ByteArray,
            image: ByteArray,
            category: felt252,
            description: ByteArray,
            deadline: u256,
            vote_deadline: u256,
            yield_strategy_infos: StrategyInfos,
            reference_price_key: felt252,
            reference_price: u256,
            bet_condition: u256,
            outcomes: CreateBetOutcomesArgument
        ) {
            // TODO: Put back owner assert
            //self.ownable.assert_only_owner();

            // Initialize outcomes
            let outcome_yes_name = outcomes.outcome_yes;
            let outcome_no_name = outcomes.outcome_no;

            let mut outcome_yes = Outcome { name: outcome_yes_name, bought_amount: 0 };
            let mut outcome_no = Outcome { name: outcome_no_name, bought_amount: 0 };

            let outcomes = Outcomes { outcome_yes, outcome_no };

            // Initialize strategy
            let yield_strategy = create_yield_strategy(yield_strategy_infos);

            // Initialize Crypto Bet
            let crypto_bet = CryptoBet {
                bet_id: self.total_crypto_bets.read() + 1,
                name,
                image,
                category,
                description,
                is_settled: false,
                is_active: true,
                deadline,
                vote_deadline,
                total_money_betted: 0,
                yield_strategy,
                reference_price_key,
                reference_price,
                bet_condition,
                outcomes,
                winner_outcome: Option::None,
            };
            self.total_crypto_bets.write(self.total_crypto_bets.read() + 1);
            self.crypto_bets.write(self.total_crypto_bets.read(), crypto_bet);

            // Emit CryptoBetCreation Event
            let new_bet = self.crypto_bets.read(self.total_crypto_bets.read());
            self.emit(CryptoBetCreated { market: new_bet });
        }


        fn create_user_position(
            ref self: ContractState,
            bet_id: u256,
            bet_type: BetType,
            position_type: PositionType,
            amount: u256
        ) {}

        fn get_crypto_bet(self: @ContractState, bet_id: u256) -> CryptoBet {
            self.crypto_bets.read(bet_id)
        }

        fn get_crypto_bets_count(self: @ContractState) -> u256 {
            self.total_crypto_bets.read()
        }
    }
}
