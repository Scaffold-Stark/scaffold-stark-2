import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GetTransactionReceiptResponse,
  TransactionStatusReceiptSets,
  TransactionWithHash,
  RpcProvider,
  GetBlockResponse,
  Event,
  InvokeTransactionReceiptResponse,
  DeclareTransactionReceiptResponse,
  DeployTransactionReceiptResponse,
  DeployAccountTransactionReceiptResponse,
  SuccessfulTransactionReceiptResponse,
  hash,
  num,
} from "starknet";
import {
  DECLARE_TXN_V3,
  DEPLOY_ACCOUNT_TXN_V3,
  INVOKE_TXN_V3,
  DEPLOY_TXN,
} from "@starknet-io/types-js";
import { useTargetNetwork } from "./useTargetNetwork";
import { getFunctionNameFromSelector } from "../../utils/scaffold-stark/selectorUtils";
import { devnetUDCAddress } from "~~/utils/Constants";
import deployedContracts from "~~/contracts/deployedContracts";
import predeployedContracts from "~~/contracts/predeployedContracts";
import configExternalContracts from "~~/contracts/configExternalContracts";
import { deepMergeContracts } from "~~/utils/scaffold-stark/contract";

/**
 * Comprehensive transaction detail interface that includes all relevant information
 * from a Starknet transaction including receipt, block context, and parsed data.
 */
export interface TransactionDetail {
  // Basic transaction info
  transactionHash: string;
  status: string;
  blockHash?: string;
  blockNumber?: number;
  timestamp?: number;

  // Transaction instance data
  txInstance?: TransactionWithHash;
  type: string;
  version?: string;

  // Address information
  senderAddress?: string;
  contractAddress?: string;

  // Transaction specifics
  calldata?: string[];
  signature?: string[];
  nonce?: string;
  maxFee?: string;
  actualFee?: string;

  // Execution details
  executionResources?: any;
  executionStatus?: string;
  revertReason?: string;

  // Events and logs
  events?: Event[];
  logs?: string[];

  // Receipt data
  txReceipt?: GetTransactionReceiptResponse<keyof TransactionStatusReceiptSets>;

  // Block context
  blockDetails?: GetBlockResponse;

  // Gas and resource usage
  gasUsed?: string;
  gasPrice?: string;
  l1GasConsumed?: string;
  l2GasConsumed?: string;

  // Function call information (for invoke transactions)
  functionCalls?: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
    selector?: string;
    decodedArgs?: Record<string, any>;
    argTypes?: Record<string, string>;
  }[];
}

const convertCalldataToReadable = (
  calldata: string[],
): { to: string; selector: string; args: string[] }[] => {
  const calls: { to: string; selector: string; args: string[] }[] = [];
  let currentPointer = 1;
  while (currentPointer < calldata.length) {
    const to = calldata[currentPointer];
    const selector = calldata[currentPointer + 1];
    const argsLength = parseInt(calldata[currentPointer + 2], 16);
    const args = calldata.slice(
      currentPointer + 3,
      currentPointer + 3 + argsLength,
    );
    calls.push({ to, selector, args });
    currentPointer += 3 + argsLength;
  }
  return calls;
};

/**
 * Get merged contracts for ABI-based parsing
 */
const getMergedContracts = (targetNetwork: any) => {
  try {
    const allMerged = deepMergeContracts(
      deepMergeContracts(deployedContracts, predeployedContracts),
      configExternalContracts,
    );
    const networkKey = targetNetwork.network as keyof typeof allMerged;
    const merged = allMerged[networkKey] || {};
    return merged;
  } catch (error) {
    console.warn("Error merging contracts:", error);
    return {};
  }
};

/**
 * Find function definition from ABI using selector
 */
const findFunctionDefinition = (
  selector: string,
  mergedContracts: any,
  contractAddress?: string,
) => {
  try {
    for (const contractName in mergedContracts) {
      const contract = mergedContracts[contractName];

      // If we have a specific contract address, try to match it first
      if (
        contractAddress &&
        contract.address &&
        contract.address.toLowerCase() !== contractAddress.toLowerCase()
      ) {
        continue;
      }

      if (contract && contract.abi) {
        // Find interface entries in the ABI
        for (const abiEntry of contract.abi) {
          if (abiEntry.type === "interface" && abiEntry.items) {
            // Find function in interface items
            for (const item of abiEntry.items) {
              if (item.type === "function" && item.name) {
                const functionSelector = num.toHex(
                  hash.starknetKeccak(item.name),
                );
                if (functionSelector === selector) {
                  return {
                    functionDef: item,
                    contractName,
                    functionName: item.name,
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.warn("Error finding function definition:", error);
    return null;
  }
};

/**
 * Decode function arguments using ABI definition
 */
const decodeFunctionArguments = (functionDefinition: any, args: string[]) => {
  try {
    const decodedArgs: Record<string, any> = {};
    const argTypes: Record<string, string> = {};

    if (
      !functionDefinition.inputs ||
      !Array.isArray(functionDefinition.inputs)
    ) {
      return { decodedArgs, argTypes };
    }

    let dataIndex = 0;

    for (const input of functionDefinition.inputs) {
      const { name, type } = input;

      if (dataIndex >= args.length) break;

      argTypes[name] = type;

      try {
        // Handle different Cairo types
        if (type === "core::integer::u256") {
          // u256 takes two felt252 values (low, high)
          if (dataIndex + 1 < args.length) {
            const low = BigInt(args[dataIndex]);
            const high = BigInt(args[dataIndex + 1]);
            decodedArgs[name] = low + (high << 128n);
            dataIndex += 2;
          } else {
            decodedArgs[name] = BigInt(args[dataIndex]);
            dataIndex += 1;
          }
        } else if (type === "core::byte_array::ByteArray") {
          // ByteArray decoding - simplified version
          const numFullWords = parseInt(args[dataIndex], 16);
          const startIdx = dataIndex + 1;
          const endIdx = startIdx + numFullWords + 2; // +2 for pending_word and pending_word_len

          try {
            let decoded = "";
            // Decode full words
            for (let i = startIdx; i < startIdx + numFullWords; i++) {
              if (i < args.length) {
                const hex = args[i].slice(2); // Remove 0x
                decoded += Buffer.from(hex, "hex").toString("utf8");
              }
            }
            // Handle pending word if needed
            if (startIdx + numFullWords < args.length) {
              const pendingWord = args[startIdx + numFullWords];
              const pendingLen = parseInt(
                args[startIdx + numFullWords + 1],
                16,
              );
              if (pendingLen > 0) {
                const hex = pendingWord.slice(2).slice(0, pendingLen * 2);
                decoded += Buffer.from(hex, "hex").toString("utf8");
              }
            }
            decodedArgs[name] = decoded || args[dataIndex];
            dataIndex = Math.min(endIdx, args.length);
          } catch (error) {
            decodedArgs[name] = args[dataIndex];
            dataIndex += 1;
          }
        } else if (
          type === "core::starknet::contract_address::ContractAddress"
        ) {
          decodedArgs[name] = args[dataIndex];
          dataIndex += 1;
        } else if (type === "core::bool") {
          decodedArgs[name] =
            args[dataIndex] === "0x1" || args[dataIndex] === "1";
          dataIndex += 1;
        } else {
          // Default: treat as felt252 or similar
          const value = args[dataIndex];
          if (value.startsWith("0x")) {
            const bigIntValue = BigInt(value);
            // If it's a reasonable number, convert to BigInt, otherwise keep as string
            if (bigIntValue < 2n ** 64n) {
              decodedArgs[name] = bigIntValue;
            } else {
              decodedArgs[name] = value;
            }
          } else {
            decodedArgs[name] = value;
          }
          dataIndex += 1;
        }
      } catch (error) {
        // Fallback: store raw value
        decodedArgs[name] = args[dataIndex];
        dataIndex += 1;
      }
    }

    return { decodedArgs, argTypes };
  } catch (error) {
    console.warn("Error decoding function arguments:", error);
    return { decodedArgs: {}, argTypes: {} };
  }
};

/**
 * Hook to fetch comprehensive transaction details from a Starknet transaction hash.
 *
 * This hook provides detailed information about a transaction including:
 * - Transaction instance and receipt data
 * - Block context (timestamp, block number, etc.)
 * - Execution resources and gas usage
 * - Events and logs data
 * - Function call information for invoke transactions
 * - Status and error information
 *
 * @param txHash - The transaction hash to fetch details for
 * @returns Object containing transaction detail data, loading state, and error
 *
 * @example
 * ```tsx
 * const { transactionDetail, isLoading, error } = useFetchTxnDetail(
 *   "0x1234567890abcdef..."
 * );
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (!transactionDetail) return <div>Transaction not found</div>;
 *
 * return (
 *   <div>
 *     <h2>Transaction {transactionDetail.transactionHash}</h2>
 *     <p>Status: {transactionDetail.status}</p>
 *     <p>Block: {transactionDetail.blockNumber}</p>
 *     <p>Gas Used: {transactionDetail.gasUsed}</p>
 *     {transactionDetail.logs && (
 *       <div>
 *         <h3>Logs:</h3>
 *         {transactionDetail.logs.map((log, i) => (
 *           <div key={i}>{log}</div>
 *         ))}
 *       </div>
 *     )}
 *   </div>
 * );
 * ```
 */
export const useFetchTxnDetail = (txHash?: string) => {
  const { targetNetwork } = useTargetNetwork();

  const provider = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  const fetchTransactionDetail =
    async (): Promise<TransactionDetail | null> => {
      if (!txHash || !provider) return null;

      try {
        // Fetch transaction instance and receipt in parallel
        const [txInstance, txReceipt] = await Promise.all([
          provider.getTransaction(txHash),
          provider.getTransactionReceipt(txHash),
        ]);

        // Extract receipt data - use the value property directly
        const receiptData = (txReceipt as any).value || txReceipt;
        let blockDetails: GetBlockResponse | undefined;

        // Get block details if available
        if (receiptData.block_number) {
          try {
            blockDetails = await provider.getBlock(receiptData.block_number);
          } catch (error) {
            console.warn("Failed to fetch block details:", error);
          }
        }

        // Helper function to extract fee amount from fee object or string
        const extractFeeAmount = (fee: any): string | undefined => {
          if (!fee) return undefined;
          if (typeof fee === "string") return fee;
          if (typeof fee === "object" && fee.amount) return fee.amount;
          return undefined;
        };

        // Initialize transaction detail object
        const transactionDetail: TransactionDetail = {
          transactionHash: txHash,
          txInstance,
          txReceipt,
          blockDetails,
          type: txInstance.type,
          version: txInstance.version,
          status: receiptData.execution_status || "UNKNOWN",
          blockHash: receiptData.block_hash,
          blockNumber: receiptData.block_number,
          timestamp: blockDetails?.timestamp,
          actualFee: extractFeeAmount(receiptData.actual_fee),
          executionStatus: receiptData.execution_status,
          revertReason: receiptData.revert_reason,
        };

        // Extract execution resources
        if (receiptData.execution_resources) {
          transactionDetail.executionResources =
            receiptData.execution_resources;
          transactionDetail.gasUsed =
            receiptData.execution_resources.steps?.toString();
          transactionDetail.l1GasConsumed =
            receiptData.execution_resources.l1_gas?.toString();
          transactionDetail.l2GasConsumed =
            receiptData.execution_resources.l2_gas?.toString();
        }

        // Extract events and format logs
        if (receiptData.events && receiptData.events.length > 0) {
          transactionDetail.events = receiptData.events;
          // Convert events to log format for display
          transactionDetail.logs = receiptData.events.flatMap((event: any) => [
            event.from_address,
            ...event.keys,
            ...event.data,
          ]);
        }

        // Process transaction type-specific data
        switch (txInstance.type) {
          case "INVOKE":
            const invokeTxn = txInstance as unknown as INVOKE_TXN_V3;
            transactionDetail.senderAddress = invokeTxn.sender_address;
            transactionDetail.calldata = invokeTxn.calldata;
            transactionDetail.signature = invokeTxn.signature;
            transactionDetail.nonce = invokeTxn.nonce;
            transactionDetail.maxFee = extractFeeAmount(
              (invokeTxn as any).max_fee,
            );

            // Parse function calls from calldata with ABI-based argument decoding
            if (invokeTxn.calldata && invokeTxn.calldata.length > 0) {
              try {
                const calls = convertCalldataToReadable(invokeTxn.calldata);
                const mergedContracts = getMergedContracts(targetNetwork);

                transactionDetail.functionCalls = calls.map((call) => {
                  // detect UDC deployment invocations
                  if (
                    call.to.toLowerCase() === devnetUDCAddress.toLowerCase()
                  ) {
                    transactionDetail.type = "DEPLOY";
                    return {
                      contractAddress: call.to,
                      entrypoint: "Deploy Contract",
                      calldata: call.args,
                      selector: call.selector,
                      decodedArgs: {},
                      argTypes: {},
                    };
                  }

                  // Try to find function definition and decode arguments
                  const functionInfo = findFunctionDefinition(
                    call.selector,
                    mergedContracts,
                    call.to,
                  );
                  let decodedArgs: Record<string, any> = {};
                  let argTypes: Record<string, string> = {};

                  if (functionInfo) {
                    const { decodedArgs: decoded, argTypes: types } =
                      decodeFunctionArguments(
                        functionInfo.functionDef,
                        call.args,
                      );
                    decodedArgs = decoded;
                    argTypes = types;
                  }

                  return {
                    contractAddress: call.to,
                    entrypoint: getFunctionNameFromSelector(
                      call.selector,
                      targetNetwork.network,
                    ),
                    calldata: call.args,
                    selector: call.selector,
                    decodedArgs,
                    argTypes,
                  };
                });
              } catch (error) {
                console.warn("Failed to parse calldata:", error);
              }
            }
            break;

          case "DECLARE":
            const declareTxn = txInstance as unknown as DECLARE_TXN_V3;
            transactionDetail.senderAddress = declareTxn.sender_address;
            transactionDetail.signature = declareTxn.signature;
            transactionDetail.nonce = declareTxn.nonce;
            transactionDetail.maxFee = extractFeeAmount(
              (declareTxn as any).max_fee,
            );
            break;

          case "DEPLOY_ACCOUNT":
            const deployAccountTxn =
              txInstance as unknown as DEPLOY_ACCOUNT_TXN_V3;
            transactionDetail.contractAddress =
              deployAccountTxn.contract_address_salt;
            transactionDetail.signature = deployAccountTxn.signature;
            transactionDetail.nonce = deployAccountTxn.nonce;
            transactionDetail.maxFee = extractFeeAmount(
              (deployAccountTxn as any).max_fee,
            );
            break;

          case "DEPLOY":
            const deployTxn = txInstance as unknown as DEPLOY_TXN;
            if (
              deployTxn.constructor_calldata &&
              deployTxn.constructor_calldata.length > 0
            ) {
              transactionDetail.senderAddress =
                deployTxn.constructor_calldata[0];
            }
            break;

          default:
            console.warn("Unknown transaction type:", txInstance.type);
        }

        return transactionDetail;
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        throw error;
      }
    };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["txn-detail", txHash, targetNetwork.rpcUrls.public.http[0]],
    queryFn: fetchTransactionDetail,
    enabled: !!txHash && !!provider,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    transactionDetail: data,
    isLoading,
    error,
    refetch,
  };
};
