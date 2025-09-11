import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GetTransactionReceiptResponse,
  TransactionStatusReceiptSets,
  TransactionWithHash,
  RpcProvider,
  GetBlockResponse,
  Event,
} from "starknet";
import {
  DECLARE_TXN_V3,
  DEPLOY_ACCOUNT_TXN_V3,
  INVOKE_TXN_V3,
  DEPLOY_TXN,
} from "@starknet-io/types-js";
import { useTargetNetwork } from "../scaffold-stark/useTargetNetwork";
import { getFunctionNameFromSelector } from "../../utils/scaffold-stark/selectorUtils";
import { devnetUDCAddress } from "~~/utils/Constants";
import {
  checkSanitizedEquals,
  convertCalldataToReadable,
  decodeFunctionArguments,
  findFunctionDefinition,
  getMergedContracts,
} from "~~/utils/blockexplorer";

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
  txReceipt?: GetTransactionReceiptResponse;

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
                  if (checkSanitizedEquals(call.to, devnetUDCAddress)) {
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
    staleTime: 5 * 1000, // 5 seconds
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
