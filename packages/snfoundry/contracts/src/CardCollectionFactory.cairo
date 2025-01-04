use starknet::{ContractAddress, ClassHash};

#[derive(Drop, Serde, Copy, starknet::Store)]
struct PackInformation {
    pack_address: ContractAddress,
    card_collection: ContractAddress,
    token_id: u256,
    minter: ContractAddress,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
struct CollectionDistribution {
    token_id: u256,
    name: felt252,
    class: felt252,
    rarity: felt252,
    rate: u256,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
struct PackCollectionInformation {
    pack_address: ContractAddress,
    card_collection: ContractAddress,
    num_cards: u32,
}

#[starknet::interface]
trait ICardCollectionFactory<TContractState> {
    fn create_collection(
        ref self: TContractState,
        base_uri: ByteArray,
        pack_address: ContractAddress,
        num_cards: u32,
    );
    fn open_pack(ref self: TContractState, collection: ContractAddress, token_id: u256);
    fn set_collection_class_hash(ref self: TContractState, new_class_hash: ClassHash);
    fn set_random_oracle_callback_fee_limit(
        ref self: TContractState, random_oracle_callback_fee_limit: u128,
    );
    fn set_max_random_oracle_callback_fee_deposit(
        ref self: TContractState, max_random_oracle_callback_fee_deposit: u256,
    );
    fn update_collection(
        ref self: TContractState,
        collection: ContractAddress,
        pack_address: ContractAddress,
        num_cards: u32,
    );
    fn add_collection_distributions(
        ref self: TContractState, collection: ContractAddress, cards: Array<CollectionDistribution>,
    );
    fn update_collection_distributions(
        ref self: TContractState, collection: ContractAddress, cards: Array<CollectionDistribution>,
    );
    fn generate_random(self: @TContractState, seed: felt252, upper_bound: felt252) -> felt252;
    fn get_collection(
        self: @TContractState, collection: ContractAddress,
    ) -> PackCollectionInformation;
    fn get_collection_class_hash(self: @TContractState) -> ClassHash;
    fn get_random_oracle_callback_fee_limit(self: @TContractState) -> u128;
    fn get_max_random_oracle_callback_fee_deposit(self: @TContractState) -> u256;
    fn get_all_collection_addresses(self: @TContractState) -> Array<ContractAddress>;
    fn get_collection_distribution(
        self: @TContractState, collection: ContractAddress,
    ) -> Array<CollectionDistribution>;
}

#[starknet::interface]
pub trait IPragmaVRF<TContractState> {
    fn receive_random_words(
        ref self: TContractState,
        requestor_address: ContractAddress,
        request_id: u64,
        random_words: Span<felt252>,
        calldata: Array<felt252>,
    );
}

#[starknet::contract]
mod CardCollectionFactory {
    use super::super::CardCollection::ICardCollectionDispatcherTrait;
    use super::{PackInformation, CollectionDistribution, PackCollectionInformation};

    use starknet::{
        ContractAddress, ClassHash, get_caller_address, get_contract_address,
        contract_address_const, get_block_info,
    };
    use starknet::syscalls::deploy_syscall;
    use starknet::storage::{
        Map, StoragePointerReadAccess, StoragePathEntry, StoragePointerWriteAccess, Vec, VecTrait,
        MutableVecTrait,
    };

    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};
    use openzeppelin::access::ownable::{OwnableComponent};
    use openzeppelin::security::reentrancyguard::ReentrancyGuardComponent;

    use core::traits::TryInto;
    use core::num::traits::Zero;
    use core::hash::HashStateTrait;
    use core::byte_array::ByteArray;
    use core::pedersen::PedersenTrait;
    use core::integer::u256_from_felt252;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(
        path: ReentrancyGuardComponent, storage: reentrancyguard, event: ReentrancyGuardEvent,
    );

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;
    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        is_card_collection: Map<ContractAddress, bool>,
        all_card_collections: Vec<ContractAddress>,
        eth_dispatcher: IERC20Dispatcher,
        nonce: u64,
        random_oracle_contract_address: ContractAddress,
        mapping_request_pack: Map<u64, PackInformation>,
        card_collection_class_hash: ClassHash,
        collection_salt: u256,
        mapping_card_distribution: Map<ContractAddress, Vec<CollectionDistribution>>,
        mapping_card_all_phase: Map<ContractAddress, Vec<PackCollectionInformation>>,
        mapping_card_pack_details: Map<ContractAddress, PackCollectionInformation>,
        random_oracle_callback_fee_limit: u128,
        max_random_oracle_callback_fee_deposit: u256,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        reentrancyguard: ReentrancyGuardComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PackPhaseCreated: PackPhaseCreated,
        PackOpened: PackOpened,
        BatchCardsMinted: BatchCardsMinted,
        CollectionDistributionsSet: CollectionDistributionsSet,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
    }

    #[derive(Drop, Copy, starknet::Event)]
    struct PackPhaseCreated {
        #[key]
        owner: ContractAddress,
        collection: ContractAddress,
        pack_address: ContractAddress,
        num_cards: u32,
    }

    #[derive(Drop, Copy, starknet::Event)]
    struct PackOpened {
        #[key]
        caller: ContractAddress,
        collection: ContractAddress,
        pack_address: ContractAddress,
        token_id: u256,
    }

    #[derive(Drop, Copy, starknet::Event)]
    struct BatchCardsMinted {
        request_id: u64,
        minter: ContractAddress,
        card_collection: ContractAddress,
        num_cards: u32,
        token_ids_span: Span<u256>,
    }

    #[derive(Drop, Copy, starknet::Event)]
    struct CollectionDistributionsSet {
        collection: ContractAddress,
        total_cards: u32,
    }

    mod Errors {
        pub const CALLER_NOT_VRF_ORACLE: felt252 = 'Caller not VRF oracle';
        pub const INVALID_CONTRACT_ADDRESS: felt252 = 'Invalid contract address';
        pub const REQUESTOR_NOT_SELF: felt252 = 'Requestor is not self';
        pub const INVALID_PACK_OWNER: felt252 = 'Caller does not own the pack';
        pub const INVALID_COLLECTION: felt252 = 'Invalid Card Collection';
        pub const INVALID_FEE: felt252 = 'Invalid callback fee/limit';
    }

    pub const PUBLISH_DELAY: u64 = 1; // return the random value asap
    pub const NUM_OF_WORDS: u64 = 1; // 1 numbers

    const TWO_TO_THE_50: u256 = 1125899906842624; // This is 2^50 in decimal

    // Sepolia : 0x60c69136b39319547a4df303b6b3a26fab8b2d78de90b6bd215ce82e9cb515c
    // Mainnet : 0x4fb09ce7113bbdf568f225bc757a29cb2b72959c21ca63a7d59bdb9026da661

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        card_collection_class_hash: ClassHash,
        random_oracle_contract_address: ContractAddress,
        eth_address: ContractAddress,
        random_oracle_callback_fee_limit: u128,
        max_random_oracle_callback_fee_deposit: u256,
    ) {
        assert(
            Zero::is_non_zero(@owner)
                && Zero::is_non_zero(@card_collection_class_hash)
                && Zero::is_non_zero(@random_oracle_contract_address)
                && Zero::is_non_zero(@eth_address),
            Errors::INVALID_CONTRACT_ADDRESS,
        );
        assert(
            random_oracle_callback_fee_limit != 0 && max_random_oracle_callback_fee_deposit != 0,
            Errors::INVALID_FEE,
        );

        self.ownable.initializer(owner);
        self.random_oracle_callback_fee_limit.write(random_oracle_callback_fee_limit);
        self.max_random_oracle_callback_fee_deposit.write(max_random_oracle_callback_fee_deposit);
        self.card_collection_class_hash.write(card_collection_class_hash);
        self.random_oracle_contract_address.write(random_oracle_contract_address);
        self.eth_dispatcher.write(IERC20Dispatcher { contract_address: eth_address });
    }

    #[abi(embed_v0)]
    impl CardCollectionFactoryImpl of super::ICardCollectionFactory<ContractState> {
        fn create_collection(
            ref self: ContractState,
            base_uri: ByteArray,
            pack_address: ContractAddress,
            num_cards: u32,
        ) {
            self.reentrancyguard.start();
            self.ownable.assert_only_owner();
            assert(Zero::is_non_zero(@pack_address), Errors::INVALID_CONTRACT_ADDRESS);

            let caller = get_caller_address();

            let salt = self.collection_salt.read();
            self.collection_salt.write(salt + 1);

            let mut constructor_calldata = ArrayTrait::<felt252>::new();
            constructor_calldata.append(caller.into());
            constructor_calldata.append(get_contract_address().into());
            constructor_calldata.append(base_uri.data.len().into());
            for i in 0..base_uri.data.len() {
                constructor_calldata.append((*base_uri.data.at(i)).into());
            };
            constructor_calldata.append(base_uri.pending_word);
            constructor_calldata.append(base_uri.pending_word_len.into());

            let (collection, _) = deploy_syscall(
                self.get_collection_class_hash(),
                salt.try_into().unwrap(),
                constructor_calldata.span(),
                false,
            )
                .ok()
                .unwrap();

            self.is_card_collection.entry(collection).write(true);
            self.all_card_collections.append().write(collection);

            let pack_card_detail = PackCollectionInformation {
                pack_address, card_collection: collection, num_cards,
            };

            self.mapping_card_pack_details.entry((collection)).write(pack_card_detail);
            self.mapping_card_all_phase.entry(collection).append().write(pack_card_detail);
            self.emit(PackPhaseCreated { owner: caller, collection, pack_address, num_cards });
            self.reentrancyguard.end();
        }

        fn open_pack(ref self: ContractState, collection: ContractAddress, token_id: u256) {
            self.assert_only_card_collection(collection);
            let caller = get_caller_address();

            let phase_details = self.get_collection(collection);
            let pack_address = phase_details.pack_address;
            let pack_dispatcher = IERC721Dispatcher { contract_address: pack_address };
            assert(pack_dispatcher.owner_of(token_id) == caller, Errors::INVALID_PACK_OWNER);

            // burn
            let DEAD_ADDRESS: ContractAddress = contract_address_const::<
                0x000000000000000000000000000000000000000000000000000000000000dead,
            >();
            pack_dispatcher.transfer_from(caller, DEAD_ADDRESS, token_id);

            let mut random_number = self
                .generate_random(
                    caller.into(), caller.into(),
                ); // TODO randomizer words 0x351c9a2173a1e93c2b689a65f99ad21ccf8f00558c738b14599c64d2ba024b
            let request_id : u64 = 1;

            let pack_token_detail = PackInformation {
                pack_address, card_collection: collection, token_id, minter: caller,
            };

            self.mapping_request_pack.entry(request_id).write(pack_token_detail);

            self._mint_cards(random_number, request_id);

            self.emit(PackOpened { caller, collection, pack_address, token_id });
        }

        fn update_collection(
            ref self: ContractState,
            collection: ContractAddress,
            pack_address: ContractAddress,
            num_cards: u32,
        ) {
            self.ownable.assert_only_owner();
            self.assert_only_card_collection(collection);

            let new_card_pack_details = PackCollectionInformation {
                pack_address, card_collection: collection, num_cards,
            };
            self.mapping_card_pack_details.entry((collection)).write(new_card_pack_details);

            self
                .emit(
                    PackPhaseCreated {
                        owner: self.ownable.owner(), collection, pack_address, num_cards,
                    },
                );
        }

        fn set_collection_class_hash(ref self: ContractState, new_class_hash: ClassHash) {
            self.ownable.assert_only_owner();
            self.card_collection_class_hash.write(new_class_hash);
        }

        fn set_random_oracle_callback_fee_limit(
            ref self: ContractState, random_oracle_callback_fee_limit: u128,
        ) {
            self.ownable.assert_only_owner();
            self.random_oracle_callback_fee_limit.write(random_oracle_callback_fee_limit);
        }

        fn set_max_random_oracle_callback_fee_deposit(
            ref self: ContractState, max_random_oracle_callback_fee_deposit: u256,
        ) {
            self.ownable.assert_only_owner();
            self
                .max_random_oracle_callback_fee_deposit
                .write(max_random_oracle_callback_fee_deposit);
        }

        fn add_collection_distributions(
            ref self: ContractState,
            collection: ContractAddress,
            cards: Array<CollectionDistribution>,
        ) {
            self.ownable.assert_only_owner();
            self.assert_only_card_collection(collection);

            let storage_vec = self.mapping_card_distribution.entry((collection));

            for i in 0..cards.len() {
                let card = cards.at(i);
                storage_vec.append().write(card.clone());
            };

            self.emit(CollectionDistributionsSet { collection, total_cards: cards.len() })
        }

        fn update_collection_distributions(
            ref self: ContractState,
            collection: ContractAddress,
            cards: Array<CollectionDistribution>,
        ) {
            self.ownable.assert_only_owner();
            self.assert_only_card_collection(collection);

            let storage_vec = self.mapping_card_distribution.entry((collection));
            let length: u32 = storage_vec.len().try_into().unwrap();

            for i in 0..cards.len() {
                let card = cards.at(i);
                let index: u64 = i.try_into().unwrap();
                if i < length {
                    storage_vec.at(index).write(card.clone());
                } else {
                    storage_vec.append().write(card.clone());
                }
            };

            if cards.len() < length {
                let excess_count = length - cards.len();
                let start_index = cards.len();

                for i in start_index..start_index + excess_count {
                    let index: u64 = i.try_into().unwrap();
                    storage_vec
                        .at(index)
                        .write(
                            CollectionDistribution {
                                token_id: 0,
                                name: 0,
                                class: 0,
                                rarity: 0,
                                rate: u256 { low: 0, high: 0 },
                            },
                        );
                }
            }

            self.emit(CollectionDistributionsSet { collection, total_cards: cards.len() })
        }

        fn get_collection(
            self: @ContractState, collection: ContractAddress,
        ) -> PackCollectionInformation {
            let phase_details = self.mapping_card_pack_details.entry((collection)).read();
            phase_details
        }

        fn get_collection_class_hash(self: @ContractState) -> ClassHash {
            self.card_collection_class_hash.read()
        }

        fn get_random_oracle_callback_fee_limit(self: @ContractState) -> u128 {
            self.random_oracle_callback_fee_limit.read()
        }

        fn get_max_random_oracle_callback_fee_deposit(self: @ContractState) -> u256 {
            self.max_random_oracle_callback_fee_deposit.read()
        }

        fn get_all_collection_addresses(self: @ContractState) -> Array<ContractAddress> {
            let mut collections = ArrayTrait::new();
            for i in 0..self.all_card_collections.len() {
                collections.append(self.all_card_collections.at(i).read());
            };
            collections
        }

        fn get_collection_distribution(
            self: @ContractState, collection: ContractAddress,
        ) -> Array<CollectionDistribution> {
            let distributions = self.mapping_card_distribution.entry((collection));

            if distributions.len() == 0 {
                return ArrayTrait::<CollectionDistribution>::new();
            }

            let mut card_distributions = ArrayTrait::new();
            for i in 0..distributions.len() {
                card_distributions.append(distributions.at(i).read());
            };
            card_distributions
        }

        fn generate_random(self: @ContractState, seed: felt252, upper_bound: felt252) -> felt252 {
            // let hash_value = PedersenTrait::new(seed).update(0).finalize();
            // let hash_u256 = u256_from_felt252(hash_value);
            // let upper_bound_u256 = u256_from_felt252(upper_bound);
            // let random_number = hash_u256 % upper_bound_u256;

            // random_number.try_into().unwrap()
            seed
        }
    }

    #[generate_trait]
    impl InternalFactoryImpl of InternalImplTrait {
        fn assert_only_card_collection(self: @ContractState, collection: ContractAddress) {
            let is_card_collection = self.is_card_collection.entry(collection).read();
            assert(is_card_collection, Errors::INVALID_COLLECTION);
        }

        fn _mint_cards(ref self: ContractState, random_words: felt252, request_id: u64) {
            let pack_token_detail = self.mapping_request_pack.entry(request_id).read();

            let card_collection = pack_token_detail.card_collection;
            let minter = pack_token_detail.minter;

            let phase_details = self.get_collection(card_collection);
            let num_cards = phase_details.num_cards;

            let card_dispatcher = contracts::CardCollection::ICardCollectionDispatcher {
                contract_address: card_collection,
            };
            let selected_cards = self
                ._select_random_cards(card_collection, random_words, num_cards);

            let mut token_ids_array = array![];
            let mut amounts_array = array![];

            for i in 0..selected_cards.len() {
                let token_id: u256 = selected_cards[i].token_id.clone();
                token_ids_array.append(token_id);

                let amount: u256 = u256 { low: 1, high: 0 };
                amounts_array.append(amount);
            };

            // Mint the selected cards using claim_batch_cards
            let token_ids_span = token_ids_array.span();
            let amounts_span = amounts_array.span();

            card_dispatcher.claim_batch_cards(minter, token_ids_span, amounts_span);

            self
                .emit(
                    BatchCardsMinted {
                        request_id, minter, card_collection, num_cards, token_ids_span,
                    },
                );
        }

        fn _select_random_cards(
            self: @ContractState,
            card_collection: ContractAddress,
            random_words: felt252,
            num_cards: u32,
        ) -> Array<CollectionDistribution> {
            let distributions = self.mapping_card_distribution.entry((card_collection));

            if distributions.len() == 0 {
                return ArrayTrait::<CollectionDistribution>::new();
            }
            let all_cards = self.get_collection_distribution(card_collection);

            // Initialize an empty array to hold the selected cards
            let mut selected_cards = array![];

            // Convert felt252 to u256
            let mut random_value_u256: u256 = random_words.into();
            let total_weight: u256 = self._calculate_total_weight(all_cards);

            let all_cards = self.get_collection_distribution(card_collection);

            for _ in 0..num_cards {
                let chunk: u256 = random_value_u256 & (TWO_TO_THE_50 - 1); // Mask 50 bits

                // Normalize the chunk to be in the range 0-9999
                let random_value_normalized: u256 = chunk % total_weight;

                // Calculate which card this random number corresponds to
                let mut cumulative_weight = 0;

                let len_u64: u64 = distributions.len();
                let len_u32: u32 = len_u64.try_into().unwrap();

                for j in 0..len_u32 {
                    let card = all_cards.at(j);
                    cumulative_weight += card.rate.clone();
                    if random_value_normalized < cumulative_weight {
                        selected_cards.append(card.clone());
                        break;
                    }
                };

                // Shift the random value to the right by 50 bits (not dividing, just shift
                // bits)
                random_value_u256 = random_value_u256 / TWO_TO_THE_50;
            };

            selected_cards
        }

        fn _calculate_total_weight(
            self: @ContractState, all_cards: Array<CollectionDistribution>,
        ) -> u256 {
            let mut total_weight: u256 = 0;
            let mut i = 0;
            let len = all_cards.len();
            while i < len {
                let card = all_cards.at(i);
                total_weight = total_weight + *card.rate;
                i += 1;
            };
            total_weight
        }
    }
}

