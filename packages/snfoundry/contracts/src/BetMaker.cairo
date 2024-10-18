use starknet::{ContractAddress};

#[derive(Drop, Serde, starknet::Store)]
pub struct StrategyInfos {
    name: felt252,
    symbol: felt252,
    address: ContractAddress
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

#[derive(Drop, Serde, starknet::Store)]
pub enum YieldStrategy {
    None, // index 0
    Nimbora: StrategyInfos, // index 1
    Nostra
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub struct Outcome {
    name: felt252,
    bought_amount: u256,
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
    deadline: u64,
    vote_deadline: u64,
    total_money_betted: u256,
    yield_strategy: YieldStrategy,
    reference_price_key: felt252, // Key representing the reference price for the asset pair, e.g., BTC/USD for Bitcoin in USD
    reference_price: u256,
    bet_condition: u256, // 0 => less than reference_price, 1 => greater than reference_price
    outcomes: (Outcome, Outcome),
    winning_outcome: Option<Outcome>,
}

#[starknet::interface]
pub trait IBetMaker<TContractState> {
    fn create_crypto_bet(
        ref self: TContractState,
        // name: ByteArray,
        // image: ByteArray,
        // category: felt252,
        // description: ByteArray,
        // deadline: u256, // TODO: Move back value to u64 when scaffold deserialize is working
        // vote_deadline: u256, // TODO: Move back value to u64 when scaffold deserialize is working
        //yield_strategy_type: (u8, ContractAddress), // First argument is the index representing
        //the strategy to use according to YieldStrategy struct , e.g., 1 -> NimboraStrategy
        yield_strategy_infos: StrategyInfos, // Name and symbol of YieldStrategy
        // reference_price_key: felt252,
    // reference_price: u256, // TODO: Move back value to u8 when scaffold deserialize is
    // working bet_condition: u256,
    //outcomes: (felt252, felt252)
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
    use super::{IBetMaker, CryptoBet, YieldStrategy, Outcome, StrategyInfos};

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


    fn create_yield_strategy(
        yield_strategy_type: (u8, ContractAddress), yield_strategy_infos: (felt252, felt252)
    ) -> YieldStrategy {
        let (name, symbol) = yield_strategy_infos;
        let (yield_type, yield_contract_address) = yield_strategy_type;

        let strategy_infos = StrategyInfos { name, symbol, address: yield_contract_address };

        match yield_type {
            0 => YieldStrategy::None,
            1 => YieldStrategy::Nimbora(strategy_infos),
            2 => YieldStrategy::Nostra,
            _ => YieldStrategy::None
        }
    }

    #[abi(embed_v0)]
    impl BetMakerImpl of IBetMaker<ContractState> {
        // fn create_crypto_bet(
        //     ref self: ContractState,
        //     name: ByteArray,
        //     image: ByteArray,
        //     category: felt252,
        //     description: ByteArray,
        //     deadline: u64,
        //     vote_deadline: u64,
        //     yield_strategy_type: (u8, ContractAddress),
        //     yield_strategy_infos: (felt252, felt252),
        //     reference_price_key: felt252,
        //     reference_price: u256,
        //     bet_condition: u8,
        //     outcomes: (felt252, felt252)
        // ) {
        //     self.ownable.assert_only_owner();

        //     // Initialize outcomes
        //     let (result1, result2) = outcomes;
        //     let mut outcome1 = Outcome { name: result1, bought_amount: 0 };
        //     let mut outcome2 = Outcome { name: result2, bought_amount: 0 };

        //     let outcomes = (outcome1, outcome2);

        //     // Initialize strategy
        //     let yield_strategy = create_yield_strategy(yield_strategy_type,
        //     yield_strategy_infos);

        //     // Initialize Crypto Bet
        //     let crypto_bet = CryptoBet {
        //         bet_id: self.total_crypto_bets.read() + 1,
        //         name,
        //         image,
        //         category,
        //         description,
        //         is_settled: false,
        //         is_active: true,
        //         deadline,
        //         vote_deadline,
        //         total_money_betted: 0,
        //         yield_strategy,
        //         reference_price_key,
        //         reference_price,
        //         bet_condition,
        //         outcomes,
        //         winning_outcome: Option::None,
        //     };
        //     self.total_crypto_bets.write(self.total_crypto_bets.read() + 1);
        //     self.crypto_bets.write(self.total_crypto_bets.read(), crypto_bet);

        //     // Emit CryptoBetCreation Event
        //     let new_bet = self.crypto_bets.read(self.total_crypto_bets.read());
        //     self.emit(CryptoBetCreated { market: new_bet });
        // }

        fn create_crypto_bet(
            ref self: ContractState, // name: ByteArray,
            // image: ByteArray,
            // category: felt252,
            // description: ByteArray,
            // deadline: u256, // TODO: Move back value to u64 when scaffold deserialize is working
            // vote_deadline: u256, // TODO: Move back value to u64 when scaffold deserialize is
            // working
            yield_strategy_infos: StrategyInfos,
            // reference_price_key: felt252,
        // reference_price: u256,
        // bet_condition: u256, // TODO: Move back value to u8 when scaffold deserialize is
        // working
        ) { //self.ownable.assert_only_owner();
        }
        fn get_crypto_bet(self: @ContractState, bet_id: u256) -> CryptoBet {
            self.crypto_bets.read(bet_id)
        }

        fn get_crypto_bets_count(self: @ContractState) -> u256 {
            self.total_crypto_bets.read()
        }
    }
}
