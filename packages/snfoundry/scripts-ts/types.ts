import { Account, RpcProvider } from "starknet";

export type Networks = Record<
  "devnet" | "sepolia" | "mainnet",
  Network
>;

export type Network = {
  provider: RpcProvider;
  deployer: Account;
};
