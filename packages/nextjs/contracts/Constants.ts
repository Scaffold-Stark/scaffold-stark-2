const universalEthAddress =
  "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7" as const;

const universalStrkAddress =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const;

const universalClassHash =
  "0x046ded64ae2dead6448e247234bab192a9c483644395b66f2155f2614e5804b0" as const;

// devnet Eth class hash is not the same as the universal class hash
const devnetEthClassHash =
  "0x4ad3c1dc8413453db314497945b6903e1c766495a1e60492d44da9c2a986e4b" as const;

const universalAbi = [
  {
    type: "impl",
    name: "ERC20Impl",
    interface_name: "openzeppelin::token::erc20::interface::IERC20",
  },
  {
    name: "openzeppelin::token::erc20::interface::IERC20",
    type: "interface",
    items: [
      {
        name: "name",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::felt252",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "symbol",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::felt252",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "decimals",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u8",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "allowance",
        type: "function",
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
        name: "transfer",
        type: "function",
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
        name: "approve",
        type: "function",
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
    name: "ERC20CamelOnlyImpl",
    type: "impl",
    interface_name: "openzeppelin::token::erc20::interface::IERC20CamelOnly",
  },
  {
    type: "interface",
    name: "openzeppelin::token::erc20::interface::IERC20CamelOnly",
    items: [
      {
        name: "totalSupply",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "balanceOf",
        type: "function",
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
        name: "transferFrom",
        type: "function",
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
    kind: "struct",
    name: "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer",
    type: "event",
    members: [
      {
        kind: "data",
        name: "from",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "to",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "data",
        name: "value",
        type: "core::integer::u256",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin::token::erc20_v070::erc20::ERC20::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "Transfer",
        type: "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer",
      },
    ],
  },
] as const;

export {
  devnetEthClassHash,
  universalEthAddress,
  universalStrkAddress,
  universalClassHash,
  universalAbi,
};
