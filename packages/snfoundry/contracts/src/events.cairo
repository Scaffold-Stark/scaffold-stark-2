use starknet::ContractAddress;

// TYPES

#[derive(Drop, Serde)]
enum SampleEnum {
    enum1: u256,
    enum2: felt252
}

#[derive(Drop, Serde)]
enum SampleNestedEnum {
    enum1: SampleEnum,
    enum2: felt252
}

#[derive(Drop, Serde)]
struct SampleNestedStruct {
    element1: u256,
    element2: felt252,
}

#[derive(Drop, Serde)]
struct Layer2NestedStruct {
    element1: SampleNestedStruct,
    element2: felt252
}

#[derive(Drop, Serde)]
struct Layer3NestedStruct {
    element1: Layer2NestedStruct,
}

// EVENTS

#[derive(Drop, starknet::Event)]
pub struct SimpleEvent {
    id: u256,
    name: ByteArray,
}

#[derive(Drop, starknet::Event)]
pub struct EventWithSimpleTypes {
    element1: u256,
    element2: felt252,
    element3: bool,
    element4: i128
}

#[derive(Drop, starknet::Event)]
pub struct EventWithComplexTypes {
    element1: ContractAddress,
    element2: ByteArray,
    element3: Array<u256>,
}

#[derive(Drop, starknet::Event)]
pub struct EventWithTuple {
    element1: (ContractAddress, felt252),
    element2: (felt252, u256),
    element3: (ByteArray, bool),
}

#[derive(Drop, starknet::Event)]
pub struct EventWithEnum {
    element1: u256,
    element2: SampleEnum,
}

#[derive(Drop, starknet::Event)]
pub struct EventWithNestedEnum {
    element1: u256,
    element2: SampleNestedEnum,
}

#[derive(Drop, starknet::Event)]
pub struct EventWithTwoKeys {
    #[key]
    element1: u256,
    #[key]
    element2: felt252,
}

#[derive(Drop, starknet::Event)]
pub struct EventWithNestedStruct {
    outer_element1: SampleNestedStruct,
    outer_element2: u256
}

#[derive(Drop, starknet::Event)]
pub struct EventWithLayer2NestedStruct {
    outer_element1: Layer2NestedStruct,
    outer_element2: u256
}

#[derive(Drop, starknet::Event)]
pub struct EventWithLayer3NestedStruct {
    outer_element1: Layer3NestedStruct,
    outer_element2: u256
}

// FLAT EVENTS

#[derive(Drop, starknet::Event)]
pub enum EventWithoutFlat {
    Element1: UpdatedName,
    Element2: UpdatedAge
}

#[derive(Drop, starknet::Event)]
pub enum EventFlat {
    Element1: UpdatedName,
    Element2: UpdatedAge
}

#[derive(Drop, starknet::Event)]
pub struct UpdatedName {
    #[key]
    id: u32,
    name: felt252
}

#[derive(Drop, starknet::Event)]
pub struct UpdatedAge {
    #[key]
    id: u32,
    age: u256
}

#[starknet::interface]
pub trait IEvents<TContractState> {
    fn emit_simple_event(ref self: TContractState, id: u256, name: ByteArray);
    fn emit_event_with_simple_types(
        ref self: TContractState, element1: u256, element2: felt252, element3: bool, element4: i128
    );

    // DOESNT WORK FOR ARRAY
    fn emit_event_with_complex_types(
        ref self: TContractState,
        element1: ContractAddress,
        element2: ByteArray,
        element3: Array<u256>
    );


    // DOESNT WORK
    // UI BREAK WITH ERROR
    // TypeError: Cannot read properties of undefined (reading 'includes')
    // Source
    // utils/scaffold-stark/types.ts (89:7) @ includes
    fn emit_event_with_tuple(
        ref self: TContractState,
        element1: (ContractAddress, felt252),
        element2: (felt252, u256),
        element3: (ByteArray, bool)
    );

    // DOESNT WORK
    fn emit_event_with_enum(ref self: TContractState, element1: u256, element2: SampleEnum);

    // DOESNT WORK
    fn emit_event_with_nested_enum(
        ref self: TContractState, element1: u256, element2: SampleNestedEnum
    );


    fn emit_event_with_two_keys(ref self: TContractState, element1: u256, element2: felt252);

    // DOESNT WORK
    // args only show SampleNestedStruct.element1 but no SampleNestedStruct.element2
    // outer_element2 is show but incorrect
    fn emit_event_with_nested_struct(
        ref self: TContractState, element1: SampleNestedStruct, element2: u256
    );

    // DOESNT WORK
    fn emit_event_with_layer2_nested_struct(
        ref self: TContractState, element1: Layer2NestedStruct, element2: u256
    );

    // DOESNT WORK
    fn emit_event_with_layer3_nested_struct(
        ref self: TContractState, element1: Layer3NestedStruct, element2: u256
    );

    // UI BREAKs
    // TypeError: Cannot read properties of undefined (reading 'forEach')
    // Source
    // hooks/scaffold-stark/useScaffoldEventHistory.ts (275:19) @ forEach
    fn emit_event_without_flat(ref self: TContractState, id: u32, name: felt252, age: u256);

    // DOESNT WORK, I SHOULD BE ABLE TO READ EVENTS BY contracts::events::UpdatedAge /
    // contracts::events::UpdatedName
    fn emit_event_with_flat(ref self: TContractState, id: u32, name: felt252, age: u256);
}

#[starknet::contract]
mod Events {
    use super::{
        ContractAddress, SampleNestedStruct, SampleEnum, SampleNestedEnum, Layer2NestedStruct,
        Layer3NestedStruct, IEvents, SimpleEvent, EventWithSimpleTypes, EventWithComplexTypes,
        EventWithEnum, EventWithNestedEnum, EventWithTwoKeys, EventWithTuple, EventWithNestedStruct,
        EventWithLayer2NestedStruct, EventWithLayer3NestedStruct, EventWithoutFlat, EventFlat,
        UpdatedName, UpdatedAge,
    };


    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        SimpleEvent: SimpleEvent,
        EventWithSimpleTypes: EventWithSimpleTypes,
        EventWithComplexTypes: EventWithComplexTypes,
        EventWithTuple: EventWithTuple,
        EventWithEnum: EventWithEnum,
        EventWithNestedEnum: EventWithNestedEnum,
        EventWithTwoKeys: EventWithTwoKeys,
        EventWithNestedStruct: EventWithNestedStruct,
        EventWithLayer2NestedStruct: EventWithLayer2NestedStruct,
        EventWithLayer3NestedStruct: EventWithLayer3NestedStruct,
        #[flat]
        EventFlat: EventFlat,
        EventWithoutFlat: EventWithoutFlat,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl EventsImpl of IEvents<ContractState> {
        fn emit_simple_event(ref self: ContractState, id: u256, name: ByteArray) {
            self.emit(SimpleEvent { id, name });
        }

        fn emit_event_with_simple_types(
            ref self: ContractState,
            element1: u256,
            element2: felt252,
            element3: bool,
            element4: i128
        ) {
            self.emit(EventWithSimpleTypes { element1, element2, element3, element4 });
        }

        fn emit_event_with_complex_types(
            ref self: ContractState,
            element1: ContractAddress,
            element2: ByteArray,
            element3: Array<u256>
        ) {
            self.emit(EventWithComplexTypes { element1, element2, element3 });
        }

        fn emit_event_with_tuple(
            ref self: ContractState,
            element1: (ContractAddress, felt252),
            element2: (felt252, u256),
            element3: (ByteArray, bool)
        ) {
            self.emit(EventWithTuple { element1, element2, element3 });
        }

        fn emit_event_with_enum(ref self: ContractState, element1: u256, element2: SampleEnum) {
            self.emit(EventWithEnum { element1, element2 });
        }

        fn emit_event_with_nested_enum(
            ref self: ContractState, element1: u256, element2: SampleNestedEnum
        ) {
            self.emit(EventWithNestedEnum { element1, element2 });
        }

        fn emit_event_with_two_keys(ref self: ContractState, element1: u256, element2: felt252) {
            self.emit(EventWithTwoKeys { element1, element2 });
        }

        fn emit_event_with_nested_struct(
            ref self: ContractState, element1: SampleNestedStruct, element2: u256
        ) {
            self.emit(EventWithNestedStruct { outer_element1: element1, outer_element2: element2 });
        }

        fn emit_event_with_layer2_nested_struct(
            ref self: ContractState, element1: Layer2NestedStruct, element2: u256
        ) {
            self
                .emit(
                    EventWithLayer2NestedStruct {
                        outer_element1: element1, outer_element2: element2
                    }
                );
        }

        fn emit_event_with_layer3_nested_struct(
            ref self: ContractState, element1: Layer3NestedStruct, element2: u256
        ) {
            self
                .emit(
                    EventWithLayer3NestedStruct {
                        outer_element1: element1, outer_element2: element2
                    }
                );
        }

        fn emit_event_with_flat(ref self: ContractState, id: u32, name: felt252, age: u256) {
            if id == 0 {
                self.emit(EventFlat::Element1(UpdatedName { id, name }));
            } else {
                self.emit(EventFlat::Element2(UpdatedAge { id, age }));
            }
        }

        fn emit_event_without_flat(ref self: ContractState, id: u32, name: felt252, age: u256) {
            if id == 0 {
                self.emit(EventWithoutFlat::Element1(UpdatedName { id, name }));
            } else {
                self.emit(EventWithoutFlat::Element2(UpdatedAge { id, age }));
            }
        }
    }
}
