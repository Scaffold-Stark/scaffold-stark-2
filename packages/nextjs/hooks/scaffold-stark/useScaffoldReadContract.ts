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
 * Reads data from a contract by calling a read-only method.
 *
 * @param config - Configuration object for the hook
 * @param config.contractName - The deployed contract name
 * @param config.methodName - The contract method to call
 * @param config.args - Arguments for the method call
 * @param config.enabled - If false, disables the hook (default: true)
 * @returns {Object} An object containing:
 *   - data: The result of the contract call
 *   - isLoading: Boolean indicating if the call is in progress
 *   - error: Any error encountered
 *
 * @see https://scaffoldstark.com/docs/hooks/
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
