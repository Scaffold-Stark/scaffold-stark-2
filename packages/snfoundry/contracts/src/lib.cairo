mod helloStarknet;
mod simpleStorage;
mod vote;
mod challenge0;
mod challenge1;
mod presetERC1155;
mod challenge3;
mod presetERC20;
mod exampleExternalContract;
mod transferETH;

use starknet::ContractAddress;

#[starknet::interface]
trait IData<T> {
    fn get_data(self: @T) -> u64;
    fn set_data(ref self: T, new_value: u64);
}

#[starknet::interface]
trait IOwnable<T> {
    fn transfer_ownership(ref self: T, new_owner: ContractAddress);
    fn owner(self: @T) -> ContractAddress;
}

#[starknet::component]
pub mod ownable_component {
    use super::{ContractAddress, IOwnable};
    use starknet::get_caller_address;
    use core::num::traits::Zero;

    #[storage]
    struct Storage {
        owner: ContractAddress
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        OwnershipTransferred: OwnershipTransferred
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        #[key]
        previous_owner: ContractAddress,
        new_owner: ContractAddress,
    }

    #[embeddable_as(Ownable)]
    impl OwnableImpl<
        TContractState, +HasComponent<TContractState>
    > of IOwnable<ComponentState<TContractState>> {
        fn transfer_ownership(
            ref self: ComponentState<TContractState>, new_owner: ContractAddress
        ) {
            self.only_owner();
            self._transfer_ownership(new_owner);
        }
        fn owner(self: @ComponentState<TContractState>) -> ContractAddress {
            self.owner.read()
        }
    }

    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn only_owner(self: @ComponentState<TContractState>) {
            let owner: ContractAddress = self.owner.read();
            let caller: ContractAddress = get_caller_address();
            assert(caller.is_non_zero(), 'ZERO_ADDRESS_CALLER');
            assert(caller == owner, 'NOT_OWNER');
        }

        fn _transfer_ownership(
            ref self: ComponentState<TContractState>, new_owner: ContractAddress
        ) {
            let previous_owner: ContractAddress = self.owner.read();
            self.owner.write(new_owner);
            self
                .emit(
                    OwnershipTransferred { previous_owner: previous_owner, new_owner: new_owner }
                );
        }
    }
}

#[starknet::contract]
mod Ownable {
    use contracts::ownable_component;
    use super::{ContractAddress, IData};

    component!(path: ownable_component, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = ownable_component::Ownable<ContractState>;

    impl OwnableInternalImpl = ownable_component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        data: u64,
        #[substorage(v0)]
        ownable: ownable_component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OwnableEvent: ownable_component::Event
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_owner: ContractAddress) {
        self.ownable.owner.write(initial_owner);
        self.data.write(1);
    }
    #[abi(embed_v0)]
    impl OwnableDataImpl of IData<ContractState> {
        fn get_data(self: @ContractState) -> u64 {
            self.data.read()
        }
        fn set_data(ref self: ContractState, new_value: u64) {
            self.ownable.only_owner();
            self.data.write(new_value);
        }
    }
}
