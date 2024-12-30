use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
use starknet::{ClassHash, ContractAddress, eth_address::EthAddress};


#[derive(Copy, Drop, Serde, starknet::Store)]
struct WithdrawalInfo {
    epoch: u256,
    shares: u256,
    claimed: bool,
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
    new_share_price: u256,
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
        ref self: TContractState, assets: u256, receiver: ContractAddress, referal: ContractAddress,
    );

    fn request_withdrawal(ref self: TContractState, shares: u256);

    fn claim_withdrawal(ref self: TContractState, user: ContractAddress, id: u256);

    fn handle_report(
        ref self: TContractState, new_l1_net_asset_value: u256, underlying_bridged_amount: u256,
    ) -> StrategyReportL2;
}

#[derive(Drop, Copy, Serde, starknet::Store, PartialEq, Eq, Hash)]
pub struct Outcome {
    result_name: felt252,
    pub is_yes_outcome: bool,
    pub result_token_price: u256,
    pub nimbora_total_amount_with_yield: u256,
    pub is_settled: bool,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct UserBetPosition {
    pub amount: u256,
    pub has_claimed: bool,
}

#[derive(Drop, Serde)]
pub struct UserBetPositionOverview {
    bet_id: u256,
    name: ByteArray,
    category: felt252,
    is_yes: bool,
    pub amount: u256,
    pub has_claimed: bool,
    is_bet_ended: bool,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct BetInfos {
    id: u256,
    name: ByteArray,
    description: ByteArray,
    category: felt252,
    reference_token_price: u256,
    end_vote_bet_timestamp: u64,
    end_bet_timestamp: u64,
    pub is_bet_ended: bool,
    pub is_nimbora_claimed: bool,
    total_bet_amount: u256,
    total_bet_yes_amount: u256,
    total_bet_no_amount: u256,
    pub total_shares_amount: u256,
    pub winner_result: Outcome,
    bet_token: IERC20CamelDispatcher,
    pub nimbora: ITokenManagerDispatcher,
    token_to_fetch_from_pragma: felt252,
}

#[starknet::interface]
pub trait IBetCryptoMaker<TContractState> {
    fn createBet(
        ref self: TContractState,
        name: ByteArray,
        description: ByteArray,
        category: felt252,
        reference_token_price: u256,
        end_vote_bet_timestamp: u64,
        end_bet_timestamp: u64,
        bet_token_address: ContractAddress,
        nimbora_address: ContractAddress,
        token_to_fetch_from_pragma: felt252,
    );

    fn getTotalBets(self: @TContractState) -> u256;

    fn getBet(self: @TContractState, bet_id: u256) -> BetInfos;

    fn getAllBets(self: @TContractState) -> Array<BetInfos>;

    fn vote_yes(ref self: TContractState, amount_eth: u256, bet_id: u256);

    fn vote_no(ref self: TContractState, amount_eth: u256, bet_id: u256);

    fn get_yes_position(
        self: @TContractState, caller_address: ContractAddress, bet_id: u256,
    ) -> UserBetPosition;

    fn get_no_position(
        self: @TContractState, caller_address: ContractAddress, bet_id: u256,
    ) -> UserBetPosition;

    fn getAllUserPositions(
        self: @TContractState, user: ContractAddress,
    ) -> Array<UserBetPositionOverview>;

    fn settleBet(ref self: TContractState, bet_id: u256);

    fn claimNimboraShares(ref self: TContractState, bet_id: u256);

    fn checkHasClaimed(
        self: @TContractState, caller_address: ContractAddress, bet_id: u256,
    ) -> bool;

    fn claimRewards(ref self: TContractState, bet_id: u256, claim_yes: bool);

    fn fund_contract(ref self: TContractState, amount_eth: u256, bet_id: u256);
}

#[starknet::contract]
pub mod BetCryptoMaker {
    use contracts::cryptos::PragmaPrice::IPragmaPrice;
    use contracts::cryptos::PragmaPrice::PragmaPrice as PragmaPriceComponent;
    use core::array::ArrayTrait;
    use core::traits::TryInto;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use pragma_lib::types::{AggregationMode, DataType, PragmaPricesResponse};
    use starknet::ContractAddress;
    use starknet::{get_block_timestamp, get_caller_address, get_contract_address};
    use super::BetInfos;
    use super::IBetCryptoMaker;
    use super::Outcome;
    use super::UserBetPosition;
    use super::UserBetPositionOverview;
    use super::{ITokenManagerDispatcher, ITokenManagerDispatcherTrait};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PragmaPriceComponent, storage: pragma, event: PragmaPriceEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl PragmaPriceImpl = PragmaPriceComponent::PragmaPriceImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PragmaPriceEvent: PragmaPriceComponent::Event,
    }


    #[storage]
    struct Storage {
        bets: LegacyMap::<u256, BetInfos>,
        user_bet_yes_amount: LegacyMap::<(ContractAddress, u256), UserBetPosition>,
        user_bet_no_amount: LegacyMap::<(ContractAddress, u256), UserBetPosition>,
        total_bets: u256,
        pragma_address: ContractAddress,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pragma: PragmaPriceComponent::Storage,
    }


    #[constructor]
    fn constructor(
        ref self: ContractState, owner: ContractAddress, pragma_address: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.pragma_address.write(pragma_address);
    }

    fn depositToNimbora(ref self: ContractState, amount_eth: u256, bet_id: u256) {
        let nimbora_dispatcher = self.bets.read(bet_id).nimbora;
        self.bets.read(bet_id).bet_token.approve(nimbora_dispatcher.contract_address, amount_eth);
        nimbora_dispatcher.deposit(amount_eth, get_contract_address(), get_contract_address());

        let amount_shares_received = nimbora_dispatcher.convert_to_shares(amount_eth);
        let mut bet = self.bets.read(bet_id);
        bet.total_shares_amount += amount_shares_received;
        self.bets.write(bet_id, bet);
    }

    #[abi(embed_v0)]
    impl BetCryptoMakerImpl of IBetCryptoMaker<ContractState> {
        fn createBet(
            ref self: ContractState,
            name: ByteArray,
            description: ByteArray,
            category: felt252,
            reference_token_price: u256,
            end_vote_bet_timestamp: u64,
            end_bet_timestamp: u64,
            bet_token_address: ContractAddress,
            nimbora_address: ContractAddress,
            token_to_fetch_from_pragma: felt252,
        ) {
            self.ownable.assert_only_owner();

            let new_id = self.total_bets.read() + 1;
            self.total_bets.write(new_id);

            let tmp_result = Outcome {
                result_name: '-',
                is_yes_outcome: false,
                result_token_price: 0,
                nimbora_total_amount_with_yield: 0,
                is_settled: false,
            };

            let bet: BetInfos = BetInfos {
                id: new_id,
                name,
                description,
                category,
                reference_token_price,
                end_vote_bet_timestamp,
                end_bet_timestamp,
                is_bet_ended: false,
                is_nimbora_claimed: false,
                total_bet_amount: 0,
                total_bet_yes_amount: 0,
                total_bet_no_amount: 0,
                total_shares_amount: 0,
                winner_result: tmp_result,
                bet_token: IERC20CamelDispatcher { contract_address: bet_token_address },
                nimbora: ITokenManagerDispatcher { contract_address: nimbora_address },
                token_to_fetch_from_pragma,
            };
            self.bets.write(new_id, bet);
        }

        fn getTotalBets(self: @ContractState) -> u256 {
            return self.total_bets.read();
        }

        fn getBet(self: @ContractState, bet_id: u256) -> BetInfos {
            self.bets.read(bet_id)
        }

        fn getAllBets(self: @ContractState) -> Array<BetInfos> {
            let mut bets: Array<BetInfos> = ArrayTrait::new();
            let mut i: u256 = 1;
            loop {
                if i > self.total_bets.read() {
                    break;
                }
                if self.bets.read(i).is_bet_ended == false {
                    bets.append(self.bets.read(i));
                }
                i += 1;
            };
            bets
        }

        fn vote_yes(ref self: ContractState, amount_eth: u256, bet_id: u256) {
            assert!(self.bets.read(bet_id).is_bet_ended == false, "Bet is ended.");

            let caller_address = get_caller_address();
            // TODO: Assert period is correct
            assert!(amount_eth > 0, "Can't bet without funds");

            // call approve on UI
            let mut current_bet = self.bets.read(bet_id);
            current_bet.bet_token.transferFrom(caller_address, get_contract_address(), amount_eth);

            current_bet.total_bet_amount += amount_eth;
            current_bet.total_bet_yes_amount += amount_eth;
            self.bets.write(bet_id, current_bet);

            let mut user_bet_position = self.user_bet_yes_amount.read((caller_address, bet_id));
            user_bet_position.amount += amount_eth;

            self.user_bet_yes_amount.write((caller_address, bet_id), user_bet_position);

            depositToNimbora(ref self, amount_eth, bet_id);
        }

        fn vote_no(ref self: ContractState, amount_eth: u256, bet_id: u256) {
            assert!(self.bets.read(bet_id).is_bet_ended == false, "Bet is ended.");

            let caller_address = get_caller_address();
            // TODO: Assert period is correct
            assert!(amount_eth > 0, "Can't bet without funds");

            // call approve on UI
            let mut current_bet = self.bets.read(bet_id);
            current_bet.bet_token.transferFrom(caller_address, get_contract_address(), amount_eth);

            current_bet.total_bet_amount += amount_eth;
            current_bet.total_bet_no_amount += amount_eth;
            self.bets.write(bet_id, current_bet);

            let mut user_bet_position = self.user_bet_no_amount.read((caller_address, bet_id));
            user_bet_position.amount += amount_eth;

            self.user_bet_no_amount.write((caller_address, bet_id), user_bet_position);

            depositToNimbora(ref self, amount_eth, bet_id);
        }

        fn get_yes_position(
            self: @ContractState, caller_address: ContractAddress, bet_id: u256,
        ) -> UserBetPosition {
            self.user_bet_yes_amount.read((caller_address, bet_id))
        }

        fn get_no_position(
            self: @ContractState, caller_address: ContractAddress, bet_id: u256,
        ) -> UserBetPosition {
            self.user_bet_no_amount.read((caller_address, bet_id))
        }

        fn getAllUserPositions(
            self: @ContractState, user: ContractAddress,
        ) -> Array<UserBetPositionOverview> {
            let mut user_positions: Array<UserBetPositionOverview> = ArrayTrait::new();
            let mut i: u256 = 1;
            loop {
                if i > self.total_bets.read() {
                    break;
                }
                let user_position_yes = self.user_bet_yes_amount.read((user, i));
                let user_position_no = self.user_bet_no_amount.read((user, i));
                if user_position_yes.amount > 0 {
                    let bet = self.bets.read(i);
                    let overview_position: UserBetPositionOverview = UserBetPositionOverview {
                        bet_id: bet.id,
                        name: bet.name,
                        category: bet.category,
                        is_yes: true,
                        amount: user_position_yes.amount,
                        has_claimed: user_position_yes.has_claimed,
                        is_bet_ended: bet.is_bet_ended,
                    };
                    user_positions.append(overview_position);
                }
                if user_position_no.amount > 0 {
                    let bet = self.bets.read(i);
                    let overview_position: UserBetPositionOverview = UserBetPositionOverview {
                        bet_id: bet.id,
                        name: bet.name,
                        category: bet.category,
                        is_yes: false,
                        amount: user_position_no.amount,
                        has_claimed: user_position_no.has_claimed,
                        is_bet_ended: bet.is_bet_ended,
                    };
                    user_positions.append(overview_position);
                }

                i += 1;
            };
            user_positions
        }

        fn settleBet(ref self: ContractState, bet_id: u256) {
            self.ownable.assert_only_owner();
            // TODO assert correct period

            let mut bet = self.bets.read(bet_id);

            let result_price = self
                .pragma
                .get_asset_price_median(
                    self.pragma_address.read(), DataType::SpotEntry(bet.token_to_fetch_from_pragma),
                );

            let mut bet = self.bets.read(bet_id);
            let total_amount_from_nimbora_shares = bet
                .nimbora
                .convert_to_assets(bet.total_shares_amount);
            let winner_result = if (result_price.into() > bet.reference_token_price) {
                Outcome {
                    result_name: 'Yes won',
                    is_yes_outcome: true,
                    result_token_price: result_price.into(),
                    is_settled: true,
                    nimbora_total_amount_with_yield: total_amount_from_nimbora_shares,
                }
            } else {
                Outcome {
                    result_name: 'No won',
                    is_yes_outcome: false,
                    result_token_price: result_price.into(),
                    is_settled: true,
                    nimbora_total_amount_with_yield: total_amount_from_nimbora_shares,
                }
            };
            bet.is_bet_ended = true;
            bet.winner_result = winner_result;
            self.bets.write(bet_id, bet);
            self.claimNimboraShares(bet_id);
        }

        fn claimNimboraShares(ref self: ContractState, bet_id: u256) {
            self.ownable.assert_only_owner();
            // TODO : set the amount of ETH that we will get from Nimbora with convertAssets
            if self.bets.read(bet_id).is_nimbora_claimed == false {
                let mut bet = self.bets.read(bet_id);
                bet.nimbora.request_withdrawal(bet.total_shares_amount);

                bet.is_nimbora_claimed = true;
                self.bets.write(bet_id, bet);
            }
        }

        fn checkHasClaimed(
            self: @ContractState, caller_address: ContractAddress, bet_id: u256,
        ) -> bool {
            assert(self.bets.read(bet_id).winner_result.is_settled, 'There is no winner bet');
            assert(self.bets.read(bet_id).is_bet_ended, 'Bet is not over yet');

            if self.bets.read(bet_id).winner_result.is_yes_outcome {
                let user = self.user_bet_yes_amount.read((caller_address, bet_id));
                return user.has_claimed && user.amount > 0;
            } else {
                let user = self.user_bet_no_amount.read((caller_address, bet_id));
                return user.has_claimed && user.amount > 0;
            }
        }


        fn claimRewards(ref self: ContractState, bet_id: u256, claim_yes: bool) {
            let precision = 1000000000000;
            let caller_address = get_caller_address();
            let winner_result = self.bets.read(bet_id).winner_result;
            let yes_win = winner_result.is_yes_outcome;

            let mut nimbora_total = winner_result.nimbora_total_amount_with_yield;
            loop { // TO DELETE FOR REAL USE - to cover nimbora fees
                if nimbora_total > self.bets.read(bet_id).total_bet_amount {
                    break;
                }
                nimbora_total = nimbora_total + 1;
            };
            let mut yield_generated = nimbora_total - self.bets.read(bet_id).total_bet_amount;

            if claim_yes {
                let mut user_yes_amount = self.user_bet_yes_amount.read((caller_address, bet_id));
                if user_yes_amount.amount > 0 && user_yes_amount.has_claimed == false {
                    if yes_win {
                        let transfer_amount = user_yes_amount.amount
                            + ((user_yes_amount.amount
                                * precision
                                / self.bets.read(bet_id).total_bet_yes_amount)
                                * yield_generated)
                                / precision; // amount earned with yield
                        self.bets.read(bet_id).bet_token.transfer(caller_address, transfer_amount);
                        // refund + yield
                    } else {
                        // refund
                        let transfer_amount = user_yes_amount.amount;
                        self.bets.read(bet_id).bet_token.transfer(caller_address, transfer_amount);
                    }
                    let mut user_bet_position = self
                        .user_bet_yes_amount
                        .read((caller_address, bet_id));
                    user_bet_position.has_claimed = true;
                    self.user_bet_yes_amount.write((caller_address, bet_id), user_bet_position);
                }
            } else {
                let mut user_no_amount = self.user_bet_no_amount.read((caller_address, bet_id));
                if user_no_amount.amount > 0 && user_no_amount.has_claimed == false {
                    if yes_win == false {
                        let transfer_amount = user_no_amount.amount
                            + ((user_no_amount.amount
                                * precision
                                / self.bets.read(bet_id).total_bet_no_amount)
                                * yield_generated)
                                / precision; // amount earned with yield
                        self.bets.read(bet_id).bet_token.transfer(caller_address, transfer_amount);
                        // refund + yield
                    } else {
                        // refund
                        let transfer_amount = user_no_amount.amount;
                        self.bets.read(bet_id).bet_token.transfer(caller_address, transfer_amount);
                    }
                    let mut user_bet_position = self
                        .user_bet_no_amount
                        .read((caller_address, bet_id));
                    user_bet_position.has_claimed = true;
                    self.user_bet_no_amount.write((caller_address, bet_id), user_bet_position);
                }
            }
        }

        fn fund_contract(ref self: ContractState, amount_eth: u256, bet_id: u256) {
            self.ownable.assert_only_owner();

            let caller_address = get_caller_address();
            let mut current_bet = self.bets.read(bet_id);
            current_bet.bet_token.transferFrom(caller_address, get_contract_address(), amount_eth);
        }
    }
}
