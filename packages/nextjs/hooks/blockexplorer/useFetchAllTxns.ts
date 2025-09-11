import { useCallback, useMemo } from "react";
import { useBlockNumber } from "@starknet-react/core";
import {
  GetTransactionReceiptResponse,
  TransactionStatusReceiptSets,
  TransactionWithHash,
  RpcProvider,
  BlockTag,
} from "starknet";
import { useQuery } from "@tanstack/react-query";
import { useTargetNetwork } from "../scaffold-stark/useTargetNetwork";
import {
  DECLARE_TXN_V3,
  DEPLOY_ACCOUNT_TXN_V3,
  INVOKE_TXN_V3,
  DEPLOY_TXN,
} from "@starknet-io/types-js";
import { getFunctionNameFromSelector } from "../../utils/scaffold-stark/selectorUtils";
import { devnetUDCAddress } from "~~/utils/Constants";
import { encode } from "starknet";
import {
  checkSanitizedEquals,
  convertCalldataToReadable,
} from "~~/utils/blockexplorer";

interface UseFetchAllTxnsOptions {
  page?: number;
  pageSize?: number;
  bySenderAddress?: string;
  byReceiverAddress?: string;
}

type ExplorerReturnType = {
  blockHash?: string;
  blockNumber?: number;
  timestamp?: number;
  transactionHash?: string;
  txInstance?: TransactionWithHash;
  txReceipt?: GetTransactionReceiptResponse;
  fromAddress?: string | null;
  txCalls: {
    functionCalled: string | null;
    functionSelector: string | null;
    toAddress: string | null;
    valueInSTRK: bigint;
  }[];
};

// This hook fetches transactions from the Starknet network with pagination support.
// It lazily loads blocks to avoid fetching all data at once.
// NOTE: This hook is intended to help devnet explorer, not a good idea to use in sepolia or mainnet.
export function useFetchAllTxns(options: UseFetchAllTxnsOptions = {}) {
  const {
    page = 1,
    pageSize = 7,
    bySenderAddress,
    byReceiverAddress,
  } = options;

  const { targetNetwork } = useTargetNetwork();

  // this is a workaround since if we don't add one, the next block won't be visible.
  const { data: _totalBlocks } = useBlockNumber({
    blockIdentifier: BlockTag.LATEST,
    refetchInterval: 500,
  });
  const totalBlocks = useMemo(() => (_totalBlocks || 0) + 1, [_totalBlocks]);

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

        let txCalls: ExplorerReturnType["txCalls"] = [];

        // since devnet uses UDC and its treated as invoke, we record that case here
        if (txInstance.type === "DECLARE") {
          // For declare transactions
          explorerEntry.fromAddress = (
            txInstance as unknown as DECLARE_TXN_V3
          ).sender_address;

          txData.functionCalled = "Declare";
          txData.functionSelector = "Declare";

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

          txData.functionCalled = "Deploy Account";
          txData.functionSelector = "Deploy Account";

          txCalls.push(txData);
        } else if (txInstance.type === "INVOKE") {
          explorerEntry.fromAddress = (
            txInstance as unknown as INVOKE_TXN_V3
          ).sender_address;

          const calls = convertCalldataToReadable(
            (txInstance as unknown as INVOKE_TXN_V3).calldata,
          );

          // since devnet uses UDC and its treated as invoke, we record that case here
          for (const call of calls) {
            const _txData = { ...txData };

            const isContractDeployment = checkSanitizedEquals(
              call.to,
              devnetUDCAddress,
            );

            _txData.toAddress = call.to;
            _txData.functionSelector = call.selector;

            // we manually append deployment name
            if (isContractDeployment) {
              _txData.functionCalled = "Deploy Contract";
            } else {
              _txData.functionCalled = getFunctionNameFromSelector(
                call.selector,
                targetNetwork.network,
              );
            }

            txCalls.push(_txData);
          }
        }

        // Apply filtering logic AFTER processing all transaction data
        let shouldIncludeTransaction = true;
        if (
          (bySenderAddress || "").toLowerCase() !== "" ||
          (byReceiverAddress || "").toLowerCase() !== ""
        ) {
          shouldIncludeTransaction = false;

          // Check sender address filter
          const matchesSender = !!bySenderAddress
            ? checkSanitizedEquals(
                explorerEntry.fromAddress || "",
                bySenderAddress,
              )
            : true;

          // Check receiver address filter - need to check if any of the txCalls has matching toAddress
          const matchesReceiver = !!byReceiverAddress
            ? txCalls.filter((call) =>
                checkSanitizedEquals(call.toAddress || "", byReceiverAddress),
              ).length > 0
            : true;

          // If both filters are specified, it's a union (OR condition)
          // If only one filter is specified, check that one
          if (bySenderAddress && byReceiverAddress) {
            shouldIncludeTransaction = matchesSender || matchesReceiver;
          } else if (bySenderAddress) {
            shouldIncludeTransaction = matchesSender;
          } else if (byReceiverAddress) {
            shouldIncludeTransaction = matchesReceiver;
          }
        }

        if (shouldIncludeTransaction) {
          parsedTxns.push({
            ...explorerEntry,
            txCalls,
          });
        }
      }

      return parsedTxns;
    },
    [provider, targetNetwork.network, bySenderAddress, byReceiverAddress],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    totalBlocks,
    provider,
    processBlockToTxns,
    page,
    pageSize,
    bySenderAddress,
    byReceiverAddress,
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "fetchPaginatedTxns",
      totalBlocks,
      targetNetwork.rpcUrls.public.http[0],
      page,
      pageSize,
      bySenderAddress,
      byReceiverAddress,
    ],
    queryFn: fetchPaginatedTxns,
    enabled: !!totalBlocks && !!provider,
    staleTime: 5 * 1000, // 5 seconds
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
