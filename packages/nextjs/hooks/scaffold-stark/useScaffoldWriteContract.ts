import { useEffect, useMemo } from "react";
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
import { useSendTransaction, useNetwork, Abi } from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";

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

  const parsedParams = useMemo(() => {
    if (args && abiFunction && deployedContractData) {
      const parsed = parseFunctionParams({
        abiFunction,
        abi: deployedContractData.abi,
        inputs: args as any[],
        isRead: false,
        isReadArgsParsing: false,
      }).flat(Infinity);
      return parsed;
    }
    return [];
  }, [args, abiFunction, deployedContractData]);

  const sendTransactionInstance = useSendTransaction({
    calls: deployedContractData
      ? [
          {
            contractAddress: deployedContractData?.address,
            entrypoint: functionName,
            calldata: parsedParams,
          },
        ]
      : [],
  });

  const sendContractWriteTx = async (params?: {
    args?: UseScaffoldWriteConfig<TAbi, TContractName, TFunctionName>["args"];
  }) => {
    // if no args supplied, use the one supplied from hook
    let newArgs = params?.args;
    if (!newArgs) {
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

    let newParsedParams =
      newArgs && abiFunction && deployedContractData
        ? parseFunctionParams({
            abiFunction,
            abi: deployedContractData.abi,
            inputs: args as any[],
            isRead: false,
            isReadArgsParsing: false,
          }).flat(Infinity)
        : parsedParams;
    const newCalls = [
      {
        contractAddress: deployedContractData.address,
        entrypoint: functionName,
        calldata: newParsedParams,
      },
    ];

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
  };

  return {
    ...sendTransactionInstance,
    sendAsync: sendContractWriteTx,
  };
};
