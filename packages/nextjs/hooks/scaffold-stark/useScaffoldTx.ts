import { useEffect, useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { BigNumberish, RpcProvider } from "starknet";

/**
 * Hook to fetch transactions and transaction count for a specific block in StarkNet
 * @param blockNumber - The block number to fetch transactions from
 * @param watch - If true, updates transactions every pollingInterval milliseconds
 * @param enabled - If false, disables the hook
 */
export const useDataTransaction = ({
  blockNumber,
  watch = false,
  enabled = true,
}: {
  blockNumber?: number;
  watch?: boolean;
  enabled?: boolean;
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [transactionCount, setTransactionCount] = useState<number | undefined>(undefined);
  const [starknetVersion, setStarknetVersion] = useState<string | undefined>(undefined);

  const { targetNetwork } = useTargetNetwork();

  // Initialize the provider with the RPC node URL
  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  // Function to fetch transactions from a specific block
  const fetchTransactionsFromBlock = async (blockNumber: number) => {
    setIsLoading(true);
    setError(undefined); // Clear previous errors

    try {
      console.log("Fetching Block Number:", blockNumber);

      // Fetch the block with transaction hashes
      const block = await publicClient.getBlockWithTxHashes(blockNumber);

      if (block) {
        console.log("Block data:", block);

        if ("transactions" in block) {
          const count = block.transactions.length;
          console.log(`Found ${count} transactions in block ${blockNumber}`);
          setTransactions(block.transactions);
          setTransactionCount(count); // Set transaction count

          // Extract StarkNet version if available
          if ("starknet_version" in block) {
            setStarknetVersion(block.starknet_version);
          } else {
            console.warn("StarkNet version is not available.");
          }
        } else {
          throw new Error(`Block ${blockNumber} does not contain any transactions.`);
        }
      } else {
        throw new Error(`Block ${blockNumber} not found.`);
      }
    } catch (e: any) {
      console.error("Error fetching transactions:", e);
      setError(e.message || "Unknown error occurred while fetching transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && blockNumber !== undefined) {
      console.log("Fetching data for block:", blockNumber);
      fetchTransactionsFromBlock(blockNumber);

      if (watch) {
        const interval = setInterval(() => {
          console.log("Polling block data for block:", blockNumber);
          fetchTransactionsFromBlock(blockNumber);
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
      }
    }
  }, [enabled, publicClient, watch, blockNumber]);

  return {
    transactions,
    transactionCount: transactionCount || transactions.length,
    starknetVersion,
    isLoading,
    error,
  };
}