import { useCallback, useMemo } from "react";
import { useBlockNumber } from "@starknet-react/core";
import {
  GetTransactionReceiptResponse,
  TransactionStatusReceiptSets,
  TransactionWithHash,
  RpcProvider,
} from "starknet";
import { useQuery } from "@tanstack/react-query";
import { useTargetNetwork } from "./useTargetNetwork";
import {
  DECLARE_TXN_V3,
  DEPLOY_ACCOUNT_TXN_V3,
  INVOKE_TXN_V3,
  DEPLOY_TXN,
} from "@starknet-io/types-js";
import deployedContracts from "../../contracts/deployedContracts";

interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

type ExplorerReturnType = {
  blockHash?: string;
  blockNumber?: number;
  timestamp?: number;
  transactionHash?: string;
  txInstance?: TransactionWithHash;
  txReceipt?: GetTransactionReceiptResponse<keyof TransactionStatusReceiptSets>;
  fromAddress?: string | null;
  txCalls: {
    functionCalled: string | null;
    functionSelector: string | null;
    toAddress: string | null;
    valueInSTRK: bigint;
  }[];
};

const convertCalldataToReadable = (
  calldata: string[],
): { to: string; selector: string; args: string[] }[] => {
  const calls: { to: string; selector: string; args: string[] }[] = [];
  let currentPointer = 1;
  while (currentPointer < calldata.length) {
    // obtain the  to value
    const to = calldata[currentPointer];

    // obtain the selector
    const selector = calldata[currentPointer + 1];

    // obtain args length
    const argsLength = parseInt(calldata[currentPointer + 2], 16);

    // obtain the args
    const args = calldata.slice(
      currentPointer + 3,
      currentPointer + 3 + argsLength,
    );

    calls.push({ to, selector, args });

    currentPointer += 3 + argsLength;
  }

  return calls;
};

// This hook fetches transactions from the Starknet network with pagination support.
// It lazily loads blocks to avoid fetching all data at once.
// NOTE: This hook is intended to help devnet explorer, not a good idea to use in sepolia or mainnet.
export function useFetchAllTxns(options: PaginationOptions = {}) {
  const { page = 1, pageSize = 5 } = options;
  const { data: totalBlocks } = useBlockNumber();
  const { targetNetwork } = useTargetNetwork();

  const provider = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  const processBlockToTxns = useCallback(
    async (block: Awaited<ReturnType<typeof provider.getBlock>>) => {
      const parsedTxns: ExplorerReturnType[] = [];

      // get basic block info and raw transactions
      const {
        timestamp,
        transactions: txs,
        block_hash: blockHash,
        block_number: blockNumber,
      } = block;

      for (const txHash of txs) {
        const txInstance = await provider.getTransaction(txHash);
        const txReceipt = await provider.getTransactionReceipt(txHash);

        const explorerEntry: Partial<ExplorerReturnType> = {
          blockHash,
          blockNumber,
          timestamp,
          transactionHash: txHash,
          txInstance,
          txReceipt,
        };

        const txData: ExplorerReturnType["txCalls"][number] = {
          functionCalled: null,
          functionSelector: null,
          toAddress: null,
          valueInSTRK: BigInt(0),
        };

        const txCalls: ExplorerReturnType["txCalls"] = [];

        if (txInstance.type === "DEPLOY") {
          // For deploy transactions

          // TODO: check from address
          explorerEntry.fromAddress = (
            txInstance as unknown as DEPLOY_TXN
          ).constructor_calldata[0];
          txData.functionCalled = "Contract Deployment";
          txData.functionSelector = "Contract Deployment";

          txCalls.push(txData);
        } else if (txInstance.type === "DECLARE") {
          // For declare transactions
          explorerEntry.fromAddress = (
            txInstance as unknown as DECLARE_TXN_V3
          ).sender_address;

          txData.functionCalled = "Class Declaration";
          txData.functionSelector = "Class Declaration";

          txCalls.push(txData);
        } else if (txInstance.type === "DEPLOY_ACCOUNT") {
          // For deploy account transactions
          explorerEntry.fromAddress = (
            txInstance as unknown as DEPLOY_ACCOUNT_TXN_V3
          ).contract_address_salt
            ? `0x${(txInstance as unknown as DEPLOY_ACCOUNT_TXN_V3).contract_address_salt}`
            : null;
          txData.toAddress = (
            txInstance as unknown as DEPLOY_ACCOUNT_TXN_V3
          ).contract_address_salt;
          txData.functionCalled = "Account Deployment";
          txData.functionSelector = "Account Deployment";

          txCalls.push(txData);
        } else if (txInstance.type === "INVOKE") {
          // get calls
          const calls = convertCalldataToReadable(
            (txInstance as unknown as INVOKE_TXN_V3).calldata,
          );
          explorerEntry.fromAddress = (
            txInstance as unknown as INVOKE_TXN_V3
          ).sender_address;

          for (const call of calls) {
            const _txData = { ...txData };

            _txData.toAddress = call.to;
            _txData.functionSelector = call.selector;
            _txData.functionCalled = call.selector;
            txCalls.push(_txData);
          }
        }
        parsedTxns.push({
          ...explorerEntry,
          txCalls,
        });
      }

      return parsedTxns;
    },
    [provider],
  );

  // Efficiently fetch transactions with lazy loading
  const fetchPaginatedTxns = useCallback(async () => {
    if (!totalBlocks || !provider) return { txns: [], totalTxns: 0 };

    // For efficiency, we'll fetch blocks in reverse order (latest first)
    // and limit the number of blocks we process based on pagination needs
    const maxBlocksToProcess = Math.min(
      totalBlocks,
      Math.ceil((page * pageSize) / 2) + 10,
    );
    const blocksToFetch: number[] = [];

    // Start from latest blocks and work backwards
    for (
      let i = totalBlocks - 1;
      i >= Math.max(0, totalBlocks - maxBlocksToProcess);
      i--
    ) {
      blocksToFetch.push(i);
    }

    // Fetch transactions from selected blocks
    const allTxns: ExplorerReturnType[] = [];
    for (const blockNum of blocksToFetch) {
      try {
        const block = await provider.getBlock(blockNum);
        const txns = await processBlockToTxns(block);
        allTxns.push(...txns);
      } catch (error) {
        console.warn(`Failed to fetch block ${blockNum}:`, error);
        // Continue with other blocks even if one fails
      }
    }

    // Sort transactions by block number (descending) and timestamp (descending)
    allTxns.sort((a, b) => {
      if (b.blockNumber !== a.blockNumber) {
        return (b.blockNumber || 0) - (a.blockNumber || 0);
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    // For total count, we need to estimate or fetch from all blocks
    // For now, we'll use the current fetched data length as an approximation
    // In a real implementation, you might want to cache block transaction counts
    const totalTxns = allTxns.length;

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTxns = allTxns.slice(startIndex, endIndex);

    return {
      txns: paginatedTxns,
      totalTxns,
      hasMore: allTxns.length >= pageSize * page,
    };
  }, [totalBlocks, provider, processBlockToTxns, page, pageSize]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "fetchPaginatedTxns",
      totalBlocks,
      targetNetwork.rpcUrls.public.http[0],
      page,
      pageSize,
    ],
    queryFn: fetchPaginatedTxns,
    enabled: !!totalBlocks && !!provider,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const totalPages = data ? Math.ceil(data.totalTxns / pageSize) : 0;

  return {
    txns: data?.txns || [],
    totalTxns: data?.totalTxns || 0,
    totalPages,
    currentPage: page,
    pageSize,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
  };
}
