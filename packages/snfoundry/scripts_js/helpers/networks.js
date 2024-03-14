const { RpcProvider, Account } = require("starknet");
const dotenv = require("dotenv");
dotenv.config();

// devnet
const providerDevnet =
  process.env.RPC_URL_DEVNET &&
  new RpcProvider({
    nodeUrl: process.env.RPC_URL_DEVNET,
  });
const deployerDevnet =
  process.env.ACCOUNT_ADDRESS_DEVNET &&
  process.env.PRIVATE_KEY_DEVNET &&
  new Account(
    providerDevnet,
    process.env.ACCOUNT_ADDRESS_DEVNET,
    process.env.PRIVATE_KEY_DEVNET,
    1
  );
// goerli
const providerGoerli =
  process.env.RPC_URL_GOERLI &&
  new RpcProvider({
    nodeUrl: process.env.RPC_URL_GOERLI,
  });
const deployerGoerli =
  process.env.ACCOUNT_ADDRESS_GOERLI &&
  process.env.PRIVATE_KEY_GOERLI &&
  new Account(
    providerGoerli,
    process.env.ACCOUNT_ADDRESS_GOERLI,
    process.env.PRIVATE_KEY_GOERLI,
    1
  );

// sepolia
const providerSepolia =
  process.env.RPC_URL_SEPOLIA &&
  new RpcProvider({
    nodeUrl: process.env.RPC_URL_SEPOLIA,
  });
const deployerSepolia =
  process.env.ACCOUNT_ADDRESS_SEPOLIA &&
  process.env.PRIVATE_KEY_SEPOLIA &&
  new Account(
    providerSepolia,
    process.env.ACCOUNT_ADDRESS_SEPOLIA,
    process.env.PRIVATE_KEY_SEPOLIA,
    1
  );

// mainnet
const providerMainnet =
  process.env.RPC_URL_MAINNET &&
  new RpcProvider({
    nodeUrl: process.env.RPC_URL_MAINNET,
  });
const deployerMainnet =
  process.env.ACCOUNT_ADDRESS_MAINNET &&
  process.env.PRIVATE_KEY_MAINNET &&
  new Account(
    providerMainnet,
    process.env.ACCOUNT_ADDRESS_MAINNET,
    process.env.PRIVATE_KEY_MAINNET,
    1
  );

module.exports = {
  devnet: {
    provider: providerDevnet,
    deployer: deployerDevnet,
  },
  goerli: {
    provider: providerGoerli,
    deployer: deployerGoerli,
  },
  sepolia: {
    provider: providerSepolia,
    deployer: deployerSepolia,
  },
  mainnet: {
    provider: providerMainnet,
    deployer: deployerMainnet,
  },
};
