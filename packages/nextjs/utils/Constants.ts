// Strk
const universalStrkAddress =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const;

const sepoliaMainnetStrkClassHash =
  "0x04ad3c1dc8413453db314497945b6903e1c766495a1e60492d44da9c2a986e4b" as const;

const devnetStrkClassHash =
  "0x046ded64ae2dead6448e247234bab192a9c483644395b66f2155f2614e5804b0" as const;

const strkAbi = [
  {
    type: "impl",
    name: "LockingContract",
    interface_name: "src::mintable_lock_interface::ILockingContract",
  },
  {
    type: "interface",
    name: "src::mintable_lock_interface::ILockingContract",
    items: [
      {
        type: "function",
        name: "set_locking_contract",
        inputs: [
          {
            name: "locking_contract",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_locking_contract",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "impl",
    name: "LockAndDelegate",
    interface_name: "src::mintable_lock_interface::ILockAndDelegate",
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
    name: "src::mintable_lock_interface::ILockAndDelegate",
    items: [
      {
        type: "function",
        name: "lock_and_delegate",
        inputs: [
          {
            name: "delegatee",
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
      {
        type: "function",
        name: "lock_and_delegate_by_sig",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "delegatee",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "amount",
            type: "core::integer::u256",
          },
          {
            name: "nonce",
            type: "core::felt252",
          },
          {
            name: "expiry",
            type: "core::integer::u64",
          },
          {
            name: "signature",
            type: "core::array::Array::<core::felt252>",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "impl",
    name: "MintableToken",
    interface_name: "src::mintable_token_interface::IMintableToken",
  },
  {
    type: "interface",
    name: "src::mintable_token_interface::IMintableToken",
    items: [
      {
        type: "function",
        name: "permissioned_mint",
        inputs: [
          {
            name: "account",
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
      {
        type: "function",
        name: "permissioned_burn",
        inputs: [
          {
            name: "account",
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
    name: "MintableTokenCamelImpl",
    interface_name: "src::mintable_token_interface::IMintableTokenCamel",
  },
  {
    type: "interface",
    name: "src::mintable_token_interface::IMintableTokenCamel",
    items: [
      {
        type: "function",
        name: "permissionedMint",
        inputs: [
          {
            name: "account",
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
      {
        type: "function",
        name: "permissionedBurn",
        inputs: [
          {
            name: "account",
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
    name: "Replaceable",
    interface_name: "src::replaceability_interface::IReplaceable",
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
    name: "src::replaceability_interface::EICData",
    members: [
      {
        name: "eic_hash",
        type: "core::starknet::class_hash::ClassHash",
      },
      {
        name: "eic_init_data",
        type: "core::array::Span::<core::felt252>",
      },
    ],
  },
  {
    type: "enum",
    name: "core::option::Option::<src::replaceability_interface::EICData>",
    variants: [
      {
        name: "Some",
        type: "src::replaceability_interface::EICData",
      },
      {
        name: "None",
        type: "()",
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
    type: "struct",
    name: "src::replaceability_interface::ImplementationData",
    members: [
      {
        name: "impl_hash",
        type: "core::starknet::class_hash::ClassHash",
      },
      {
        name: "eic_data",
        type: "core::option::Option::<src::replaceability_interface::EICData>",
      },
      {
        name: "final",
        type: "core::bool",
      },
    ],
  },
  {
    type: "interface",
    name: "src::replaceability_interface::IReplaceable",
    items: [
      {
        type: "function",
        name: "get_upgrade_delay",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u64",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_impl_activation_time",
        inputs: [
          {
            name: "implementation_data",
            type: "src::replaceability_interface::ImplementationData",
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
        name: "add_new_implementation",
        inputs: [
          {
            name: "implementation_data",
            type: "src::replaceability_interface::ImplementationData",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "remove_implementation",
        inputs: [
          {
            name: "implementation_data",
            type: "src::replaceability_interface::ImplementationData",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "replace_to",
        inputs: [
          {
            name: "implementation_data",
            type: "src::replaceability_interface::ImplementationData",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "impl",
    name: "AccessControlImplExternal",
    interface_name: "src::access_control_interface::IAccessControl",
  },
  {
    type: "interface",
    name: "src::access_control_interface::IAccessControl",
    items: [
      {
        type: "function",
        name: "has_role",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
          },
          {
            name: "account",
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
        name: "get_role_admin",
        inputs: [
          {
            name: "role",
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
    ],
  },
  {
    type: "impl",
    name: "RolesImpl",
    interface_name: "src::roles_interface::IMinimalRoles",
  },
  {
    type: "interface",
    name: "src::roles_interface::IMinimalRoles",
    items: [
      {
        type: "function",
        name: "is_governance_admin",
        inputs: [
          {
            name: "account",
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
        name: "is_upgrade_governor",
        inputs: [
          {
            name: "account",
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
        name: "register_governance_admin",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "remove_governance_admin",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "register_upgrade_governor",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "remove_upgrade_governor",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "renounce",
        inputs: [
          {
            name: "role",
            type: "core::felt252",
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
    type: "interface",
    name: "openzeppelin::token::erc20::interface::IERC20",
    items: [
      {
        type: "function",
        name: "name",
        inputs: [],
        outputs: [
          {
            type: "core::felt252",
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
            type: "core::felt252",
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
    name: "ERC20CamelOnlyImpl",
    interface_name: "openzeppelin::token::erc20::interface::IERC20CamelOnly",
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
        name: "name",
        type: "core::felt252",
      },
      {
        name: "symbol",
        type: "core::felt252",
      },
      {
        name: "decimals",
        type: "core::integer::u8",
      },
      {
        name: "initial_supply",
        type: "core::integer::u256",
      },
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "permitted_minter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "provisional_governance_admin",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "upgrade_delay",
        type: "core::integer::u64",
      },
    ],
  },
  {
    type: "function",
    name: "increase_allowance",
    inputs: [
      {
        name: "spender",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "added_value",
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
    name: "decrease_allowance",
    inputs: [
      {
        name: "spender",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "subtracted_value",
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
    name: "increaseAllowance",
    inputs: [
      {
        name: "spender",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "addedValue",
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
    name: "decreaseAllowance",
    inputs: [
      {
        name: "spender",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "subtractedValue",
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
    type: "event",
    name: "src::strk::erc20_lockable::ERC20Lockable::Transfer",
    kind: "struct",
    members: [
      {
        name: "from",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "to",
        type: "core::starknet::contract_address::ContractAddress",
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
    name: "src::strk::erc20_lockable::ERC20Lockable::Approval",
    kind: "struct",
    members: [
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "spender",
        type: "core::starknet::contract_address::ContractAddress",
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
    name: "src::replaceability_interface::ImplementationAdded",
    kind: "struct",
    members: [
      {
        name: "implementation_data",
        type: "src::replaceability_interface::ImplementationData",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::replaceability_interface::ImplementationRemoved",
    kind: "struct",
    members: [
      {
        name: "implementation_data",
        type: "src::replaceability_interface::ImplementationData",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::replaceability_interface::ImplementationReplaced",
    kind: "struct",
    members: [
      {
        name: "implementation_data",
        type: "src::replaceability_interface::ImplementationData",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::replaceability_interface::ImplementationFinalized",
    kind: "struct",
    members: [
      {
        name: "impl_hash",
        type: "core::starknet::class_hash::ClassHash",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::access_control_interface::RoleGranted",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::access_control_interface::RoleRevoked",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "sender",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::access_control_interface::RoleAdminChanged",
    kind: "struct",
    members: [
      {
        name: "role",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "previous_admin_role",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "new_admin_role",
        type: "core::felt252",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::roles_interface::GovernanceAdminAdded",
    kind: "struct",
    members: [
      {
        name: "added_account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "added_by",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::roles_interface::GovernanceAdminRemoved",
    kind: "struct",
    members: [
      {
        name: "removed_account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "removed_by",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::roles_interface::UpgradeGovernorAdded",
    kind: "struct",
    members: [
      {
        name: "added_account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "added_by",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::roles_interface::UpgradeGovernorRemoved",
    kind: "struct",
    members: [
      {
        name: "removed_account",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "removed_by",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "src::strk::erc20_lockable::ERC20Lockable::Event",
    kind: "enum",
    variants: [
      {
        name: "Transfer",
        type: "src::strk::erc20_lockable::ERC20Lockable::Transfer",
        kind: "nested",
      },
      {
        name: "Approval",
        type: "src::strk::erc20_lockable::ERC20Lockable::Approval",
        kind: "nested",
      },
      {
        name: "ImplementationAdded",
        type: "src::replaceability_interface::ImplementationAdded",
        kind: "nested",
      },
      {
        name: "ImplementationRemoved",
        type: "src::replaceability_interface::ImplementationRemoved",
        kind: "nested",
      },
      {
        name: "ImplementationReplaced",
        type: "src::replaceability_interface::ImplementationReplaced",
        kind: "nested",
      },
      {
        name: "ImplementationFinalized",
        type: "src::replaceability_interface::ImplementationFinalized",
        kind: "nested",
      },
      {
        name: "RoleGranted",
        type: "src::access_control_interface::RoleGranted",
        kind: "nested",
      },
      {
        name: "RoleRevoked",
        type: "src::access_control_interface::RoleRevoked",
        kind: "nested",
      },
      {
        name: "RoleAdminChanged",
        type: "src::access_control_interface::RoleAdminChanged",
        kind: "nested",
      },
      {
        name: "GovernanceAdminAdded",
        type: "src::roles_interface::GovernanceAdminAdded",
        kind: "nested",
      },
      {
        name: "GovernanceAdminRemoved",
        type: "src::roles_interface::GovernanceAdminRemoved",
        kind: "nested",
      },
      {
        name: "UpgradeGovernorAdded",
        type: "src::roles_interface::UpgradeGovernorAdded",
        kind: "nested",
      },
      {
        name: "UpgradeGovernorRemoved",
        type: "src::roles_interface::UpgradeGovernorRemoved",
        kind: "nested",
      },
    ],
  },
] as const;

export const LAST_CONNECTED_TIME_LOCALSTORAGE_KEY = "lastConnectedTime";

export {
  devnetStrkClassHash,
  universalStrkAddress,
  sepoliaMainnetStrkClassHash,
  strkAbi,
};
