use starknet::ContractAddress;

#[starknet::interface]
pub trait IYourContract<TContractState> {
    fn gretting(self: @TContractState) -> ByteArray;
    fn set_gretting(ref self: TContractState, new_greeting: ByteArray, amount_eth: u256);
    fn withdraw(ref self: TContractState);
    fn premium(self: @TContractState) -> bool;
    fn testStruct(self: @TContractState) -> SimpleStruct;
    fn testStructAsInput( ref self: TContractState, simple_struct: SimpleStruct);
    fn testEnum(self: @TContractState) -> Direction;
    fn testEnumAsInput(ref self: TContractState, direction: Direction);
}
#[derive(Serde, Copy, Drop, Introspect)]
enum Direction {
    None,
    Left,
    Right,
    Up,
    Down,
}

#[derive(Serde, Copy, Drop, Introspect)]
struct SimpleStruct {
    #[key]
    player: ContractAddress,
    remaining: u8,
    last_direction: Direction
}

#[starknet::contract]
mod YourContract {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::access::ownable::ownable::OwnableComponent::InternalTrait;
    use openzeppelin::token::erc20::interface::{IERC20CamelDispatcher, IERC20CamelDispatcherTrait};
    use starknet::{get_caller_address, get_contract_address};
    use super::{ContractAddress, IYourContract, SimpleStruct, Direction };

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
        GreetingChanged: GreetingChanged
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
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let eth_contract_address = ETH_CONTRACT_ADDRESS.try_into().unwrap();
        self.eth_token.write(IERC20CamelDispatcher { contract_address: eth_contract_address });
        self.greeting.write("Building Unstoppable Apps!!!");
        self.ownable.initializer(owner);
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
                // call approve on UI
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
                        value: 100
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
        fn testStruct(self: @ContractState) -> SimpleStruct {
            SimpleStruct {
                player: get_caller_address(),
                remaining: 10,
                last_direction: Direction::Right,
            }
        }
        fn testStructAsInput(ref self: ContractState, simple_struct: SimpleStruct) {
            // assert_eq!(simple_struct.player, get_caller_address());
            // assert_eq!(simple_struct.remaining, 10);
        }
        fn testEnum(self: @ContractState) -> Direction {
            Direction::Right
        }
        fn testEnumAsInput(ref self: ContractState, direction: Direction) {
            // assert_eq!(direction, Direction::Right);
        }
    }
}
