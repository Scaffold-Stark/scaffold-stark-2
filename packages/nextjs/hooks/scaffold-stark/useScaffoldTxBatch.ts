import { useState, useEffect, useMemo } from "react";
import { useTargetNetwork } from "./useTargetNetwork"; // Asegúrate de que la ruta sea correcta
import { BigNumberish, RpcProvider } from "starknet";

export const useScaffoldTxBatch = ({
  startBlock,
  endBlock,
  watch = false,
  enabled = true,
}: {
  startBlock: number;
  endBlock: number;
  watch?: boolean;
  enabled?: boolean;
}) => {
  const [transactionCounts, setTransactionCounts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { targetNetwork } = useTargetNetwork();

  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  useEffect(() => {
    const fetchTransactionsForRange = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const counts: number[] = [];
        for (
          let blockNumber = startBlock;
          blockNumber <= endBlock;
          blockNumber++
        ) {
          const block = await publicClient.getBlockWithTxHashes(blockNumber);
          if (block && "transactions" in block) {
            counts.push(block.transactions.length);
          } else {
            counts.push(0); // Si el bloque no tiene transacciones, agregar 0
          }
        }
        setTransactionCounts(counts);
      } catch (error) {
        setError(`Error fetching transactions: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (enabled) {
      fetchTransactionsForRange();
      if (watch) {
        const interval = setInterval(fetchTransactionsForRange, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [enabled, startBlock, endBlock, watch, publicClient]);

  return {
    transactionCounts,
    isLoading,
    error,
  };
};
