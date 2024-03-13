const { RpcProvider, Account } = require("starknet");
const dotenv = require("dotenv");
dotenv.config();

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
module.exports = {
  devnet: {
    provider: providerDevnet,
    deployer: deployerDevnet,
  },
};
