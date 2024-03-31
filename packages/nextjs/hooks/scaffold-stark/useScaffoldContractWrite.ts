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
  //   value,
  //   onBlockConfirmation,
  //   blockConfirmations,
  ...writeConfig
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
    return contract.populateTransaction[functionName](...args);
  }, [contract]);

  console.log("Address", address);

  const wagmiContractWrite = useContractWrite({
    // chainId: targetNetwork.id,
    // address: deployedContractData?.address,
    // abi: deployedContractData?.abi as Abi,
    // functionName: functionName as any,
    // args: args as unknown[],
    // value: value,
    // ...writeConfig,
    calls,
  });

  //   const sendContractWriteTx = async ({
  //     args: newArgs,
  //     value: newValue,
  //     ...otherConfig
  //   }: {
  //     args?: UseScaffoldWriteConfig<TContractName, TFunctionName>["args"];
  //     value?: UseScaffoldWriteConfig<TContractName, TFunctionName>["value"];
  //   } & UpdatedArgs = {}) => {
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

  // if (wagmiContractWrite.writeAsync) {
  //   try {
  //     setIsMining(true);
  //     const writeTxResult = await writeTx(
  //       () =>
  //         wagmiContractWrite.writeAsync({
  //           args: newArgs ?? args,
  //           value: newValue ?? value,
  //           ...otherConfig,
  //         }),
  //       { onBlockConfirmation, blockConfirmations }
  //     );

  //     return writeTxResult;
  //   } catch (e: any) {
  //     throw e;
  //   } finally {
  //     setIsMining(false);
  //   }
  // } else {
  //   notification.error("Contract writer error. Try again.");
  //   return;
  // }
  //   };

  return {
    ...wagmiContractWrite,
    // isMining,
    // Overwrite wagmi's write async
    // writeAsync: sendContractWriteTx,
  };
};
