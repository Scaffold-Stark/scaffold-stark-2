export const mockDeployedContractData = {
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
          name: "trigger_event",
          inputs: [],
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
      name: "contracts::YourContract::YourContract::EventParser",
      kind: "struct",
      members: [
        {
          name: "sender",
          type: "core::starknet::contract_address::ContractAddress",
          kind: "key",
        },
        {
          name: "message",
          type: "core::byte_array::ByteArray",
          kind: "key",
        },
        {
          name: "bool_val",
          type: "core::bool",
          kind: "data",
        },
        {
          name: "u256_val",
          type: "core::integer::u256",
          kind: "data",
        },
        {
          name: "tuple_val",
          type: "(core::integer::u8, core::integer::u16, core::integer::u32, core::integer::u64, core::integer::u128)",
          kind: "data",
        },
        {
          name: "arr_val",
          type: "core::array::Array::<core::integer::u128>",
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
          name: "EventParser",
          type: "contracts::YourContract::YourContract::EventParser",
          kind: "nested",
        },
      ],
    },
  ],
  address: "0x1234567890abcdef",
};
