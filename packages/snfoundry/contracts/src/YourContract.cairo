use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
enum SampleEnum {
    enum1: u256,
    enum2: u256,
    enum3: ByteArray,
}

#[derive(Drop, Serde, starknet::Store)]
struct SampleStruct {
    id: u256,
    name: ByteArray,
    status: SampleEnum,
}

#[derive(Drop, Serde, starknet::Store)]
struct SampleNestedStruct {
    user: ContractAddress,
    data: SampleStruct,
    status: SampleEnum,
}

#[starknet::interface]
pub trait IYourContract<TContractState> {
    fn gretting(self: @TContractState) -> ByteArray;
    fn set_gretting(ref self: TContractState, new_greeting: ByteArray, amount_eth: u256);
    fn withdraw(ref self: TContractState);
    fn premium(self: @TContractState) -> bool;
    fn test_simple_enum_read(self: @TContractState) -> SampleEnum;
    fn test_simple_enum_write(ref self: TContractState, sample_enum: SampleEnum);
    fn test_struct_read(self: @TContractState) -> SampleStruct;
    fn test_struct_write(ref self: TContractState, sample_struct: SampleStruct);
    fn test_nested_struct_read(self: @TContractState) -> SampleNestedStruct;
    fn test_nested_struct_write(ref self: TContractState, sample_nested_struct: SampleNestedStruct);
}

#[starknet::contract]
mod YourContract {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use starknet::{get_caller_address, get_contract_address};
    use super::{ContractAddress, IYourContract, SampleEnum, SampleNestedStruct, SampleStruct};

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
        GreetingChanged: GreetingChanged,
    }

    #[derive(Drop, starknet::Event)]
    struct GreetingChanged {
        #[key]
        greeting_setter: ContractAddress,
        #[key]
        new_greeting: ByteArray,
        premium: bool,
        value: u256,
    }

    #[storage]
    struct Storage {
        eth_token: IERC20CamelDispatcher,
        greeting: ByteArray,
        premium: bool,
        total_counter: u256,
        user_gretting_counter: LegacyMap<ContractAddress, u256>,
        sample_enum: SampleEnum,
        sample_struct: SampleStruct,
        sample_nested_struct: SampleNestedStruct,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let eth_contract_address = ETH_CONTRACT_ADDRESS.try_into().unwrap();
        self.eth_token.write(IERC20CamelDispatcher { contract_address: eth_contract_address });
        self.greeting.write("Building Unstoppable Apps!!!");
        self.ownable.initializer(owner);
        self.sample_enum.write(SampleEnum::enum1(1));
    }

    #[abi(embed_v0)]
    impl YourContractImpl of IYourContract<ContractState> {
        fn gretting(self: @ContractState) -> ByteArray {
            self.greeting.read()
        }

        fn set_gretting(ref self: ContractState, new_greeting: ByteArray, amount_eth: u256) {
            self.greeting.write(new_greeting);
            self.total_counter.write(self.total_counter.read() + 1);
            let user_counter = self.user_gretting_counter.read(get_caller_address());
            self.user_gretting_counter.write(get_caller_address(), user_counter + 1);

            if amount_eth > 0 {
                self
                    .eth_token
                    .read()
                    .transferFrom(get_caller_address(), get_contract_address(), amount_eth);
                self.premium.write(true);
            } else {
                self.premium.write(false);
            }

            self
                .emit(
                    GreetingChanged {
                        greeting_setter: get_caller_address(),
                        new_greeting: self.greeting.read(),
                        premium: true,
                        value: 100,
                    }
                );
        }

        fn withdraw(ref self: ContractState) {
            self.ownable.assert_only_owner();
            let balance = self.eth_token.read().balanceOf(get_contract_address());
            self.eth_token.read().transfer(self.ownable.owner(), balance);
        }

        fn premium(self: @ContractState) -> bool {
            self.premium.read()
        }
        fn test_simple_enum_read(self: @ContractState) -> SampleEnum {
            self.sample_enum.read()
        }
        fn test_simple_enum_write(ref self: ContractState, sample_enum: SampleEnum) {
            self.sample_enum.write(sample_enum);
        }
        fn test_struct_read(self: @ContractState) -> SampleStruct {
            self.sample_struct.read()
        }
        fn test_struct_write(ref self: ContractState, sample_struct: SampleStruct) {
            self.sample_struct.write(sample_struct);
        }
        fn test_nested_struct_read(self: @ContractState) -> SampleNestedStruct {
            self.sample_nested_struct.read()
        }
        fn test_nested_struct_write(
            ref self: ContractState, sample_nested_struct: SampleNestedStruct
        ) {
            self.sample_nested_struct.write(sample_nested_struct);
        }
    }
}
