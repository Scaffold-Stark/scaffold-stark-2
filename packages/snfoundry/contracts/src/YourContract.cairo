use starknet::{ContractAddress, get_block_timestamp};

#[starknet::interface]
pub trait ISquadGoals<TContractState> {
    fn create_challenge(
        ref self: TContractState,
        stake_amount: u256,
        duration: u256,
        cid: ByteArray,
    );
    fn join_challenge(
        ref self: TContractState,
        challenge_id: u256,
    );
    fn complete_challenge(
        ref self: TContractState,
        challenge_id: u256,
        users_completed: Span<(ContractAddress, bool)>,
    );
    // view functions 
    fn get_challenge_stakers(self: @TContractState, challenge_id: u256) -> Span<ContractAddress> ;
    fn get_challenge_data(self: @TContractState, challenge_id: u256) -> (u256, u256, u256, bool);
    fn get_challenge_cid(self: @TContractState, challenge_id: u256) -> ByteArray;
    fn get_challenge_counter(self: @TContractState) -> u256;
    fn test_write_span_felt(ref self: TContractState, span: Span<felt252>);
    fn test_write_span_u256(ref self: TContractState, span: Span<u256>);
    fn test_write_span_bool(ref self: TContractState, span: Span<bool>);
    fn test_write_span_address(ref self: TContractState, span: Span<ContractAddress>);
    fn test_write_span_byte_array(ref self: TContractState, span: Span<ByteArray>);

    // special
    fn test_double_input_span(ref self: TContractState, span1: Span<u256>, span2: Span<u256>);

    // test reads
    fn get_last_span_data_felt(self: @TContractState) -> (felt252, felt252);
    fn get_last_span_data_u256(self: @TContractState) -> (felt252, u256);
    fn get_last_span_data_bool(self: @TContractState) -> (felt252, bool);
    fn get_last_span_data_address(self: @TContractState) -> (felt252, ContractAddress);
    fn get_last_span_data_byte_array(self: @TContractState) -> (felt252, ByteArray);

    fn test_read_double_input_span(ref self: TContractState) -> (u256, u256);

}

#[starknet::contract]
mod YourContract {
    use core::option::OptionTrait;
use core::traits::TryInto;
use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use starknet::{get_caller_address, get_contract_address};
    use super::{ContractAddress, ISquadGoals, get_block_timestamp};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    const ETH_CONTRACT_ADDRESS: felt252 =
        0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        ChallengeCreated: ChallengeCreated,
        ChallengeJoined: ChallengeJoined,
    }

    #[derive(Drop, starknet::Event)]
    struct ChallengeCreated {
        #[key]
        id: u256,
        stake_amount: u256,
        deadline: u256,
    }


    #[derive(Drop, starknet::Event)]
    struct ChallengeJoined {
        #[key]
        id: u256,
        user: ContractAddress,
        time_joined: u256,
    }

    #[storage]
    struct Storage {
        // squad goals stuff
        challenge_counter: u256,
        challenge_stake_amount: LegacyMap<u256, u256>,
        challenge_cid: LegacyMap<u256, ByteArray>,
        challenge_staker_count: LegacyMap<u256, u256>,
        challenge_staker_by_id: LegacyMap<(u256, u256), ContractAddress>,
        challenge_deadline: LegacyMap<u256, u256>,
        challenge_has_joined: LegacyMap<(u256, ContractAddress), bool>,
        challenge_has_completed: LegacyMap<u256, bool>,
        challenge_balance: LegacyMap<u256, u256>,
        challenge_user_vote_count: LegacyMap<(u256, ContractAddress), u256>,
        challenge_user_submitted_vote: LegacyMap<(u256, ContractAddress), bool>,
        challenge_user_has_vote_for: LegacyMap<(u256, ContractAddress, ContractAddress), bool>,
        challenge_submission_count: LegacyMap<u256, u256>,


        test_last_write_span_length: felt252,
        test_2nd_last_item_span_felt: felt252,
        test_2nd_last_item_span_u256: u256,
        test_2nd_last_item_span_bool: bool,
        test_2nd_last_item_span_address: ContractAddress,
        test_2nd_last_item_span_byte_array: ByteArray,
        test_2nd_last_item_span_contract_address: ContractAddress,

        test_double_input_span_last_2nd_item1: u256,
        test_double_input_span_last_2nd_item2: u256,

        // previous stuff
        eth_token: IERC20CamelDispatcher,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let eth_contract_address = ETH_CONTRACT_ADDRESS.try_into().unwrap();
        self.eth_token.write(IERC20CamelDispatcher { contract_address: eth_contract_address });
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl ISquadGoalsImpl of ISquadGoals<ContractState> {
        fn create_challenge(
            ref self: ContractState,
            stake_amount: u256,
            duration: u256,
            cid: ByteArray,
        ) {
            // transfer the stake amount
            self
                .eth_token
                .read()
                .transferFrom(get_caller_address(), get_contract_address(), stake_amount);

            let challenge_counter = self.challenge_counter.read();
            let challenge_staker_counter = self.challenge_staker_count.read(challenge_counter);
            let current_timestamp:u256 = get_block_timestamp().try_into().unwrap();

            self.challenge_balance.write(challenge_counter, stake_amount);
            self.challenge_stake_amount.write(challenge_counter, stake_amount);
            self.challenge_staker_by_id.write((challenge_counter, challenge_staker_counter), get_caller_address());
            self.challenge_has_joined.write((challenge_counter, get_caller_address()), true);
            self.challenge_deadline.write(challenge_counter, current_timestamp + duration);
            self.challenge_counter.write(challenge_counter + 1);
            self.challenge_cid.write(challenge_counter, cid);
            self.challenge_staker_count.write(challenge_counter, challenge_staker_counter + 1);

            self.emit(ChallengeCreated {
                id: challenge_counter,
                stake_amount: stake_amount,
                deadline: current_timestamp + duration,
            });
            self.emit(ChallengeJoined {
                id: challenge_counter,
                user: get_caller_address(),
                time_joined: current_timestamp,
            });
        }

        fn join_challenge(
            ref self: ContractState,
            challenge_id: u256,
        ) {
            // ------ PRECHECKS ------
            let has_completed = self.challenge_has_completed.read(challenge_id);
            assert!(!has_completed, "Challenge has already been completed");

            let current_timestamp:u256 = get_block_timestamp().try_into().unwrap();
            let challenge_deadline = self.challenge_deadline.read(challenge_id);
            assert!(current_timestamp <= challenge_deadline, "Challenge has expired");

            
            // ------ LOGIC ------
            let challenge_stake_amount = self.challenge_stake_amount.read(challenge_id);
            let challenge_current_balance = self.challenge_balance.read(challenge_id);
            let challenge_staker_counter = self.challenge_staker_count.read(challenge_id);
            self
                .eth_token
                .read()
                .transferFrom(get_caller_address(), get_contract_address(), challenge_stake_amount);
            self.challenge_balance.write(challenge_id, challenge_current_balance + challenge_stake_amount);
            self.challenge_staker_by_id.write((challenge_id, challenge_staker_counter), get_caller_address());
            self.challenge_has_joined.write((challenge_id, get_caller_address()), true);
            self.challenge_staker_count.write(challenge_id, challenge_staker_counter + 1);

            self.emit(ChallengeJoined {
                id: challenge_id,
                user: get_caller_address(),
                time_joined: current_timestamp,
            });
        }

        fn get_challenge_counter(self: @ContractState) -> u256 {
            self.challenge_counter.read()
        }
        
        // this works and will currently return a list of span of contract addresses
        fn get_challenge_stakers(self: @ContractState, challenge_id: u256) -> Span<ContractAddress> {
            self._get_challenge_stakers(challenge_id)
        }

        fn get_challenge_data(self: @ContractState, challenge_id: u256) -> (u256, u256, u256, bool) {
            let stake_amount = self._get_challenge_stake_amount(challenge_id);
            let staker_count = self._get_challenge_staker_count(challenge_id);
            let deadline = self._get_challenge_deadline(challenge_id);
            let has_completed = self._get_challenge_has_completed(challenge_id);
            (stake_amount, staker_count, deadline, has_completed)
        }
        fn get_challenge_cid(self: @ContractState, challenge_id: u256) -> ByteArray {
            self.challenge_cid.read(challenge_id)        
        }
        fn complete_challenge(
            ref self: ContractState,
            challenge_id: u256,
            mut users_completed: Span<(ContractAddress, bool)>,
        ) {
            let current_timestamp:u256 = get_block_timestamp().try_into().unwrap();
            let challenge_deadline = self.challenge_deadline.read(challenge_id);
            let challenge_has_completed = self.challenge_has_completed.read(challenge_id);
            let has_caller_joined = self.challenge_has_joined.read((challenge_id, get_caller_address()));
            let has_caller_submitted_vote = self.challenge_user_submitted_vote.read((challenge_id, get_caller_address()));
            assert!(!challenge_has_completed, "Challenge already completed");
            assert!(current_timestamp > challenge_deadline, "Challenge has not expired yet");
            assert!(has_caller_joined, "Caller has not joined the challenge");
            assert!(!has_caller_submitted_vote, "Caller has already submitted vote");

            // populate the vote count of users
            loop {
                if users_completed.len() == 0 {
                    break;
                }
                let (user, has_completed) = *users_completed.pop_front().unwrap();
                let mut has_already_voted_for = self.challenge_user_has_vote_for.read((challenge_id, get_caller_address(), user));
                assert!(!has_already_voted_for, "User has already voted for this user");
                if has_completed {
                    let user_vote_count = self.challenge_user_vote_count.read((challenge_id, user));
                    self.challenge_user_vote_count.write((challenge_id, user), user_vote_count + 1);
                }
                self.challenge_user_has_vote_for.write((challenge_id, user, get_caller_address()), true);
            };

            self.challenge_user_submitted_vote.write((challenge_id, get_caller_address()), true);
            self.challenge_submission_count.write(challenge_id, self.challenge_submission_count.read(challenge_id) + 1);

            self._complete_challenge(challenge_id);
        }

        fn test_write_span_felt(ref self: ContractState, mut span: Span<felt252>) {
            self.test_last_write_span_length.write(span.len().into());

            // get second item with loop like in previous function and pop;
            loop {
                if span.len() == 2 {
                    let second_item = *span.pop_back().unwrap();
                    self.test_2nd_last_item_span_felt.write(second_item);
                    break;
                }
                let useless_item = *span.pop_front().unwrap();
            };
        }

        fn test_write_span_u256(ref self: ContractState, mut span: Span<u256>) {
            self.test_last_write_span_length.write(span.len().into());

            // get second item with loop like in previous function and pop;
            loop {
                if span.len() == 2 {
                    let second_item = *span.pop_front().unwrap();
                    self.test_2nd_last_item_span_u256.write(second_item);
                    break;
                }
                let useless_item = *span.pop_front().unwrap();
            };
        }

        fn test_write_span_bool(ref self: ContractState, mut span: Span<bool>) {
            self.test_last_write_span_length.write(span.len().into());

            // get second item with loop like in previous function and pop;
            loop {
                if span.len() == 2 {
                    let second_item = *span.pop_front().unwrap();
                    self.test_2nd_last_item_span_bool.write(second_item);
                    break;
                }
                let useless_item = *span.pop_front().unwrap();
            };
        }

        fn test_write_span_address(ref self: ContractState, mut span: Span<ContractAddress>) {
            self.test_last_write_span_length.write(span.len().into());

            // get second item with loop like in previous function and pop;
            loop {
                if span.len() == 2 {
                    let second_item = *span.pop_front().unwrap();
                    self.test_2nd_last_item_span_address.write(second_item);
                    break;
                }
                let useless_item = *span.pop_front().unwrap();
            };
        }

        fn test_write_span_byte_array(ref self: ContractState, mut span: Span<ByteArray>) {
            self.test_last_write_span_length.write(span.len().into());

            // only write the length of the string array

            // get second item with loop like in previous function and pop;
            // loop {
            //     if span.len() == 2 {
            //         let mut second_item = *span.pop_front().unwrap();
            //         self.test_2nd_last_item_span_byte_array.write(second_item);
            //         break;
            //     }
            //     let useless_item = *span.pop_front().unwrap();
            // };
        }

        fn test_double_input_span(ref self: ContractState, mut span1: Span<u256>, mut span2: Span<u256>) {

            // only write the length of the string array

            // get second item with loop like in previous function and pop;
            loop {
                if span1.len() == 2 {
                    let mut second_item = *span1.pop_front().unwrap();
                    let mut second_item2 = *span2.pop_front().unwrap();
                    self.test_double_input_span_last_2nd_item1.write(second_item);
                    self.test_double_input_span_last_2nd_item2.write(second_item2);
                    break;
                }
                let useless_item = *span1.pop_front().unwrap();
                let useless_item2 = *span2.pop_front().unwrap();
            };
        }

        fn test_read_double_input_span(ref self: ContractState) -> (u256, u256) {
            let last_2nd_item1 = self.test_double_input_span_last_2nd_item1.read();
            let last_2nd_item2 = self.test_double_input_span_last_2nd_item2.read();
            (last_2nd_item1, last_2nd_item2)
        }

        fn get_last_span_data_felt(self: @ContractState) -> (felt252, felt252) {
            let last_span_length = self.test_last_write_span_length.read();
            let second_last_item = self.test_2nd_last_item_span_felt.read();
            (last_span_length, second_last_item)
        }

        fn get_last_span_data_u256(self: @ContractState) -> (felt252, u256) {
            let last_span_length = self.test_last_write_span_length.read();
            let second_last_item = self.test_2nd_last_item_span_u256.read();
            (last_span_length, second_last_item)
        }

        fn get_last_span_data_bool(self: @ContractState) -> (felt252, bool) {
            let last_span_length = self.test_last_write_span_length.read();
            let second_last_item = self.test_2nd_last_item_span_bool.read();
            (last_span_length, second_last_item)
        }

        fn get_last_span_data_address(self: @ContractState) -> (felt252, ContractAddress) {
            let last_span_length = self.test_last_write_span_length.read();
            let second_last_item = self.test_2nd_last_item_span_address.read();
            (last_span_length, second_last_item)
        }

        fn get_last_span_data_byte_array(self: @ContractState) -> (felt252, ByteArray) {
            let last_span_length = self.test_last_write_span_length.read();
            let second_last_item = self.test_2nd_last_item_span_byte_array.read();
            (last_span_length, second_last_item)
        }

    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {

        fn _complete_challenge(
            ref self: ContractState,
            challenge_id: u256,
        )
        {
            let mut submission_count = self.challenge_submission_count.read(challenge_id);
            let mut staker_count = self.challenge_staker_count.read(challenge_id);
            if submission_count < staker_count {
                return;
            }

            let vote_threshold = staker_count / 2;

            let mut stakers = self._get_challenge_stakers(challenge_id);

            let mut not_reached_count: u256 = 0;
            loop {
                if stakers.len() == 0 {
                    break;
                }
                let staker = *stakers.pop_front().unwrap();
                let vote_count = self.challenge_user_vote_count.read((challenge_id, staker));
                if vote_count < vote_threshold {
                    not_reached_count += 1;
                }
            };

            let challenge_balance = self.challenge_balance.read(challenge_id);
            let non_refundable_amount = self.challenge_stake_amount.read(challenge_id) * not_reached_count;
            let extra_amount_per_user = (challenge_balance - non_refundable_amount) / (staker_count - not_reached_count);
            let weighted_amount_per_user = self.challenge_stake_amount.read(challenge_id) + extra_amount_per_user * 9000 / 10000; // 10% fee
            loop {
                if stakers.len() == 0 {
                    break;
                }
                let staker = *stakers.pop_front().unwrap();
                let vote_count = self.challenge_user_vote_count.read((challenge_id, staker));
                if vote_count > vote_threshold {
                    self
                        .eth_token
                        .read()
                        .transferFrom(get_contract_address(), staker, weighted_amount_per_user);
                }
            };
            self.challenge_has_completed.write(challenge_id, true);

        }
        fn _get_challenge_stakers(
            self: @ContractState,
            challenge_id: u256,
        ) -> Span<ContractAddress>
        {
            let mut staker_count = self.challenge_staker_count.read(challenge_id);
            let mut stakers = array![];
            let mut i:u256 = 0;
            loop {
                if i >= staker_count {
                    break;
                }
                stakers.append(self.challenge_staker_by_id.read((challenge_id, i)));
                i += 1;
            };
            stakers.span()
        }

        fn _get_challenge_stake_amount(self: @ContractState, challenge_id: u256) -> u256 {
            self.challenge_stake_amount.read(challenge_id)
        }
        fn _get_challenge_staker_count(self: @ContractState, challenge_id: u256) -> u256 {
            self.challenge_staker_count.read(challenge_id)
        }
        fn _get_challenge_staker_by_id(self: @ContractState, challenge_id: u256, staker_id: u256) -> ContractAddress {
            self.challenge_staker_by_id.read((challenge_id, staker_id))
        }
        fn _get_challenge_deadline(self: @ContractState, challenge_id: u256) -> u256 {
            self.challenge_deadline.read(challenge_id)
        }
        fn _get_challenge_has_joined(self: @ContractState, challenge_id: u256, staker: ContractAddress) -> bool {
            self.challenge_has_joined.read((challenge_id, staker))
        }
        fn _get_challenge_has_completed(self: @ContractState, challenge_id: u256) -> bool {
            self.challenge_has_completed.read(challenge_id)
        }
        fn _get_challenge_balance(self: @ContractState, challenge_id: u256) -> u256 {
            self.challenge_balance.read(challenge_id)
        }

    }
}
