import { Account, RawArgs, RpcProvider, UniversalDetails } from "starknet";

export type Networks = Record<"devnet" | "sepolia" | "mainnet", Network>;

export type Network = {
  provider: RpcProvider;
  deployer: Account;
};

export type DeployContractParams = {
  contractName: string,
  exportContractName?: string,
  constructorArgs?: RawArgs,
  options?: UniversalDetails
}
