use starknet::ContractAddress;
use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};

#[derive(Drop, Copy, Serde, starknet::Store, PartialEq, Eq, Hash)]
pub struct Outcome {
    name: felt252,
    is_yes_outcome: bool
}

#[derive(Drop, Serde, starknet::Store)]
pub struct UserBetPosition {
    amount: u256,
    has_claimed: bool,
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
    );

    fn getTotalBets(self: @TContractState) -> u256;

    fn getBet(self: @TContractState, bet_id: u256) -> BetInfos;

    fn vote_yes(ref self: TContractState, amount_eth: u256);

    fn vote_no(ref self: TContractState, amount_eth: u256);
}

#[starknet::contract]
pub mod BetCryptoMaker {
    use contracts::cryptos::PragmaPrice::IPragmaPrice;
    use contracts::cryptos::PragmaPrice::PragmaPrice as PragmaPriceComponent;
    use core::traits::TryInto;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
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
            };
            self.bets.write(new_id, bet);
        }

        fn getTotalBets(self: @ContractState) -> u256 {
            return self.total_bets.read();
        }

        fn getBet(self: @ContractState, bet_id: u256) -> BetInfos {
            self.bets.read(bet_id)
        }

        fn vote_yes(ref self: ContractState, amount_eth: u256) {
            let caller_address = get_caller_address();
            // TODO
        }

        fn vote_no(ref self: ContractState, amount_eth: u256) {
            let caller_address = get_caller_address();
            // TODO
        }
    }
}
