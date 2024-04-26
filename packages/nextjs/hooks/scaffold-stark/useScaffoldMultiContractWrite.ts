import { useTargetNetwork } from "./useTargetNetwork";
// import {useTransactor,} from "~~/hooks/scaffold-stark";
import {
  Contract,
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import { useContractWrite } from "@starknet-react/core";
import { Call, InvocationsDetails } from "starknet";

export const useScaffoldMultiContractWrite = <
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >,
>({
  calls,
  options,
}: {
  calls: Array<UseScaffoldWriteConfig<TContractName, TFunctionName>>;
  options?: InvocationsDetails;
}) => {
  const { targetNetwork } = useTargetNetwork();

  const uniqueContracts = calls.reduce(
    (acc, { contractName }) => {
      if (!acc[contractName]) {
        acc[contractName] = contracts?.[targetNetwork.network][
          contractName
        ] as Contract<TContractName>;
      }
      return acc;
    },
    {} as Record<TContractName, Contract<TContractName>>
  );

  return useContractWrite({
    calls: calls.map(
      (call) =>
        ({
          calldata: call.args,
          contractAddress: uniqueContracts[call.contractName]?.address,
          entrypoint: call.functionName,
        }) as Call
    ),
    options,
  });
};
