import { useTargetNetwork } from "./useTargetNetwork";
import {
  Contract,
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  getFunctionsByStateMutability,
  parseFunctionParams,
  UseScaffoldArgsParam,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import { useSendTransaction, useNetwork, Abi } from "@starknet-react/core";
import { InvocationsDetails } from "starknet";
import { notification } from "~~/utils/scaffold-stark";
import { useMemo } from "react";
import { useTransactor } from "./useTransactor";

export const useScaffoldMultiWriteContract = <
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >,
>({
  calls,
  options,
}: {
  calls: Array<UseScaffoldWriteConfig<TAbi, TContractName, TFunctionName>>;
  options?: InvocationsDetails;
}) => {
  const { targetNetwork } = useTargetNetwork();
  const { chain } = useNetwork();
  const sendTxnWrapper = useTransactor();

  const parsedCalls = useMemo(() => {
    if (calls) {
      return calls.map((call) => {
        const functionName = call.functionName;
        const contractName = call.contractName;
        const unParsedArgs = call.args as any[];
        const contract = contracts?.[targetNetwork.network]?.[
          contractName as ContractName
        ] as Contract<TContractName>;

        const abiFunction = getFunctionsByStateMutability(
          contract?.abi || [],
          "external",
        ).find((fn) => fn.name === functionName);

        return {
          contractAddress: contract?.address,
          entrypoint: functionName,
          calldata:
            abiFunction && unParsedArgs && contract
              ? parseFunctionParams({
                  abiFunction,
                  isRead: false,
                  inputs: unParsedArgs as any[],
                  isReadArgsParsing: false,
                  abi: contract.abi,
                }).flat()
              : [],
        };
      });
    } else {
      return [];
    }
  }, [calls]);

  // TODO add custom options
  const sendTransactionInstance = useSendTransaction({
    calls: parsedCalls,
  });

  const sendContractWriteTx = async () => {
    if (!chain?.id) {
      console.error("Please connect your wallet");
      return;
    }
    if (chain?.id !== targetNetwork.id) {
      console.error("You are on the wrong network");
      return;
    }

    if (sendTransactionInstance.sendAsync) {
      try {
        // setIsMining(true);
        return await sendTxnWrapper(() => sendTransactionInstance.sendAsync());
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

export function createContractCall<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >,
>(
  contractName: TContractName,
  functionName: TFunctionName,
  args: UseScaffoldArgsParam<TAbi, TContractName, TFunctionName>["args"],
) {
  return { contractName, functionName, args };
}
