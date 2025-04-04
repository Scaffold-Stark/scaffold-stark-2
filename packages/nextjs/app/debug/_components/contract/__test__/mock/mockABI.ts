export const abi: any = [
  {
    type: "impl",
    name: "YourContractImpl",
    interface_name: "contracts::YourContract::IYourContract",
  },
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      {
        name: "data",
        type: "core::array::Array::<core::bytes_31::bytes31>",
      },
      {
        name: "pending_word",
        type: "core::felt252",
      },
      {
        name: "pending_word_len",
        type: "core::integer::u32",
      },
    ],
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      {
        name: "low",
        type: "core::integer::u128",
      },
      {
        name: "high",
        type: "core::integer::u128",
      },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      {
        name: "False",
        type: "()",
      },
      {
        name: "True",
        type: "()",
      },
    ],
  },
  {
    type: "enum",
    name: "contracts::YourContract::SimpleEnum",
    variants: [
      {
        name: "val1",
        type: "core::integer::u128",
      },
      {
        name: "val2",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "enum",
    name: "contracts::YourContract::SomeEnum",
    variants: [
      {
        name: "val1",
        type: "contracts::YourContract::SimpleEnum",
      },
      {
        name: "val2",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "val3",
        type: "(core::integer::u128, core::integer::u256)",
      },
    ],
  },
  {
    type: "struct",
    name: "contracts::YourContract::SomeStruct",
    members: [
      {
        name: "addr",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "val",
        type: "core::integer::u128",
      },
    ],
  },
  {
    type: "enum",
    name: "contracts::YourContract::ComplexStruct",
    variants: [
      {
        name: "val1",
        type: "core::integer::u128",
      },
      {
        name: "val2",
        type: "core::array::Array::<(core::integer::u256, core::starknet::contract_address::ContractAddress)>",
      },
      {
        name: "val3",
        type: "core::array::Array::<contracts::YourContract::SomeStruct>",
      },
    ],
  },
  {
    type: "interface",
    name: "contracts::YourContract::IYourContract",
    items: [
      {
        type: "function",
        name: "greeting",
        inputs: [],
        outputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "set_greeting",
        inputs: [
          {
            name: "new_greeting",
            type: "core::byte_array::ByteArray",
          },
          {
            name: "amount_eth",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "withdraw",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "premium",
        inputs: [],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_enum",
        inputs: [
          {
            name: "input",
            type: "contracts::YourContract::SomeEnum",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::SomeEnum",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_i16",
        inputs: [
          {
            name: "input",
            type: "core::integer::i16",
          },
        ],
        outputs: [
          {
            type: "core::integer::i16",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_struct",
        inputs: [
          {
            name: "input",
            type: "contracts::YourContract::SomeStruct",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::SomeStruct",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_array",
        inputs: [
          {
            name: "input",
            type: "core::array::Array::<core::felt252>",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<core::felt252>",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_simple_tuple",
        inputs: [
          {
            name: "input",
            type: "(core::integer::u128, core::integer::u128)",
          },
        ],
        outputs: [
          {
            type: "(core::integer::u128, core::integer::u128)",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_u8",
        inputs: [
          {
            name: "input",
            type: "core::integer::u8",
          },
        ],
        outputs: [
          {
            type: "core::integer::u8",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_complex_struct",
        inputs: [
          {
            name: "input",
            type: "contracts::YourContract::ComplexStruct",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::ComplexStruct",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_address",
        inputs: [
          {
            name: "input",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_bool",
        inputs: [
          {
            name: "input",
            type: "core::bool",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "echo_str",
        inputs: [
          {
            name: "input",
            type: "core::byte_array::ByteArray",
          },
        ],
        outputs: [
          {
            type: "core::byte_array::ByteArray",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "reply_complex_struct",
        inputs: [
          {
            name: "input",
            type: "core::integer::u8",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::ComplexStruct",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "transaction_state",
        inputs: [
          {
            name: "transaction_id",
            type: "core::integer::u256",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::TransactionState",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "OwnableImpl",
    interface_name: "openzeppelin_access::ownable::interface::IOwnable",
  },
  {
    type: "interface",
    name: "openzeppelin_access::ownable::interface::IOwnable",
    items: [
      {
        type: "function",
        name: "owner",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "transfer_ownership",
        inputs: [
          {
            name: "new_owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "renounce_ownership",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
    kind: "struct",
    members: [
      {
        name: "previous_owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
    kind: "struct",
    members: [
      {
        name: "previous_owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
    ],
  },
  {
    type: "event",
    name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
    kind: "enum",
    variants: [
      {
        name: "OwnershipTransferred",
        type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
        kind: "nested",
      },
      {
        name: "OwnershipTransferStarted",
        type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "contracts::YourContract::YourContract::GreetingChanged",
    kind: "struct",
    members: [
      {
        name: "greeting_setter",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      {
        name: "new_greeting",
        type: "core::byte_array::ByteArray",
        kind: "key",
      },
      {
        name: "premium",
        type: "core::bool",
        kind: "data",
      },
      {
        name: "value",
        type: "core::integer::u256",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "contracts::YourContract::YourContract::Event",
    kind: "enum",
    variants: [
      {
        name: "OwnableEvent",
        type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
        kind: "flat",
      },
      {
        name: "GreetingChanged",
        type: "contracts::YourContract::YourContract::GreetingChanged",
        kind: "nested",
      },
    ],
  },
  {
    type: "enum",
    name: "core::option::Option::<core::integer::u256>",
    variants: [
      {
        name: "Some",
        type: "core::integer::u256",
      },
      {
        name: "None",
        type: "()",
      },
    ],
  },
  {
    type: "enum",
    name: "core::result::Result::<core::bool, core::integer::u64>",
    variants: [
      {
        name: "Ok",
        type: "core::bool",
      },
      {
        name: "Err",
        type: "core::integer::u64",
      },
    ],
  },
  {
    type: "enum",
    name: "contracts::YourContract::TransactionState",
    variants: [
      {
        name: "NotFound",
        type: "()",
      },
    ],
  },
];
