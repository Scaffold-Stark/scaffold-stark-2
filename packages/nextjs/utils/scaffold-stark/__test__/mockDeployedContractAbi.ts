export const mockDeployedContractAbi = {
  abi: [
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
      type: "enum",
      name: "core::option::Option::<core::starknet::contract_address::ContractAddress>",
      variants: [
        {
          name: "Some",
          type: "core::starknet::contract_address::ContractAddress",
        },
        {
          name: "None",
          type: "()",
        },
      ],
    },
    {
      type: "enum",
      name: "core::option::Option::<core::integer::u128>",
      variants: [
        {
          name: "Some",
          type: "core::integer::u128",
        },
        {
          name: "None",
          type: "()",
        },
      ],
    },
    {
      type: "struct",
      name: "contracts::YourContract::SomeStruct",
      members: [
        {
          name: "addr",
          type: "core::option::Option::<core::starknet::contract_address::ContractAddress>",
        },
        {
          name: "val",
          type: "core::option::Option::<core::integer::u128>",
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
          name: "send_events",
          inputs: [
            {
              name: "input",
              type: "core::integer::u8",
            },
          ],
          outputs: [],
          state_mutability: "external",
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
          name: "event_type",
          type: "core::integer::u256",
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
        {
          name: "addresses",
          type: "core::array::Array::<core::starknet::contract_address::ContractAddress>",
          kind: "key",
        },
        {
          name: "arr",
          type: "core::array::Array::<core::integer::u256>",
          kind: "data",
        },
        {
          name: "tup",
          type: "(core::integer::u32, core::integer::u64, core::bool, core::starknet::contract_address::ContractAddress)",
          kind: "key",
        },
        {
          name: "st",
          type: "contracts::YourContract::SomeStruct",
          kind: "key",
        },
        {
          name: "enum_val",
          type: "contracts::YourContract::SomeEnum",
          kind: "key",
        },
        {
          name: "bool_val",
          type: "core::bool",
          kind: "key",
        },
      ],
    },
    {
      type: "event",
      name: "contracts::YourContract::YourContract::EventPanic",
      kind: "struct",
      members: [
        {
          name: "error_type",
          type: "core::integer::u8",
          kind: "key",
        },
        {
          name: "setter",
          type: "core::starknet::contract_address::ContractAddress",
          kind: "key",
        },
        {
          name: "error_description",
          type: "core::felt252",
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
        {
          name: "EventPanic",
          type: "contracts::YourContract::YourContract::EventPanic",
          kind: "nested",
        },
      ],
    },
  ],
};
