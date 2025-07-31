import { Abi, useReadContract } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import {
  AbiFunctionOutputs,
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig,
} from "~~/utils/scaffold-stark/contract";

/**
 * Provides a function to read (call view functions) from a contract.
 * This hook wraps starknet-react's useReadContract to provide a simplified interface
 * for reading data from deployed contracts, with automatic contract address and ABI resolution.
 *
 * @param config - Configuration object for the hook
 * @param {TContractName} config.contractName - The deployed contract name to read from
 * @param {TFunctionName} config.functionName - The contract method to call (must be a view function)
 * @param {any[]} [config.args] - Arguments for the method call
 * @param {boolean} [config.enabled] - If false, disables the read (default: true if all args are defined)
 * @param {Object} [config.readConfig] - Additional configuration options for useReadContract
 * @returns {Object} An object containing:
 *   - data: AbiFunctionOutputs<ContractAbi, TFunctionName> | undefined - The function output data
 *   - isLoading: boolean - Boolean indicating if the read is in progress
 *   - error: Error | null - Any error encountered during the read operation
 *   - refetch: () => void - Function to manually refetch the data
 *   - (All other properties from starknet-react's useReadContract)
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldReadContract}
 */

export const useScaffoldReadContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
>({
  contractName,
  functionName,
  args,
  ...readConfig
}: UseScaffoldReadConfig<TAbi, TContractName, TFunctionName>) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  return useReadContract({
    functionName,
    address: deployedContract?.address,
    abi: deployedContract?.abi,
    watch: true,
    args: args || [],
    enabled:
      args && (!Array.isArray(args) || !args.some((arg) => arg === undefined)),
    blockIdentifier: "pending" as BlockNumber,
    ...(readConfig as any),
  }) as Omit<ReturnType<typeof useReadContract>, "data"> & {
    data: AbiFunctionOutputs<ContractAbi, TFunctionName> | undefined;
  };
};
