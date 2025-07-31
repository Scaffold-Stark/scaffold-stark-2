import { useTargetNetwork } from "./useTargetNetwork";
import {
  Contract,
  ContractAbi,
  ContractName,
  contracts,
  ExtractAbiFunctionNamesScaffold,
  UseScaffoldArgsParam,
  UseScaffoldWriteConfig,
} from "~~/utils/scaffold-stark/contract";
import { useSendTransaction, useNetwork, Abi } from "@starknet-react/core";
import {
  Contract as StarknetJsContract,
  InvocationsDetails,
  Call,
} from "starknet";
import { notification } from "~~/utils/scaffold-stark";
import { useTransactor } from "./useTransactor";

function isRawCall(value: Call | any): value is Call {
  return "entrypoint" in value;
}

/**
 * Provides a function to execute multiple contract write transactions in a single batch.
 * This hook allows you to execute multiple contract calls (either scaffold config or raw Call objects)
 * in a single transaction, which is useful for complex operations that require multiple contract interactions.
 *
 * @param config - Configuration object for the hook
 * @param config.calls - Array of contract calls to execute (scaffold config or raw Call objects)
 * @param config.options - Optional invocation details for the transaction
 * @returns {Object} An object containing:
 *   - sendAsync: () => Promise<string | undefined> - Function to execute the batch of transactions
 *   - isLoading: boolean - Boolean indicating if the transaction is in progress
 *   - error: Error | null - Any error encountered during the transaction
 *   - status: "idle" | "loading" | "success" | "error" - The transaction status
 *   - All other properties from sendTransactionInstance
 * @see {@link https://scaffoldstark.com/docs/hooks/useScaffoldMultiWriteContract}
 */

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
  calls: Array<
    UseScaffoldWriteConfig<TAbi, TContractName, TFunctionName> | Call
  >;
  options?: InvocationsDetails;
}) => {
  const { targetNetwork } = useTargetNetwork();
  const { chain } = useNetwork();
  const { writeTransaction: sendTxnWrapper, sendTransactionInstance } =
    useTransactor();

  const sendContractWriteTx = async () => {
    if (!chain?.id) {
      console.error("Please connect your wallet");
      return;
    }
    if (chain?.id !== targetNetwork.id) {
      console.error("You are on the wrong network");
      return;
    }

    try {
      // we just parse calldata here so that it will only parse on demand.
      // use IIFE pattern
      const parsedCalls = (() => {
        if (calls) {
          return calls.map((call) => {
            if (isRawCall(call)) {
              return call;
            }
            const functionName = call.functionName;
            const contractName = call.contractName;
            const unParsedArgs = call.args as any[];
            const contract = contracts?.[targetNetwork.network]?.[
              contractName as ContractName
            ] as Contract<TContractName>;
            // we convert to starknetjs contract instance here since deployed data may be undefined if contract is not deployed
            const contractInstance = new StarknetJsContract(
              contract.abi,
              contract.address,
            );

            return contractInstance.populate(
              functionName,
              unParsedArgs as any[],
            );
          });
        } else {
          return [];
        }
      })();

      return await sendTxnWrapper(parsedCalls);
    } catch (e: any) {
      throw e;
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
