use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ContractAddress, eth_address::EthAddress};


// Nimbora structs and interface
#[derive(Copy, Drop, Serde, starknet::Store)]
struct WithdrawalInfo {
    epoch: u256,
    shares: u256,
    claimed: bool
}

impl WithdrawalInfoIntoSpan of Into<WithdrawalInfo, Span<felt252>> {
    fn into(self: WithdrawalInfo) -> Span<felt252> {
        let mut serialized_struct: Array<felt252> = array![];
        self.serialize(ref serialized_struct);
        serialized_struct.span()
    }
}

#[derive(Copy, Drop, Serde, PartialEq)]
struct StrategyReportL2 {
    l1_strategy: EthAddress,
    action_id: u256,
    amount: u256,
    processed: bool,
    new_share_price: u256
}

#[starknet::interface]
pub trait ITokenManager<TContractState> {
    fn pooling_manager(self: @TContractState) -> ContractAddress;
    fn l1_strategy(self: @TContractState) -> EthAddress;
    fn underlying(self: @TContractState) -> ContractAddress;
    fn token(self: @TContractState) -> ContractAddress;
    fn performance_fees(self: @TContractState) -> u256;
    fn tvl_limit(self: @TContractState) -> u256;
    fn withdrawal_epoch_delay(self: @TContractState) -> u256;
    fn handled_epoch_withdrawal_len(self: @TContractState) -> u256;
    fn epoch(self: @TContractState) -> u256;
    fn l1_net_asset_value(self: @TContractState) -> u256;
    fn underlying_transit(self: @TContractState) -> u256;
    fn buffer(self: @TContractState) -> u256;
    fn withdrawal_info(self: @TContractState, user: ContractAddress, id: u256) -> WithdrawalInfo;
    fn user_withdrawal_len(self: @TContractState, user: ContractAddress) -> u256;
    fn dust_limit(self: @TContractState) -> u256;
    fn total_assets(self: @TContractState) -> u256;
    fn total_underlying_due(self: @TContractState) -> u256;
    fn withdrawal_exchange_rate(self: @TContractState, epoch: u256) -> u256;
    fn withdrawal_pool(self: @TContractState, epoch: u256) -> u256;
    fn withdrawal_share(self: @TContractState, epoch: u256) -> u256;
    fn convert_to_shares(self: @TContractState, amount: u256) -> u256;
    fn convert_to_assets(self: @TContractState, shares: u256) -> u256;


    fn initialiser(ref self: TContractState, token: ContractAddress);

    fn set_performance_fees(ref self: TContractState, new_performance_fees: u256);

    fn set_tvl_limit(ref self: TContractState, new_tvl_limit: u256);

    fn set_withdrawal_epoch_delay(ref self: TContractState, new_withdrawal_epoch_delay: u256);

    fn set_dust_limit(ref self: TContractState, new_dust_limit: u256);

    fn deposit(
        ref self: TContractState, assets: u256, receiver: ContractAddress, referal: ContractAddress
    );

    fn request_withdrawal(ref self: TContractState, shares: u256);

    fn claim_withdrawal(ref self: TContractState, user: ContractAddress, id: u256);

    fn handle_report(
        ref self: TContractState, new_l1_net_asset_value: u256, underlying_bridged_amount: u256
    ) -> StrategyReportL2;
}

// Structs and enums
#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct StrategyInfos {
    name: felt252,
    symbol: felt252,
    address: ContractAddress,
    yield_strategy_type: u256 // TODO: u256 -> u8
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct NimboraStrategyInfos {
    name: felt252,
    symbol: felt252,
    address: ContractAddress,
    shares: u256
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub enum ERC20BetTokenType {
    Eth: ContractAddress,
    Usdc: ContractAddress
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

#[derive(Drop, Serde, Copy, starknet::Store)]
pub enum YieldStrategy {
    None, // index 0
    Nimbora: NimboraStrategyInfos, // index 1
    Nostra: StrategyInfos
}

#[derive(Copy, Serde, Drop, starknet::Store, PartialEq, Hash)]
pub struct CreateBetOutcomesArgument {
    outcome_yes: felt252,
    outcome_no: felt252
}

#[derive(Drop, Serde, starknet::Store)]
pub struct UserPosition {
    position_type: PositionType,
    amount: u256,
    has_claimed: bool,
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

#[derive(Copy, Serde, Drop, starknet::Store)]
pub struct ERC20BetToken {
    name: felt252,
    dispatcher: IERC20Dispatcher,
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
    bet_token: ERC20BetToken, // Token used to make a bet, e.g., USDC
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
        bet_token_address: ERC20BetTokenType,
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
    fn get_vault_wallet(self: @TContractState) -> ContractAddress;
    fn get_user_position(
        self: @TContractState,
        caller: ContractAddress,
        bet_id: u256,
        bet_type: BetType,
        position_id: u256
    ) -> UserPosition;

    fn set_vault_wallet(ref self: TContractState, wallet: ContractAddress);
}

#[starknet::contract]
mod BetMaker {
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use super::{ITokenManagerDispatcher, ITokenManagerDispatcherTrait};
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::contract_address::contract_address_const;
    use starknet::storage::Map;
    use starknet::{ContractAddress};
    use starknet::{get_caller_address, get_contract_address, get_block_timestamp};
    use super::{
        IBetMaker, CryptoBet, Outcome, Outcomes, CreateBetOutcomesArgument, YieldStrategy,
        StrategyInfos, NimboraStrategyInfos, BetType, PositionType, ERC20BetTokenType,
        ERC20BetToken, UserPosition
    };

    const PROCESSING_FEE: u256 = 2;

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
        CryptoBetPositionCreated: CryptoBetPositionCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct CryptoBetCreated {
        market: CryptoBet
    }

    #[derive(Drop, starknet::Event)]
    struct CryptoBetPositionCreated {
        user: ContractAddress,
        market: CryptoBet,
        position: UserPosition,
        position_id: u256 // TODO: update last u256 to u16/u32
    }

    #[storage]
    struct Storage {
        user_positions: Map<
            (ContractAddress, u256, BetType, u256), UserPosition
        >, // TODO: update last u256 to u16/u32
        user_total_positions: Map<
            (ContractAddress, u256, BetType), u256
        >, // TODO: update last u256 to u16/u32
        crypto_bets: Map<u256, CryptoBet>,
        total_crypto_bets: u256,
        vault_wallet: ContractAddress,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        //self.ownable.initializer(owner); // TODO: Put back owner

        // TODO: Remove all down part
        let owner = contract_address_const::<
            0x061a88ec8c3691da159f2de0579869604ab00e1476a20b10df71d2bd8b847b8c
        >();
        self.ownable.initializer(owner);
        self.vault_wallet.write(owner);
    }

    // Private methods
    fn create_yield_strategy(yield_strategy_infos: StrategyInfos) -> YieldStrategy {
        let yield_type = yield_strategy_infos.yield_strategy_type;

        let converted_yield_type: u8 = yield_type
            .try_into()
            .unwrap(); // TODO: Not necessary when u8 will be used for yield_type

        match converted_yield_type {
            0 => YieldStrategy::None,
            1 => {
                let nimbora_strategy_infos = NimboraStrategyInfos {
                    name: yield_strategy_infos.name,
                    symbol: yield_strategy_infos.symbol,
                    address: yield_strategy_infos.address,
                    shares: 0
                };
                YieldStrategy::Nimbora(nimbora_strategy_infos)
            },
            2 => YieldStrategy::Nostra(yield_strategy_infos),
            _ => YieldStrategy::None
        }
    }

    fn depositToNimbora(
        nimbora_address: ContractAddress, eth_dispatcher: IERC20Dispatcher, amount_eth: u256
    ) -> u256 {
        let nimbora_dispatcher = ITokenManagerDispatcher { contract_address: nimbora_address };

        eth_dispatcher.approve(nimbora_dispatcher.contract_address, amount_eth);
        nimbora_dispatcher.deposit(amount_eth, get_contract_address(), get_contract_address());

        let amount_shares_received = nimbora_dispatcher.convert_to_shares(amount_eth);
        amount_shares_received
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
            bet_token_address: ERC20BetTokenType,
            outcomes: CreateBetOutcomesArgument
        ) {
            self.ownable.assert_only_owner();

            // Initialize outcomes
            let outcome_yes_name = outcomes.outcome_yes;
            let outcome_no_name = outcomes.outcome_no;

            let mut outcome_yes = Outcome { name: outcome_yes_name, bought_amount: 0 };
            let mut outcome_no = Outcome { name: outcome_no_name, bought_amount: 0 };

            let outcomes = Outcomes { outcome_yes, outcome_no };

            // Initialize strategy
            let yield_strategy = create_yield_strategy(yield_strategy_infos);

            // Initialize Bet token
            let bet_token = match bet_token_address {
                ERC20BetTokenType::Eth(address) => ERC20BetToken {
                    name: 'Eth', dispatcher: IERC20Dispatcher { contract_address: address },
                },
                ERC20BetTokenType::Usdc(address) => ERC20BetToken {
                    name: 'Usdc', dispatcher: IERC20Dispatcher { contract_address: address },
                },
            };

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
                bet_token,
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
        ) {
            assert!(amount > 0, "You must send some funds to place a bet.");
            match bet_type {
                BetType::Crypto => {
                    let mut bet_data = self.crypto_bets.read(bet_id);
                    let converted_deadline: u64 = bet_data
                        .deadline
                        .try_into()
                        .unwrap(); // TODO: Not necessary when u64 will be used for deadline
                    let converted_vote_deadline: u64 = bet_data
                        .vote_deadline
                        .try_into()
                        .unwrap(); // TODO: Not necessary when u64 will be used for vote_deadline

                    assert!(bet_data.is_active, "Bet is not active.");
                    assert!(get_block_timestamp() < converted_deadline, "Bet has expired.");
                    assert!(get_block_timestamp() < converted_vote_deadline, "Votes are closed.");

                    bet_data
                        .bet_token
                        .dispatcher
                        .transfer_from(get_caller_address(), get_contract_address(), amount);
                    bet_data
                        .bet_token
                        .dispatcher
                        .transfer(self.vault_wallet.read(), amount * PROCESSING_FEE / 100);

                    let bought_amount = amount - amount * PROCESSING_FEE / 100;
                    match position_type {
                        PositionType::Yes => {
                            bet_data.outcomes.outcome_yes.bought_amount += bought_amount;
                        },
                        PositionType::No => {
                            bet_data.outcomes.outcome_no.bought_amount += bought_amount;
                        }
                    }
                    bet_data.total_money_betted += bought_amount;
                    self.crypto_bets.write(bet_id, bet_data);

                    self
                        .user_total_positions
                        .write(
                            (get_caller_address(), bet_id, bet_type),
                            self.user_total_positions.read((get_caller_address(), bet_id, bet_type))
                                + 1
                        );
                    let user_position = UserPosition { position_type, amount, has_claimed: false };
                    self
                        .user_positions
                        .write(
                            (
                                get_caller_address(),
                                bet_id,
                                bet_type,
                                self
                                    .user_total_positions
                                    .read((get_caller_address(), bet_id, bet_type))
                            ),
                            user_position
                        );

                    let mut new_bet = self.crypto_bets.read(bet_id);
                    match new_bet.yield_strategy {
                        YieldStrategy::Nimbora(mut yield_strategy_infos) => {
                            let earned_shares = depositToNimbora(
                                yield_strategy_infos.address,
                                new_bet.bet_token.dispatcher,
                                bought_amount
                            );
                            yield_strategy_infos.shares += earned_shares;

                            let mut new_bet = self.crypto_bets.read(bet_id);
                            new_bet.yield_strategy = YieldStrategy::Nimbora(yield_strategy_infos);
                            self.crypto_bets.write(bet_id, new_bet);
                        },
                        _ => {}
                    }

                    let mut final_bet = self.crypto_bets.read(bet_id);
                    self
                        .emit(
                            CryptoBetPositionCreated {
                                user: get_caller_address(),
                                market: final_bet,
                                position: UserPosition {
                                    position_type, amount, has_claimed: false
                                },
                                position_id: self
                                    .user_total_positions
                                    .read((get_caller_address(), bet_id, bet_type))
                            }
                        );
                },
                BetType::Sports => panic!("Type not supported yet!"),
                BetType::Other => panic!("Type not supported yet!"),
                _ => panic!("Invalid bet type"),
            }
        }

        fn get_crypto_bet(self: @ContractState, bet_id: u256) -> CryptoBet {
            self.crypto_bets.read(bet_id)
        }

        fn get_crypto_bets_count(self: @ContractState) -> u256 {
            self.total_crypto_bets.read()
        }

        fn get_vault_wallet(self: @ContractState) -> ContractAddress {
            self.ownable.assert_only_owner();
            self.vault_wallet.read()
        }

        fn get_user_position(
            self: @ContractState,
            caller: ContractAddress,
            bet_id: u256,
            bet_type: BetType,
            position_id: u256
        ) -> UserPosition {
            self.user_positions.read((caller, bet_id, bet_type, position_id))
        }


        fn set_vault_wallet(ref self: ContractState, wallet: ContractAddress) {
            self.ownable.assert_only_owner();
            self.vault_wallet.write(wallet);
        }
    }
}
