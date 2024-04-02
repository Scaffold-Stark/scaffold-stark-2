import { useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
// import { notification } from "~~/utils/scaffold-stark";
import {
  ContractAbi,
  ContractName,
  ExtractAbiFunctionNamesScaffold,
  ExtractAbiFunctionsScaffold,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import {
  useAccount,
  useContract,
  useContractWrite,
  useNetwork,
} from "@starknet-react/core";
import { Abi } from "starknet";
import { ExtractAbiFunctions, FunctionArgs } from "abi-wan-kanabi/dist/kanabi";
import { notification } from "~~/utils/scaffold-stark/notification";

// type UpdatedArgs = Parameters<
//   ReturnType<typeof useContractWrite<Abi, string, undefined>>["writeAsync"]
// >[0];

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
  //   const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { address } = useAccount();

  const { contract } = useContract({
    address: deployedContractData?.address,
    abi: deployedContractData?.abi as unknown as Abi,
  });

  const calls = useMemo(() => {
    if (!contract) return [];
    if (args) {
      return contract.populateTransaction[functionName](
        ...(args as unknown as any[]) //  TODO Fix this type
      );
    } else {
      return contract.populateTransaction[functionName]();
    }
  }, [contract, args, functionName]);

  const wagmiContractWrite = useContractWrite({
    calls,
    options,
  });

  //   const sendContractWriteTx = async ({
  //     args: newArgs,
  //     options: newOptions,
  //   }: {
  //     args?: UseScaffoldWriteConfig<TContractName, TFunctionName>["args"];
  //     options?: UseScaffoldWriteConfig<TContractName, TFunctionName>["options"];
  //   }) => {
  //     if (!deployedContractData) {
  //       console.error(
  //         "Target Contract is not deployed, did you forget to run `yarn deploy`?"
  //       );
  //       return;
  //     }
  //     if (!chain?.id) {
  //       console.error("Please connect your wallet");
  //       return;
  //     }
  //     if (chain?.id !== targetNetwork.id) {
  //       console.error("You are on the wrong network");
  //       return;
  //     }

  //     const newCalls = contract
  //       ? contract.populateTransaction[functionName](
  //           ...(args as unknown as any[]) //  TODO Fix this type
  //         )
  //       : calls;

  //     if (wagmiContractWrite.writeAsync) {
  //       try {
  //         setIsMining(true);
  //         const writeTxResult = await writeTx(() =>
  //           wagmiContractWrite.writeAsync({
  //             calls: newCalls ?? calls,
  //             options: newOptions ?? options,
  //           })
  //         );

  //         return writeTxResult;
  //       } catch (e: any) {
  //         throw e;
  //       } finally {
  //         setIsMining(false);
  //       }
  //     } else {
  //       notification.error("Contract writer error. Try again.");
  //       return;
  //     }
  //   };

  return {
    ...wagmiContractWrite,
    // isMining,
    // Overwrite wagmi's write async
    // writeAsync: sendContractWriteTx,
  };
};
