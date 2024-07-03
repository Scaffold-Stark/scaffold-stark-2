use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
use starknet::{ContractAddress, ClassHash, eth_address::EthAddress};


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

    fn deposit(ref self: TContractState, assets: u256, receiver: ContractAddress, referal: ContractAddress);

    fn request_withdrawal(ref self: TContractState, shares: u256);

    fn claim_withdrawal(ref self: TContractState, user: ContractAddress, id: u256);

    fn handle_report(
        ref self: TContractState, new_l1_net_asset_value: u256, underlying_bridged_amount: u256
    ) -> StrategyReportL2;
}

#[derive(Drop, Copy, Serde, starknet::Store, PartialEq, Eq, Hash)]
pub struct Outcome {
    name: felt252,
    is_yes_outcome: bool
}

#[derive(Drop, Serde, starknet::Store)]
pub struct UserBetPosition {
    pub amount: u256,
    pub has_claimed: bool,
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
    is_bet_ended: bool,
    total_bet_amount: u256,
    total_bet_yes_amount: u256,
    total_bet_no_amount: u256,
    winner_result: Option<Outcome>,
    results: (Outcome, Outcome),
    bet_token: IERC20CamelDispatcher,
    nimbora: ITokenManagerDispatcher,
    token_to_fetch_from_pragma: felt252
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
        result_names: (felt252, felt252),
        bet_token_address: ContractAddress,
        nimbora_address: ContractAddress,
        token_to_fetch_from_pragma: felt252
    );

    fn getTotalBets(self: @TContractState) -> u256;

    fn getBet(self: @TContractState, bet_id: u256) -> BetInfos;

    fn vote_yes(ref self: TContractState, amount_eth: u256, bet_id: u256);

    fn vote_no(ref self: TContractState, amount_eth: u256, bet_id: u256);

    fn get_yes_position(self: @TContractState, caller_address: ContractAddress, bet_id: u256) -> UserBetPosition;

    fn get_no_position(self: @TContractState, caller_address: ContractAddress, bet_id: u256) -> UserBetPosition;
}

#[starknet::contract]
pub mod BetCryptoMaker {
    use contracts::cryptos::PragmaPrice::IPragmaPrice;
    use contracts::cryptos::PragmaPrice::PragmaPrice as PragmaPriceComponent;
    use core::traits::TryInto;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use super::{ITokenManagerDispatcher, ITokenManagerDispatcherTrait};
    use pragma_lib::types::{AggregationMode, DataType, PragmaPricesResponse};
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address, get_block_timestamp};
    use super::BetInfos;
    use super::Outcome;
    use super::UserBetPosition;
    use super::IBetCryptoMaker;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PragmaPriceComponent, storage: pragma, event: PragmaPriceEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl PragmaPriceImpl = PragmaPriceComponent::PragmaPriceImpl<ContractState>;


    // const ETH_CONTRACT_ADDRESS: felt252 =
    //     0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7;

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
        //eth_token: IERC20CamelDispatcher,
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
    fn constructor(ref self: ContractState, owner: ContractAddress, pragma_address: ContractAddress) {
        self.ownable.initializer(owner);
        self.pragma_address.write(pragma_address);
    }

    fn depositToNimbora(self: @ContractState, amount_eth: u256, bet_id: u256) {
        let nimbora_dispatcher = self.bets.read(bet_id).nimbora;
        self.bets.read(bet_id).bet_token.approve(nimbora_dispatcher.contract_address, amount_eth);
        nimbora_dispatcher.deposit(amount_eth, get_contract_address(), get_contract_address());
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
            result_names: (felt252, felt252),
            bet_token_address: ContractAddress,
            nimbora_address: ContractAddress,
            token_to_fetch_from_pragma: felt252
        ) {
            self.ownable.assert_only_owner();

            let new_id = self.total_bets.read() + 1;
            self.total_bets.write(new_id);

            // Define possible results
            let (nameYes, nameNo) = result_names;
            let mut resultYes = Outcome { name: nameYes, is_yes_outcome: true };
            let mut resultNo = Outcome { name: nameNo, is_yes_outcome: false };
            let results = (resultYes, resultNo);


            let bet: BetInfos = BetInfos {
                id: new_id,
                name,
                description,
                category,
                reference_token_price,
                end_vote_bet_timestamp,
                end_bet_timestamp,
                is_bet_ended: false,
                total_bet_amount: 0,
                total_bet_yes_amount: 0,
                total_bet_no_amount: 0,
                winner_result: Option::None,
                results,
                bet_token: IERC20CamelDispatcher { contract_address: bet_token_address },
                nimbora: ITokenManagerDispatcher { contract_address: nimbora_address },
                token_to_fetch_from_pragma
            };
            self.bets.write(new_id, bet);
        }

        fn getTotalBets(self: @ContractState) -> u256 {
            return self.total_bets.read();
        }

        fn getBet(self: @ContractState, bet_id: u256) -> BetInfos {
            self.bets.read(bet_id)
        }

        fn vote_yes(ref self: ContractState, amount_eth: u256, bet_id: u256) {
            assert!(self.bets.read(bet_id).is_bet_ended == false, 'Bet is ended.');

            let caller_address = get_caller_address();
            // TODO: Assert period is correct

            if amount_eth > 0 {
                // call approve on UI
                let mut current_bet = self.bets.read(bet_id);
                current_bet.bet_token
                    .transferFrom(caller_address, get_contract_address(), amount_eth);

     
                current_bet.total_bet_amount += amount_eth;
                current_bet.total_bet_yes_amount += amount_eth;
                self.bets.write(bet_id, current_bet);


                let mut user_bet_position = self.user_bet_yes_amount.read((caller_address, bet_id));
                user_bet_position.amount += amount_eth;

                self
                    .user_bet_yes_amount
                    .write(
                        (caller_address, bet_id),
                        user_bet_position
                    );
            }
            depositToNimbora(@self, amount_eth, bet_id);
            // TODO
        }

        fn vote_no(ref self: ContractState, amount_eth: u256, bet_id: u256) {
            //let caller_address = get_caller_address();
            // TODO
        }

        fn get_yes_position(self: @ContractState, caller_address: ContractAddress, bet_id: u256) -> UserBetPosition {
            self.user_bet_yes_amount.read((caller_address, bet_id))
        }

        fn get_no_position(self: @ContractState, caller_address: ContractAddress, bet_id: u256) -> UserBetPosition {
            self.user_bet_no_amount.read((caller_address, bet_id))
        }
    }
}
