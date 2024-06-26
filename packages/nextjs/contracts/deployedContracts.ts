/**
 * This file is autogenerated by Scaffold-Stark.
 * You should not edit it manually or your changes might be overwritten.
 */

const deployedContracts = {
  devnet: {
    MockUsdt: {
      address:
        "0x01771b88cbe334c52e0ab41d96e09f97690eff401c80a616d402df3000de317d",
      abi: [
        {
          type: "impl",
          name: "MockTokenImpl",
          interface_name: "contracts::MockUsdt::IMockToken",
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
          type: "interface",
          name: "contracts::MockUsdt::IMockToken",
          items: [
            {
              type: "function",
              name: "faucet",
              inputs: [
                {
                  name: "recipient",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
          ],
        },
        {
          type: "impl",
          name: "ERC20Impl",
          interface_name: "openzeppelin::token::erc20::interface::IERC20",
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
          name: "openzeppelin::token::erc20::interface::IERC20",
          items: [
            {
              type: "function",
              name: "total_supply",
              inputs: [],
              outputs: [
                {
                  type: "core::integer::u256",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "balance_of",
              inputs: [
                {
                  name: "account",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [
                {
                  type: "core::integer::u256",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "allowance",
              inputs: [
                {
                  name: "owner",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "spender",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [
                {
                  type: "core::integer::u256",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "transfer",
              inputs: [
                {
                  name: "recipient",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
                },
              ],
              outputs: [
                {
                  type: "core::bool",
                },
              ],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "transfer_from",
              inputs: [
                {
                  name: "sender",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "recipient",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
                },
              ],
              outputs: [
                {
                  type: "core::bool",
                },
              ],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "approve",
              inputs: [
                {
                  name: "spender",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
                },
              ],
              outputs: [
                {
                  type: "core::bool",
                },
              ],
              state_mutability: "external",
            },
          ],
        },
        {
          type: "impl",
          name: "ERC20MetadataImpl",
          interface_name:
            "openzeppelin::token::erc20::interface::IERC20Metadata",
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
          type: "interface",
          name: "openzeppelin::token::erc20::interface::IERC20Metadata",
          items: [
            {
              type: "function",
              name: "name",
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
              name: "symbol",
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
              name: "decimals",
              inputs: [],
              outputs: [
                {
                  type: "core::integer::u8",
                },
              ],
              state_mutability: "view",
            },
          ],
        },
        {
          type: "impl",
          name: "ERC20CamelOnlyImpl",
          interface_name:
            "openzeppelin::token::erc20::interface::IERC20CamelOnly",
        },
        {
          type: "interface",
          name: "openzeppelin::token::erc20::interface::IERC20CamelOnly",
          items: [
            {
              type: "function",
              name: "totalSupply",
              inputs: [],
              outputs: [
                {
                  type: "core::integer::u256",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "balanceOf",
              inputs: [
                {
                  name: "account",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [
                {
                  type: "core::integer::u256",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "transferFrom",
              inputs: [
                {
                  name: "sender",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "recipient",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
                },
              ],
              outputs: [
                {
                  type: "core::bool",
                },
              ],
              state_mutability: "external",
            },
          ],
        },
        {
          type: "constructor",
          name: "constructor",
          inputs: [
            {
              name: "recipient",
              type: "core::starknet::contract_address::ContractAddress",
            },
          ],
        },
        {
          type: "event",
          name: "openzeppelin::token::erc20::erc20::ERC20Component::Transfer",
          kind: "struct",
          members: [
            {
              name: "from",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
            {
              name: "to",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
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
          name: "openzeppelin::token::erc20::erc20::ERC20Component::Approval",
          kind: "struct",
          members: [
            {
              name: "owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
            {
              name: "spender",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
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
          name: "openzeppelin::token::erc20::erc20::ERC20Component::Event",
          kind: "enum",
          variants: [
            {
              name: "Transfer",
              type: "openzeppelin::token::erc20::erc20::ERC20Component::Transfer",
              kind: "nested",
            },
            {
              name: "Approval",
              type: "openzeppelin::token::erc20::erc20::ERC20Component::Approval",
              kind: "nested",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::MockUsdt::MockUsdt::Event",
          kind: "enum",
          variants: [
            {
              name: "ERC20Event",
              type: "openzeppelin::token::erc20::erc20::ERC20Component::Event",
              kind: "flat",
            },
          ],
        },
      ],
    },
    CrossFund: {
      address:
        "0x0226aaefe62ddb55569dd377c11f960c50672cfc6eaf65d5cf1c8efb236bc1f1",
      abi: [
        {
          type: "impl",
          name: "CrossFundImpl",
          interface_name: "contracts::CrossFund::ICrossFund",
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
          type: "struct",
          name: "core::starknet::eth_address::EthAddress",
          members: [
            {
              name: "address",
              type: "core::felt252",
            },
          ],
        },
        {
          type: "interface",
          name: "contracts::CrossFund::ICrossFund",
          items: [
            {
              type: "function",
              name: "withdraw",
              inputs: [
                {
                  name: "campaign_id",
                  type: "core::integer::u256",
                },
                {
                  name: "l1_beneficiary",
                  type: "core::starknet::eth_address::EthAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "deposit_to_strk_campaign",
              inputs: [
                {
                  name: "campaign_id",
                  type: "core::integer::u256",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "deposit_to_eth_campaign",
              inputs: [
                {
                  name: "campaign_id",
                  type: "core::integer::u256",
                },
                {
                  name: "amount",
                  type: "core::integer::u256",
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
          interface_name: "openzeppelin::access::ownable::interface::IOwnable",
        },
        {
          type: "interface",
          name: "openzeppelin::access::ownable::interface::IOwnable",
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
            {
              name: "base_token",
              type: "core::starknet::contract_address::ContractAddress",
            },
          ],
        },
        {
          type: "struct",
          name: "contracts::CrossFund::Message",
          members: [
            {
              name: "campaign_id",
              type: "core::felt252",
            },
            {
              name: "status",
              type: "core::felt252",
            },
            {
              name: "recipient",
              type: "core::felt252",
            },
          ],
        },
        {
          type: "l1_handler",
          name: "l1_message",
          inputs: [
            {
              name: "from_address",
              type: "core::felt252",
            },
            {
              name: "l1_message",
              type: "contracts::CrossFund::Message",
            },
          ],
          outputs: [],
          state_mutability: "external",
        },
        {
          type: "event",
          name: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferred",
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
          name: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
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
          name: "openzeppelin::access::ownable::ownable::OwnableComponent::Event",
          kind: "enum",
          variants: [
            {
              name: "OwnershipTransferred",
              type: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferred",
              kind: "nested",
            },
            {
              name: "OwnershipTransferStarted",
              type: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
              kind: "nested",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CrossFundAlt::CrossFundAltComponent::Event",
          kind: "enum",
          variants: [],
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
          type: "event",
          name: "contracts::CrossFundNative::CrossFundNativeComponent::CampaignCreated",
          kind: "struct",
          members: [
            {
              name: "campaign_id",
              type: "core::integer::u256",
              kind: "key",
            },
            {
              name: "owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "data",
            },
            {
              name: "target_amount",
              type: "core::integer::u256",
              kind: "data",
            },
            {
              name: "deadline",
              type: "core::integer::u256",
              kind: "data",
            },
            {
              name: "data_cid",
              type: "core::byte_array::ByteArray",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CrossFundNative::CrossFundNativeComponent::Event",
          kind: "enum",
          variants: [
            {
              name: "CampaignCreated",
              type: "contracts::CrossFundNative::CrossFundNativeComponent::CampaignCreated",
              kind: "nested",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CrossFund::CrossFund::StrkCampaignCreated",
          kind: "struct",
          members: [
            {
              name: "campaign_id",
              type: "core::integer::u256",
              kind: "key",
            },
            {
              name: "owner",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "data",
            },
            {
              name: "target_amount",
              type: "core::integer::u256",
              kind: "data",
            },
            {
              name: "deadline",
              type: "core::integer::u256",
              kind: "data",
            },
            {
              name: "data_cid",
              type: "core::byte_array::ByteArray",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CrossFund::CrossFund::Event",
          kind: "enum",
          variants: [
            {
              name: "OwnableEvent",
              type: "openzeppelin::access::ownable::ownable::OwnableComponent::Event",
              kind: "flat",
            },
            {
              name: "CrossFundMessengerEvent",
              type: "contracts::CrossFundAlt::CrossFundAltComponent::Event",
              kind: "flat",
            },
            {
              name: "CrossFundNativeEvent",
              type: "contracts::CrossFundNative::CrossFundNativeComponent::Event",
              kind: "flat",
            },
            {
              name: "StrkCampaignCreated",
              type: "contracts::CrossFund::CrossFund::StrkCampaignCreated",
              kind: "nested",
            },
          ],
        },
      ],
    },
  },
  sepolia: {
    YourContract: {
      address:
        "0x05b6e9079f21a750a4c2b872710c205f803ebb2a9b8b6fd80fb2bbc96371c552",
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
              name: "gretting",
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
              name: "set_gretting",
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
          ],
        },
        {
          type: "impl",
          name: "OwnableImpl",
          interface_name: "openzeppelin::access::ownable::interface::IOwnable",
        },
        {
          type: "interface",
          name: "openzeppelin::access::ownable::interface::IOwnable",
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
          name: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferred",
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
          name: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
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
          name: "openzeppelin::access::ownable::ownable::OwnableComponent::Event",
          kind: "enum",
          variants: [
            {
              name: "OwnershipTransferred",
              type: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferred",
              kind: "nested",
            },
            {
              name: "OwnershipTransferStarted",
              type: "openzeppelin::access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
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
              type: "openzeppelin::access::ownable::ownable::OwnableComponent::Event",
              kind: "flat",
            },
            {
              name: "GreetingChanged",
              type: "contracts::YourContract::YourContract::GreetingChanged",
              kind: "nested",
            },
          ],
        },
      ],
    },
  },
} as const;

export default deployedContracts;
