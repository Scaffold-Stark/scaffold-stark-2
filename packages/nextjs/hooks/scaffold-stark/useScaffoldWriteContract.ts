import { useCallback } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import {
  useDeployedContractInfo,
  useTransactor,
} from "~~/hooks/scaffold-stark";
import {
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import { useSendTransaction, useNetwork, Abi } from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";
import { Contract as StarknetJsContract } from "starknet";

export const useScaffoldWriteContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >,
>({
  contractName,
  functionName,
  args,
}: UseScaffoldWriteConfig<TAbi, TContractName, TFunctionName>) => {
  const { data: deployedContractData } = useDeployedContractInfo(contractName);
  const { chain } = useNetwork();
  const { writeTransaction: sendTxnWrapper, sendTransactionInstance } =
    useTransactor();
  const { targetNetwork } = useTargetNetwork();

  const sendContractWriteTx = useCallback(
    async (params?: {
      args?: UseScaffoldWriteConfig<TAbi, TContractName, TFunctionName>["args"];
    }) => {
      // if no args supplied, use the one supplied from hook
      let newArgs = params?.args;
      if (Object.keys(newArgs || {}).length <= 0) {
        newArgs = args;
      }

      if (!deployedContractData) {
        console.error(
          "Target Contract is not deployed, did you forget to run `yarn deploy`?",
        );
        return;
      }
      if (!chain?.id) {
        console.error("Please connect your wallet");
        return;
      }
      if (chain?.id !== targetNetwork.id) {
        console.error("You are on the wrong network");
        return;
      }

      // we convert to starknetjs contract instance here since deployed data may be undefined if contract is not deployed
      const contractInstance = new StarknetJsContract(
        deployedContractData.abi,
        deployedContractData.address,
      );

      const newCalls = deployedContractData
        ? [contractInstance.populate(functionName, newArgs as any[])]
        : [];

      try {
        return await sendTxnWrapper(newCalls as any[]);
      } catch (e: any) {
        throw e;
      }
    },
    [
      args,
      chain?.id,
      deployedContractData,
      functionName,
      sendTransactionInstance,
      sendTxnWrapper,
      targetNetwork.id,
    ],
  );

  return {
    ...sendTransactionInstance,
    sendAsync: sendContractWriteTx,
  };
};
