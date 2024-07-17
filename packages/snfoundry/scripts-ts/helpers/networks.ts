import { RpcProvider, Account } from "starknet";
import path from "path";
import dotenv from "dotenv";
import { Networks } from "../types";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// devnet
const PRIVATE_KEY_DEVNET =
  process.env.PRIVATE_KEY_DEVNET || "0x71d7bb07b9a64f6f78ac4c816aff4da9";
const RPC_URL_DEVNET = process.env.RPC_URL_DEVNET || "http://127.0.0.1:5050";
const ACCOUNT_ADDRESS_DEVNET =
  process.env.ACCOUNT_ADDRESS_DEVNET ||
  "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

const providerDevnet =
  RPC_URL_DEVNET && new RpcProvider({ nodeUrl: RPC_URL_DEVNET });
const deployerDevnet =
  ACCOUNT_ADDRESS_DEVNET &&
  PRIVATE_KEY_DEVNET &&
  new Account(providerDevnet, ACCOUNT_ADDRESS_DEVNET, PRIVATE_KEY_DEVNET, "1");

// sepolia
const providerSepolia =
  process.env.RPC_URL_SEPOLIA &&
  new RpcProvider({ nodeUrl: process.env.RPC_URL_SEPOLIA });
const deployerSepolia =
  process.env.ACCOUNT_ADDRESS_SEPOLIA &&
  process.env.PRIVATE_KEY_SEPOLIA &&
  new Account(
    providerSepolia,
    process.env.ACCOUNT_ADDRESS_SEPOLIA,
    process.env.PRIVATE_KEY_SEPOLIA,
    "1"
  );

// mainnet
const providerMainnet =
  process.env.RPC_URL_MAINNET &&
  new RpcProvider({ nodeUrl: process.env.RPC_URL_MAINNET });
const deployerMainnet =
  process.env.ACCOUNT_ADDRESS_MAINNET &&
  process.env.PRIVATE_KEY_MAINNET &&
  new Account(
    providerMainnet,
    process.env.ACCOUNT_ADDRESS_MAINNET,
    process.env.PRIVATE_KEY_MAINNET,
    "1"
  );

export const networks: Networks = {
  devnet: { provider: providerDevnet, deployer: deployerDevnet },
  sepolia: { provider: providerSepolia, deployer: deployerSepolia },
  mainnet: { provider: providerMainnet, deployer: deployerMainnet },
};
