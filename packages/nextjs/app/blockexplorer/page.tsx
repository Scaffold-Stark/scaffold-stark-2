"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";
import { useFetchAllTxns } from "~~/hooks/scaffold-stark/useFetchAllTxns";

// Type definition for transaction data
interface TxnEntry {
  hash: string;
  blockNumber: number;
  timeMined: string;
  from: string;
  status: string;
  type: string;
  age: string;
  calls: string[];
}

// Helper function to calculate time difference in a readable format
const getTimeAgo = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACCEPTED_ON_L2":
    case "SUCCEEDED":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "REJECTED":
    case "REVERTED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Helper function to get type badge styling
const getTypeBadge = (type: string) => {
  switch (type) {
    case "INVOKE":
    case "INVOKE_FUNCTION":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "DEPLOY":
    case "DEPLOY_ACCOUNT":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "DECLARE":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const ITEMS_PER_PAGE = 5;

export default function BlockExplorer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { txns, totalTxns, totalPages, isLoading, hasMore } = useFetchAllTxns({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });

  // Transform data from the hook into our TxnEntry format
  debugger;
  const currentTransactions = useMemo(
    () =>
      txns.map(
        (tx): TxnEntry => ({
          hash: tx.transactionHash || "",
          blockNumber: tx.blockNumber || 0,
          timeMined:
            new Date((tx.timestamp || 0) * 1000).toLocaleString() || "",
          from: tx.fromAddress || "",
          status:
            (tx.txReceipt as any)?.execution_status ||
            (tx.txReceipt as any)?.finality_status ||
            "UNKNOWN",
          type: tx.txInstance?.type || "UNKNOWN",
          age: getTimeAgo(tx.timestamp || 0),
          calls: tx.txCalls.map((call) => call.functionCalled || ""),
        }),
      ),
    [txns],
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* Header with gradient background */}
      <div className="bg-primary py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-content mb-8">
            Block Explorer
          </h1>
          <p className="text-primary-content/80 text-lg">
            Explore recent transactions on the Starknet network
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="bg-base-100 rounded-lg shadow-lg p-8 border border-base-300">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <h3 className="text-lg font-semibold text-base-content">
                  Loading Transactions
                </h3>
                <p className="text-base-content/60 text-center">
                  {currentPage === 1
                    ? "Fetching transaction data from the blockchain..."
                    : `Loading page ${currentPage}...`}
                </p>
              </div>
            </div>
          )}

          {/* Transaction Table */}
          {!isLoading && (
            <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden border border-base-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-base-200/50 border-b border-base-300">
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Transaction Hash
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Block Number
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Type
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Calls
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Address
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-base-content">
                        Age
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map((tx, index) => (
                      <tr
                        key={tx.hash}
                        className="border-b border-base-300 hover:bg-base-200/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/blockexplorer/tx/${tx.hash}`}
                              className="text-sm font-mono text-blue-500 hover:text-blue-600 transition-colors"
                            >
                              {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                            </Link>
                            <button
                              onClick={() => handleCopyHash(tx.hash)}
                              className="p-1 rounded hover:bg-base-300/50 transition-colors"
                              title="Copy transaction hash"
                            >
                              {copiedHash === tx.hash ? (
                                <CheckIcon className="h-4 w-4 text-success" />
                              ) : (
                                <DocumentDuplicateIcon className="h-4 w-4 text-base-content/60 hover:text-base-content" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-blue-500 hover:text-blue-600 cursor-pointer">
                            {tx.blockNumber}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(tx.status)}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(tx.type)}`}
                          >
                            {tx.type === "INVOKE" ? "INVOKE_FUNCTION" : tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-base-content/80">
                            {tx.calls
                              .map((call) =>
                                call.length > 20
                                  ? `${call.slice(0, 15)}...`
                                  : call,
                              )
                              .join(", ")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-1">
                            {tx.from ? (
                              <Address
                                address={tx.from as `0x${string}`}
                                size="sm"
                              />
                            ) : (
                              <span className="text-sm text-base-content/80">
                                N/A
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-base-content/80">
                            {tx.age}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-base-200/30 px-6 py-4 border-t border-base-300">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-base-content/70">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalTxns)} of{" "}
                      {totalTxns}+ transactions
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md bg-base-100 border border-base-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-base-200 transition-colors"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>

                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = index + 1;
                          } else if (currentPage <= 3) {
                            pageNum = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + index;
                          } else {
                            pageNum = currentPage - 2 + index;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? "bg-secondary text-secondary-content"
                                  : "bg-base-100 border border-base-300 hover:bg-base-200 text-base-content"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md bg-base-100 border border-base-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-base-200 transition-colors"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results message */}
          {!isLoading && currentTransactions.length === 0 && (
            <div className="bg-base-100 rounded-lg shadow-lg p-8 border border-base-300">
              <div className="text-center py-8">
                <div className="text-base-content/60 text-lg mb-2">
                  No transactions found
                </div>
                <p className="text-base-content/40">
                  There are no transactions available in the current network.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
