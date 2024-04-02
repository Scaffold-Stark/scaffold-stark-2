import { useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import {
  useDeployedContractInfo,
  useTransactor,
} from "~~/hooks/scaffold-stark";
// import { notification } from "~~/utils/scaffold-stark";
import {
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import { useContractWrite, useNetwork } from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";

type UpdatedArgs = Parameters<
  ReturnType<typeof useContractWrite>["writeAsync"]
>[0];

export const useScaffoldContractWrite = <
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >
>({
  contractName,
  functionName,
  args,
  options,
}: UseScaffoldWriteConfig<TContractName, TFunctionName>) => {
  const { data: deployedContractData } = useDeployedContractInfo(contractName);
  const { chain } = useNetwork();
  const writeTx = useTransactor();
  const { targetNetwork } = useTargetNetwork();
  const wagmiContractWrite = useContractWrite({
    calls: deployedContractData
      ? [
          {
            contractAddress: deployedContractData.address,
            entrypoint: functionName,
            calldata: args as any[],
          },
        ]
      : [],
    options,
  });

  const sendContractWriteTx = async ({
    args: newArgs,
    options: newOptions,
  }: {
    args?: UseScaffoldWriteConfig<TContractName, TFunctionName>["args"];
    options?: UseScaffoldWriteConfig<TContractName, TFunctionName>["options"];
  } & UpdatedArgs = {}) => {
    if (!deployedContractData) {
      console.error(
        "Target Contract is not deployed, did you forget to run `yarn deploy`?"
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
    const newCalls =
      newArgs && deployedContractData
        ? [
            {
              contractAddress: deployedContractData.address,
              entrypoint: functionName,
              calldata: newArgs as any[],
            },
          ]
        : {
            contractAddress: deployedContractData.address,
            entrypoint: functionName,
            calldata: args as any[],
          };

    if (wagmiContractWrite.writeAsync) {
      try {
        // setIsMining(true);
        const writeTxResult = await writeTx(() =>
          wagmiContractWrite.writeAsync({
            calls: newCalls as any[],
            options: newOptions ?? options,
          })
        );

        return writeTxResult;
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
    // isMining,
    // Overwrite wagmi's write async
    writeAsync: sendContractWriteTx,
  };
};
