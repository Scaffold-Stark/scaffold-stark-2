import { useContractRead } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import {
  AbiFunctionOutputs,
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldReadConfig,
} from "~~/utils/scaffold-stark/contract";

export const useScaffoldReadContract = <
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
}: UseScaffoldReadConfig<TContractName, TFunctionName>) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  return useContractRead({
    functionName,
    address: deployedContract?.address,
    abi: deployedContract?.abi,
    watch: true,
    args: args ?? [],
    enabled: true,
    blockIdentifier: "pending" as BlockNumber,
    ...(readConfig as any),
  }) as Omit<ReturnType<typeof useContractRead>, "data"> & {
    data: AbiFunctionOutputs<ContractAbi, TFunctionName> | undefined;
  };
};
