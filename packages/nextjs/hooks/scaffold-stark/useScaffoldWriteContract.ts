import { useMemo } from "react";
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
  const writeTx = useTransactor();
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
    if (args && abiFunction) {
      return parseFunctionParams(abiFunction, args as any[], false).flat();
    }
    return [];
  }, [args, abiFunction]);

  const wagmiContractWrite = useSendTransaction({
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

  const sendContractWriteTx = async ({
    args: newArgs,
  }: {
    args?: UseScaffoldWriteConfig<TAbi, TContractName, TFunctionName>["args"];
  } & UpdatedArgs) => {
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
      newArgs && abiFunction
        ? parseFunctionParams(abiFunction, newArgs as any[], false).flat()
        : parsedParams;
    const newCalls = [
      {
        contractAddress: deployedContractData.address,
        entrypoint: functionName,
        calldata: newParsedParams,
      },
    ];

    if (wagmiContractWrite.sendAsync) {
      try {
        // setIsMining(true);
        return await writeTx(() =>
          wagmiContractWrite.sendAsync(newCalls as any[]),
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
    ...wagmiContractWrite,
    writeAsync: sendContractWriteTx,
  };
};
