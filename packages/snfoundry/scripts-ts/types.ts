import { Account, RawArgs, RpcProvider, UniversalDetails } from "starknet";

export type Networks = Record<"devnet" | "sepolia" | "mainnet", Network>;

export type Network = {
  provider: RpcProvider;
  deployer: Account;
  feeToken: { name: string; address: string }[];
};

export type DeployContractParams = {
  contract: string;
  contractName?: string;
  constructorArgs?: RawArgs;
  options?: UniversalDetails;
};
