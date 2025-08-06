import { useMemo, useState, useEffect, useCallback } from "react";
import { RpcProvider } from "starknet";
import { useTargetNetwork } from "./useTargetNetwork";
import { fetchPrice } from "~~/services/web3/PriceService";

interface BlockData {
  transaction: number;
  blockStatus: string | undefined;
  blockNumber: number;
  blockHash: string;
  blockVersion: string;
  blockTimestamp: number;
  blockTransactions: string[];
  parentBlockHash: string;
  totalTransactions: number;
  tps: number | null;
  gasprice: string;
  gaspricefri: string;
  timeDiff: number | null;
  averageFeeUSD: string;
}

/**
 * Fetches detailed block data for a specific block number, including transaction statistics and network metrics.
 * This hook retrieves comprehensive information about a block including transaction count, gas prices,
 * TPS (transactions per second), average fees in USD, and other block metadata.
 *
 * @param blockNumber - The block number to fetch data for
 * @returns {Object} An object containing:
 *   - blockData: BlockData | null - The fetched block data with transaction stats and network metrics, or null if not loaded
 *   - error: string | null - Any error encountered during data fetching, or null if successful
 *   - refetch: () => void - Function to manually refetch the block data
 *   - isEnabled: boolean - Boolean indicating if automatic fetching is enabled
 *   - toggleFetching: () => void - Function to toggle automatic fetching on/off
 * @see {@link https://scaffoldstark.com/docs/hooks/useDataTransaction}
 */
export const useDataTransaction = (blockNumber: number) => {
  const { targetNetwork } = useTargetNetwork();
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  const getEstimatedTxTime = useCallback(
    async (blockIdentifier: number): Promise<number | null> => {
      try {
        if (blockIdentifier <= 0) {
          // No previous block exists
          return null;
        }

        const currentBlock = await publicClient.getBlock(blockIdentifier);
        const prevBlockNumber = blockIdentifier - 1;
        const prevBlock = await publicClient.getBlock(prevBlockNumber);

        if (!currentBlock || !prevBlock) {
          return null;
        }

        return currentBlock.timestamp - prevBlock.timestamp;
      } catch (error) {
        console.error("Error on getting estimated time:", error);
        return null;
      }
    },
    [publicClient],
  );

  const calculateAverageFee = useCallback(
    async (blockIdentifier: number): Promise<number> => {
      try {
        const blockTxHashes =
          await publicClient.getBlockWithTxHashes(blockIdentifier);
        const txHashes = blockTxHashes.transactions;

        if (!txHashes || txHashes.length === 0) return 0;

        let totalFeeFri = BigInt(0);
        for (const txHash of txHashes) {
          const receipt: any = await publicClient.getTransactionReceipt(txHash);
          if (receipt?.actual_fee) {
            totalFeeFri += BigInt(receipt.actual_fee.amount);
          }
        }

        const totalFee = Number(totalFeeFri) / 1e18;

        const starkPriceInUSD = await fetchPrice();

        const averageFeeUSD = (totalFee * starkPriceInUSD) / txHashes.length;

        return averageFeeUSD;
      } catch (error) {
        console.error("Error calculating average fee:", error);
        return 0;
      }
    },
    [publicClient],
  );

  const fetchBlockData = useCallback(async () => {
    try {
      setError(null);
      const currentBlock = await publicClient.getBlock(blockNumber);

      const prevBlockNumber = blockNumber - 1;
      let tps: number | null = null;

      if (prevBlockNumber >= 0) {
        const prevBlock = await publicClient.getBlock(prevBlockNumber);
        if (currentBlock && prevBlock) {
          const currentTxCount = currentBlock.transactions?.length || 0;
          const timeDiffBetweenBlocks =
            currentBlock.timestamp - prevBlock.timestamp;

          tps =
            timeDiffBetweenBlocks > 0
              ? currentTxCount / timeDiffBetweenBlocks
              : null;
        }
      }

      const timeDiff = await getEstimatedTxTime(blockNumber);
      const averageFeeUSD = await calculateAverageFee(blockNumber);

      const data: BlockData = {
        transaction: currentBlock.transactions?.length || 0,
        blockStatus: currentBlock.status,
        blockNumber: blockNumber,
        blockHash: currentBlock.sequencer_address,
        blockVersion: currentBlock.starknet_version,
        blockTimestamp: currentBlock.timestamp,
        blockTransactions: currentBlock.transactions || [],
        parentBlockHash: currentBlock.parent_hash,
        totalTransactions: currentBlock.transactions?.length || 0,
        tps,
        gasprice: currentBlock.l1_gas_price.price_in_wei,
        gaspricefri: currentBlock.l1_gas_price.price_in_fri,
        timeDiff: timeDiff !== null ? timeDiff : null,
        averageFeeUSD: averageFeeUSD.toFixed(4),
      };

      setBlockData(data);
    } catch (e: any) {
      console.error("Error fetching block data:", e);
      setError(e.message || "Failed to fetch block data");
    }
  }, [publicClient, getEstimatedTxTime, calculateAverageFee, blockNumber]);

  useEffect(() => {
    if (isEnabled) {
      fetchBlockData();
    }
  }, [fetchBlockData, isEnabled]);

  const toggleFetching = () => {
    setIsEnabled((prev) => !prev);
  };

  return {
    blockData,
    error,
    refetch: fetchBlockData,
    isEnabled,
    toggleFetching,
  };
};
