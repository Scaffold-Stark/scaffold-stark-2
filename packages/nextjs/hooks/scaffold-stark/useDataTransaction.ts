import { useMemo, useState, useEffect, useCallback } from "react";
import { RpcProvider } from "starknet";
import { useTargetNetwork } from "./useTargetNetwork";

interface BlockData {
  transaction: number;
  blockStatus: string;
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

        let totalFeeWei = BigInt(0);
        for (const txHash of txHashes) {
          const receipt: any = await publicClient.getTransactionReceipt(txHash);
          if (receipt?.actual_fee) {
            totalFeeWei += BigInt(receipt.actual_fee.amount);
          }
        }

        const totalFeeEther = Number(totalFeeWei) / 1e18;

        const fetchEthPrice = async () => {
          try {
            const response = await fetch(
              "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            );
            const data = await response.json();
            return data.ethereum.usd;
          } catch (error) {
            console.error("Error fetching ETH price:", error);
            return 4000;
          }
        };

        const ethPriceInUSD = await fetchEthPrice();

        const averageFeeUSD = (totalFeeEther * ethPriceInUSD) / txHashes.length;

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
