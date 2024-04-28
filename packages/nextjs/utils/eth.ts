const ethAbi = [
  {
    type: "struct",
    name: "Uint256",
    size: 2,
    members: [
      { name: "low", type: "felt", offset: 0 },
      { name: "high", type: "felt", offset: 1 },
    ],
  },
  {
    type: "event",
    name: "Transfer",
    keys: [],
    data: [
      { name: "from_", type: "felt" },
      { name: "to", type: "felt" },
      { name: "value", type: "Uint256" },
    ],
  },
  {
    type: "event",
    name: "Approval",
    keys: [],
    data: [
      { name: "owner", type: "felt" },
      { name: "spender", type: "felt" },
      { name: "value", type: "Uint256" },
    ],
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    keys: [],
    data: [
      { name: "previousOwner", type: "felt" },
      { name: "newOwner", type: "felt" },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      { name: "name", type: "felt" },
      { name: "symbol", type: "felt" },
      {
        name: "decimals",
        type: "felt",
      },
      { name: "initial_supply", type: "Uint256" },
      { name: "recipient", type: "felt" },
      {
        name: "owner",
        type: "felt",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "name", type: "felt" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "symbol", type: "felt" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "totalSupply", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "decimals", type: "felt" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "felt" }],
    outputs: [{ name: "balance", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "felt" },
      { name: "spender", type: "felt" },
    ],
    outputs: [{ name: "remaining", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "owner", type: "felt" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "recipient", type: "felt" },
      { name: "amount", type: "Uint256" },
    ],
    outputs: [{ name: "success", type: "felt" }],
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "sender", type: "felt" },
      { name: "recipient", type: "felt" },
      {
        name: "amount",
        type: "Uint256",
      },
    ],
    outputs: [{ name: "success", type: "felt" }],
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "felt" },
      { name: "amount", type: "Uint256" },
    ],
    outputs: [{ name: "success", type: "felt" }],
  },
  {
    type: "function",
    name: "increaseAllowance",
    inputs: [
      { name: "spender", type: "felt" },
      { name: "added_value", type: "Uint256" },
    ],
    outputs: [{ name: "success", type: "felt" }],
  },
  {
    type: "function",
    name: "decreaseAllowance",
    inputs: [
      { name: "spender", type: "felt" },
      { name: "subtracted_value", type: "Uint256" },
    ],
    outputs: [{ name: "success", type: "felt" }],
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "felt" },
      { name: "amount", type: "Uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "felt" }],
    outputs: [],
  },
  { type: "function", name: "renounceOwnership", inputs: [], outputs: [] },
];

export const ethContractAddress =
  "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7";

export const ethDecimals = BigInt("1000000000000000000");

export default ethAbi;
