/**
 * This file is autogenerated by Scaffold-Stark.
 * You should not edit it manually or your changes might be overwritten.
 */

const deployedContracts = {
  devnet: {
    HelloStarknet: {
      address:
        "0x023092d7094ddfdd0a4e1178cb69a5e2e7d7e4c59f49dcf6c5562f8c53ab7c7d",
      abi: [
        {
          type: "impl",
          name: "HelloStarknetImpl",
          interface_name: "contracts::HelloStarknet::IHelloStarknet",
        },
        {
          type: "interface",
          name: "contracts::HelloStarknet::IHelloStarknet",
          items: [
            {
              type: "function",
              name: "increase_balance",
              inputs: [
                {
                  name: "amount",
                  type: "core::integer::u32",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "get_balance",
              inputs: [],
              outputs: [
                {
                  type: "core::integer::u32",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "get_balance_and_balance",
              inputs: [],
              outputs: [
                {
                  type: "(core::integer::u32, core::integer::u32)",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "get_caller_and_get_contract",
              inputs: [],
              outputs: [
                {
                  type: "(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)",
                },
              ],
              state_mutability: "view",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::HelloStarknet::HelloStarknet::BalanceIncreased",
          kind: "struct",
          members: [
            {
              name: "prev_balance",
              type: "core::integer::u32",
              kind: "key",
            },
            {
              name: "new_balance",
              type: "core::integer::u32",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::HelloStarknet::HelloStarknet::Event",
          kind: "enum",
          variants: [
            {
              name: "BalanceIncreased",
              type: "contracts::HelloStarknet::HelloStarknet::BalanceIncreased",
              kind: "nested",
            },
          ],
        },
      ],
    },
  },
} as const;

export default deployedContracts;
