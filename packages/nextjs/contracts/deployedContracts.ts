/**
 * This file is autogenerated by Scaffold-Stark.
 * You should not edit it manually or your changes might be overwritten.
 */

const deployedContracts = {
  devnet: {
    CustomMultisigWallet: {
      address:
        "0x7d83e54b2273110246143a41ee6233b64f8846231915454ece199c89f5d0128",
      abi: [
        {
          type: "impl",
          name: "MultisigWalletImpl",
          interface_name: "contracts::CustomMultisigWallet::IMultisigWallet",
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
          name: "contracts::CustomMultisigWallet::IMultisigWallet",
          items: [
            {
              type: "function",
              name: "transfer_funds",
              inputs: [
                {
                  name: "to",
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
          name: "MultisigImpl",
          interface_name:
            "contracts::CustomInterfaceMultisigComponent::IMultisig",
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
          name: "contracts::CustomInterfaceMultisigComponent::TransactionState",
          variants: [
            {
              name: "NotFound",
              type: "()",
            },
            {
              name: "Pending",
              type: "()",
            },
            {
              name: "Confirmed",
              type: "()",
            },
            {
              name: "Executed",
              type: "()",
            },
          ],
        },
        {
          type: "struct",
          name: "core::array::Span::<core::felt252>",
          members: [
            {
              name: "snapshot",
              type: "@core::array::Array::<core::felt252>",
            },
          ],
        },
        {
          type: "struct",
          name: "core::starknet::account::Call",
          members: [
            {
              name: "to",
              type: "core::starknet::contract_address::ContractAddress",
            },
            {
              name: "selector",
              type: "core::felt252",
            },
            {
              name: "calldata",
              type: "core::array::Span::<core::felt252>",
            },
          ],
        },
        {
          type: "interface",
          name: "contracts::CustomInterfaceMultisigComponent::IMultisig",
          items: [
            {
              type: "function",
              name: "get_quorum",
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
              name: "is_signer",
              inputs: [
                {
                  name: "signer",
                  type: "core::starknet::contract_address::ContractAddress",
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
              name: "get_signers",
              inputs: [],
              outputs: [
                {
                  type: "core::array::Array::<core::starknet::contract_address::ContractAddress>",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "is_confirmed",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
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
              name: "is_confirmed_by",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
                },
                {
                  name: "signer",
                  type: "core::starknet::contract_address::ContractAddress",
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
              name: "is_executed",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
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
              name: "get_submitted_block",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "core::integer::u64",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "get_transaction_state",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "contracts::CustomInterfaceMultisigComponent::TransactionState",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "get_transaction_confirmations",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "core::integer::u32",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "hash_transaction",
              inputs: [
                {
                  name: "to",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "selector",
                  type: "core::felt252",
                },
                {
                  name: "calldata",
                  type: "core::array::Array::<core::felt252>",
                },
                {
                  name: "salt",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "core::felt252",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "hash_transaction_batch",
              inputs: [
                {
                  name: "calls",
                  type: "core::array::Array::<core::starknet::account::Call>",
                },
                {
                  name: "salt",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "core::felt252",
                },
              ],
              state_mutability: "view",
            },
            {
              type: "function",
              name: "add_signer",
              inputs: [
                {
                  name: "new_quorum",
                  type: "core::integer::u32",
                },
                {
                  name: "signer_to_add",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "remove_signer",
              inputs: [
                {
                  name: "new_quorum",
                  type: "core::integer::u32",
                },
                {
                  name: "signer_to_remove",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "replace_signer",
              inputs: [
                {
                  name: "signer_to_remove",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "signer_to_add",
                  type: "core::starknet::contract_address::ContractAddress",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "change_quorum",
              inputs: [
                {
                  name: "new_quorum",
                  type: "core::integer::u32",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "submit_transaction",
              inputs: [
                {
                  name: "to",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "selector",
                  type: "core::felt252",
                },
                {
                  name: "calldata",
                  type: "core::array::Array::<core::felt252>",
                },
                {
                  name: "salt",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "core::felt252",
                },
              ],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "submit_transaction_batch",
              inputs: [
                {
                  name: "calls",
                  type: "core::array::Array::<core::starknet::account::Call>",
                },
                {
                  name: "salt",
                  type: "core::felt252",
                },
              ],
              outputs: [
                {
                  type: "core::felt252",
                },
              ],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "confirm_transaction",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "revoke_confirmation",
              inputs: [
                {
                  name: "id",
                  type: "core::felt252",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "execute_transaction",
              inputs: [
                {
                  name: "to",
                  type: "core::starknet::contract_address::ContractAddress",
                },
                {
                  name: "selector",
                  type: "core::felt252",
                },
                {
                  name: "calldata",
                  type: "core::array::Array::<core::felt252>",
                },
                {
                  name: "salt",
                  type: "core::felt252",
                },
              ],
              outputs: [],
              state_mutability: "external",
            },
            {
              type: "function",
              name: "execute_transaction_batch",
              inputs: [
                {
                  name: "calls",
                  type: "core::array::Array::<core::starknet::account::Call>",
                },
                {
                  name: "salt",
                  type: "core::felt252",
                },
              ],
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
              name: "quorum",
              type: "core::integer::u32",
            },
            {
              name: "signer",
              type: "core::starknet::contract_address::ContractAddress",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::SignerAdded",
          kind: "struct",
          members: [
            {
              name: "signer",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::SignerRemoved",
          kind: "struct",
          members: [
            {
              name: "signer",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::QuorumUpdated",
          kind: "struct",
          members: [
            {
              name: "old_quorum",
              type: "core::integer::u32",
              kind: "data",
            },
            {
              name: "new_quorum",
              type: "core::integer::u32",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::TransactionSubmitted",
          kind: "struct",
          members: [
            {
              name: "id",
              type: "core::felt252",
              kind: "key",
            },
            {
              name: "signer",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::TransactionConfirmed",
          kind: "struct",
          members: [
            {
              name: "id",
              type: "core::felt252",
              kind: "key",
            },
            {
              name: "signer",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::TransactionExecuted",
          kind: "struct",
          members: [
            {
              name: "id",
              type: "core::felt252",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::ConfirmationRevoked",
          kind: "struct",
          members: [
            {
              name: "id",
              type: "core::felt252",
              kind: "key",
            },
            {
              name: "signer",
              type: "core::starknet::contract_address::ContractAddress",
              kind: "key",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::CallSalt",
          kind: "struct",
          members: [
            {
              name: "id",
              type: "core::felt252",
              kind: "key",
            },
            {
              name: "salt",
              type: "core::felt252",
              kind: "data",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigComponent::MultisigComponent::Event",
          kind: "enum",
          variants: [
            {
              name: "SignerAdded",
              type: "contracts::CustomMultisigComponent::MultisigComponent::SignerAdded",
              kind: "nested",
            },
            {
              name: "SignerRemoved",
              type: "contracts::CustomMultisigComponent::MultisigComponent::SignerRemoved",
              kind: "nested",
            },
            {
              name: "QuorumUpdated",
              type: "contracts::CustomMultisigComponent::MultisigComponent::QuorumUpdated",
              kind: "nested",
            },
            {
              name: "TransactionSubmitted",
              type: "contracts::CustomMultisigComponent::MultisigComponent::TransactionSubmitted",
              kind: "nested",
            },
            {
              name: "TransactionConfirmed",
              type: "contracts::CustomMultisigComponent::MultisigComponent::TransactionConfirmed",
              kind: "nested",
            },
            {
              name: "TransactionExecuted",
              type: "contracts::CustomMultisigComponent::MultisigComponent::TransactionExecuted",
              kind: "nested",
            },
            {
              name: "ConfirmationRevoked",
              type: "contracts::CustomMultisigComponent::MultisigComponent::ConfirmationRevoked",
              kind: "nested",
            },
            {
              name: "CallSalt",
              type: "contracts::CustomMultisigComponent::MultisigComponent::CallSalt",
              kind: "nested",
            },
          ],
        },
        {
          type: "event",
          name: "contracts::CustomMultisigWallet::CustomMultisigWallet::Event",
          kind: "enum",
          variants: [
            {
              name: "MultisigEvent",
              type: "contracts::CustomMultisigComponent::MultisigComponent::Event",
              kind: "flat",
            },
          ],
        },
      ],
      classHash:
        "0x58af4ca6b37ba37c831a7e5b0373ce81c1ec910696cbe93cb51e837dd008f01",
    },
  },
} as const;

export default deployedContracts;
