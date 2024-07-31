import { Account, RawArgs, RpcProvider, UniversalDetails } from "starknet";

export type Networks = Record<"devnet" | "sepolia" | "mainnet", Network>;

export type Network = {
  provider: RpcProvider;
  deployer: Account;
};

export type DeployContractParams = {
  contract: string;
  contractName?: string;
  constructorArgs?: RawArgs;
  options?: UniversalDetails;
};
