import { useCallback, useEffect, useMemo } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import {
  useDeployedContractInfo,
  useTransactor,
} from "~~/hooks/scaffold-stark";
import {
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  getFunctionsByStateMutability,
  parseFunctionParams,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import {
  useSendTransaction,
  useNetwork,
  Abi,
  useContract,
} from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";
import { Contract as StarknetJsContract } from "starknet";

type UpdatedArgs = Parameters<
  ReturnType<typeof useSendTransaction>["sendAsync"]
>[0];

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
  const sendTxnWrapper = useTransactor();
  const { targetNetwork } = useTargetNetwork();

  const abiFunction = useMemo(
    () =>
      getFunctionsByStateMutability(
        deployedContractData?.abi || [],
        "external",
      ).find((fn) => fn.name === functionName),
    [deployedContractData?.abi, functionName],
  );

  // TODO: see if we need this bit later
  // const parsedParams = useMemo(() => {
  //   if (args && abiFunction && deployedContractData) {
  //     const parsed = parseFunctionParams({
  //       abiFunction,
  //       abi: deployedContractData.abi,
  //       inputs: args as any[],
  //       isRead: false,
  //       isReadArgsParsing: true,
  //     }).flat(Infinity);
  //     return parsed;
  //   }
  //   return [];
  // }, [args, abiFunction, deployedContractData]);

  // leave blank for now since default args will be called by the trigger function anyway
  const sendTransactionInstance = useSendTransaction({});

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

      // TODO: see if we need this back, keeping this here
      // let newParsedParams =
      //   newArgs && abiFunction && deployedContractData
      //     ? parseFunctionParams({
      //         abiFunction,
      //         abi: deployedContractData.abi,
      //         inputs: newArgs as any[],
      //         isRead: false,
      //         isReadArgsParsing: false,
      //       })
      //     : parsedParams;

      // we convert to starknetjs contract instance here since deployed data may be undefined if contract is not deployed
      const contractInstance = new StarknetJsContract(
        deployedContractData.abi,
        deployedContractData.address,
      );

      const newCalls = deployedContractData
        ? [contractInstance.populate(functionName, newArgs as any[])]
        : [];

      if (sendTransactionInstance.sendAsync) {
        try {
          // setIsMining(true);
          return await sendTxnWrapper(() =>
            sendTransactionInstance.sendAsync(newCalls as any[]),
          );
        } catch (e: any) {
          throw e;
        } finally {
          // setIsMining(false);
        }
      } else {
        notification.error("Contract writer error. Try again.");
        return;
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
