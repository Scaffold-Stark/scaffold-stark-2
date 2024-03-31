import { Address } from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";
import deployedContractsData from "~~/contracts/deployedContracts";
// import externalContractsData from "~~/contracts/externalContracts";

import type { MergeDeepRecord } from "type-fest/source/merge-deep";
import { Abi } from "starknet";

type ConfiguredChainId =
  (typeof scaffoldConfig)["targetNetworks"][0]["network"];
export type InheritedFunctions = { readonly [key: string]: string };

type Contracts = ContractsDeclaration[ConfiguredChainId];
export type ContractName = keyof Contracts;
export type Contract<TContractName extends ContractName> =
  Contracts[TContractName];
type AddExternalFlag<T> = {
  [ChainId in keyof T]: {
    [ContractName in keyof T[ChainId]]: T[ChainId][ContractName] & {
      external?: true;
    };
  };
};
export enum ContractCodeStatus {
  "LOADING",
  "DEPLOYED",
  "NOT_FOUND",
}
export type GenericContractsDeclaration = {
  [network: string]: {
    [contractName: string]: GenericContract;
  };
};
export type GenericContract = {
  address: string;
};

// const deepMergeContracts = <
//   L extends Record<PropertyKey, any>,
//   E extends Record<PropertyKey, any>
// >(
//   local: L,
//   external: E
// ) => {
//   const result: Record<PropertyKey, any> = {};
//   const allKeys = Array.from(
//     new Set([...Object.keys(external), ...Object.keys(local)])
//   );
//   for (const key of allKeys) {
//     if (!external[key]) {
//       result[key] = local[key];
//       continue;
//     }
//     const amendedExternal = Object.fromEntries(
//       Object.entries(
//         external[key] as Record<string, Record<string, unknown>>
//       ).map(([contractName, declaration]) => [
//         contractName,
//         { ...declaration, external: true },
//       ])
//     );
//     result[key] = { ...local[key], ...amendedExternal };
//   }
//   return result as MergeDeepRecord<
//     AddExternalFlag<L>,
//     AddExternalFlag<E>,
//     { arrayMergeMode: "replace" }
//   >;
// };

const contractsData = deployedContractsData;

type IsContractDeclarationMissing<TYes, TNo> = typeof contractsData extends {
  [key in ConfiguredChainId]: any;
}
  ? TNo
  : TYes;

type ContractsDeclaration = IsContractDeclarationMissing<
  GenericContractsDeclaration,
  typeof contractsData
>;

export const contracts = contractsData as GenericContractsDeclaration | null;
