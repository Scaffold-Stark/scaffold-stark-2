import { Account, RawArgs, RpcProvider, UniversalDetails } from "starknet";

export type Networks = Record<"devnet" | "sepolia" | "mainnet", Network>;

export type Network = {
  provider: RpcProvider;
  deployer: Account;
  feeToken: { name: string; address: string }[];
};

export interface DeployContractParams {
  contract: string;
  constructorArgs?: any;
  contractName?: string;
  options?: any;
}

export interface DeclareContractParams {
  contract: string;
  options?: any;
}
