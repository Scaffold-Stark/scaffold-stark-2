"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "~~/components/scaffold-stark";
import { useFetchAllTxns } from "~~/hooks/blockexplorer/useFetchAllTxns";
import { TxnEntry, getTimeAgo } from "~~/utils/blockexplorer";
import {
  TransactionTable,
  LoadingState,
  Pagination,
  EmptyState,
} from "./_components";

const ITEMS_PER_PAGE = 5;

export default function BlockExplorer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { txns, totalTxns, totalPages, isLoading, hasMore } = useFetchAllTxns({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });

  // Transform data from the hook into our TxnEntry format
  const currentTransactions = useMemo(() => {
    return txns.map((tx): TxnEntry => {
      const isDeploy = tx.txCalls.some(
        (call) => (call.functionCalled || "") === "Deploy Contract",
      );

      return {
        hash: tx.transactionHash || "",
        blockNumber: tx.blockNumber || 0,
        timeMined: new Date((tx.timestamp || 0) * 1000).toLocaleString() || "",
        from: tx.fromAddress || "",
        status:
          (tx.txReceipt as any)?.execution_status ||
          (tx.txReceipt as any)?.finality_status ||
          "UNKNOWN",
        type: isDeploy ? "DEPLOY" : tx.txInstance?.type || "UNKNOWN",
        age: getTimeAgo(tx.timestamp || 0),
        calls: tx.txCalls.map((call) => call.functionCalled || ""),
        isDeploy,
      };
    });
  }, [txns]);

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => {
        setCopiedHash(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const goToPage = (page: number) => setCurrentPage(page);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* Header with gradient background */}
      <div className="bg-primary py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-content mb-8">
            Block Explorer
          </h1>

          {/* Search Bar - Left aligned */}
          <div className="flex justify-start">
            <SearchBar
              placeholder="Search by transaction hash or contract address..."
              className="w-full max-w-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <LoadingState
              message="Loading Transactions"
              currentPage={currentPage}
            />
          )}

          {/* Transaction Table */}
          {!isLoading && (
            <>
              <TransactionTable
                transactions={currentTransactions}
                copiedHash={copiedHash}
                onCopyHash={handleCopyHash}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalTxns}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={goToPage}
              />
            </>
          )}

          {/* No results message */}
          {!isLoading && currentTransactions.length === 0 && (
            <EmptyState
              title="No transactions found"
              description="There are no transactions available in the current network."
            />
          )}
        </div>
      </div>
    </div>
  );
}
