import { useTargetNetwork } from "./useTargetNetwork";
// import {useTransactor,} from "~~/hooks/scaffold-stark";
import {
  Contract,
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  getFunctionsByStateMutability,
  parseFunctionParams,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import { useContractWrite, useNetwork } from "@starknet-react/core";
import { Call, InvocationsDetails } from "starknet";
import { notification } from "~~/utils/scaffold-stark";
import { useMemo } from "react";
import { useTransactor } from "./useTransactor";

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
  const { chain } = useNetwork();
  const writeTx = useTransactor();

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
            abiFunction && unParsedArgs
              ? parseFunctionParams(abiFunction, unParsedArgs)
              : [],
        };
      });
    } else {
      return [];
    }
  }, [calls]);

  // TODO add custom options
  const wagmiContractWrite = useContractWrite({
    calls: parsedCalls,
    options,
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

    if (wagmiContractWrite.writeAsync) {
      try {
        // setIsMining(true);
        const writeTxResult = await writeTx(() =>
          wagmiContractWrite.writeAsync(),
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
    writeAsync: sendContractWriteTx,
  };
};
