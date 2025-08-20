"use client";

import React, { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";

// Helper function to convert ETH to wei (BigInt)
const strkToFri = (ethAmount: string): bigint => {
  const ethValue = parseFloat(ethAmount);
  return BigInt(Math.round(ethValue * 1e18));
};

// Helper function to format wei to readable ETH
const friToStrk = (weiValue: bigint): string => {
  const ethValue = Number(weiValue) / 1e18;
  return ethValue.toFixed(4).replace(/\.?0+$/, "");
};

// Mock transaction data for demonstration
const MOCK_TRANSACTIONS = [
  {
    hash: "0x085c99f207072c56b2a4c82e2844b217f3bc6b8fc54f6f0b9e5f3d5b3e8c2072",
    functionCalled: "setGreeting",
    selector: "0xa4136862",
    blockNumber: 3,
    timeMined: "8/20/2025, 3:15:06 PM",
    from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    to: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    value: strkToFri("1.2"),
  },
  {
    hash: "0xbd1a5d4f8a3c5e6b7d8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b024c",
    functionCalled: "0x60e06040",
    selector: "",
    blockNumber: 1,
    timeMined: "8/20/2025, 3:13:12 PM",
    from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    to: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    value: strkToFri("0.1"),
    isContractCreation: true,
  },
  {
    hash: "0x123a456b789c012d345e678f901a234b567c890d123e456f789a012b345c456b",
    functionCalled: "transfer",
    selector: "0x83afd3f4",
    blockNumber: 5,
    timeMined: "8/20/2025, 3:17:22 PM",
    from: "0x8ba1f109551bD432803012645Ac136ddd64DfC1234",
    to: "0x9cde489c8a1d30a4af8b2c5e7d3b6f0a1c2d3e4f5678",
    value: strkToFri("0.5"),
  },
  {
    hash: "0x789c012d345e678f901a234b567c890d123e456f789a012b345c678d901edef0",
    functionCalled: "approve",
    selector: "0x095ea7b3",
    blockNumber: 7,
    timeMined: "8/20/2025, 3:19:45 PM",
    from: "0xabcdef1234567890abcdef1234567890abcdefgh",
    to: "0x1234567890abcdef1234567890abcdef12345678",
    value: strkToFri("0.1"),
  },
  {
    hash: "0xfed4321a098b765c432d1f0e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f321a",
    functionCalled: "mint",
    selector: "0x40c10f19",
    blockNumber: 9,
    timeMined: "8/20/2025, 3:21:33 PM",
    from: "0x987654321098765432109876543210987654321",
    to: "0xfedcba0987654321fedcba0987654321fedcba98",
    value: strkToFri("2.1"),
  },
  {
    hash: "0xabcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234",
    functionCalled: "burn",
    selector: "0x42966c68",
    blockNumber: 11,
    timeMined: "8/20/2025, 3:23:18 PM",
    from: "0x1111222233334444555566667777888899990000",
    to: "0x3333444455556666777788889999000011112222",
    value: strkToFri("0.8"),
  },
  {
    hash: "0x56789abc012d345e678f901a234b567c890d123e456f789a012b345c678d9abc",
    functionCalled: "swap",
    selector: "0x128acb08",
    blockNumber: 13,
    timeMined: "8/20/2025, 3:25:07 PM",
    from: "0x5555666677778888999900001111222233334444",
    to: "0x7777888899990000111122223333444455556666",
    value: strkToFri("1.0"),
  },
  {
    hash: "0xdef01234567890def01234567890def01234567890def01234567890def01234",
    functionCalled: "stake",
    selector: "0x3fb5c1cb",
    blockNumber: 15,
    timeMined: "8/20/2025, 3:27:42 PM",
    from: "0x9999aaaa0000bbbb1111cccc2222dddd3333eeee",
    to: "0xbbbbcccc2222dddd3333eeee4444ffff5555aaaa",
    value: strkToFri("5.0"),
  },
  {
    hash: "0x2468acef13579bdf2468acef13579bdf2468acef13579bdf2468acef13579acef",
    functionCalled: "unstake",
    selector: "0x2e17de78",
    blockNumber: 17,
    timeMined: "8/20/2025, 3:29:15 PM",
    from: "0xddddeeee4444ffff5555aaaa6666bbbb7777cccc",
    to: "0xffff0000aaaa1111bbbb2222cccc3333dddd0000",
    value: strkToFri("3.2"),
  },
  {
    hash: "0x13579bdf2468acef13579bdf2468acef13579bdf2468acef13579bdf2468a9bdf",
    functionCalled: "delegate",
    selector: "0x5c19a95c",
    blockNumber: 19,
    timeMined: "8/20/2025, 3:31:28 PM",
    from: "0x1a2b3c4d5e6f789012345678901a2b3c4d5e6f78",
    to: "0x5e6f78901a2b3c4d5e6f78901a2b3c4d5e6f7890",
    value: strkToFri("0.1"),
  },
];

const ITEMS_PER_PAGE = 5;

export default function BlockExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Filter transactions based on search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return MOCK_TRANSACTIONS;

    return MOCK_TRANSACTIONS.filter(
      (tx) =>
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.functionCalled.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

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

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by hash or address"
                className="w-full bg-input rounded-lg pl-12 pr-4 py-4 text-base placeholder:text-base-content/60 text-base-content border-0 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-base-content/60" />
            </div>
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-secondary hover:bg-secondary/80 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Transaction Table */}
          <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden border border-base-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-base-200/50 border-b border-base-300">
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Transaction Hash
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Function Called
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Block Number
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Time Mined
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      From
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      To
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-base-content">
                      Value
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
                          <code className="text-sm font-mono text-accent">
                            {tx.hash.slice(0, 5)}...{tx.hash.slice(-5)}
                          </code>
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
                        <div className="flex flex-col">
                          {tx.isContractCreation ? (
                            <span className="font-medium text-base-content">
                              Contract Creation
                            </span>
                          ) : (
                            <span className="font-medium text-base-content">
                              {tx.functionCalled}
                            </span>
                          )}
                          {tx.selector && (
                            <code className="text-xs text-base-content/60 mt-1">
                              {tx.selector}
                            </code>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-base-content">
                          {tx.blockNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-base-content/80">
                          {tx.timeMined}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1">
                          <Address
                            address={`0x${parseInt(tx.from).toString(16)}`}
                            size="sm"
                            disableAddressLink
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1">
                          <Address
                            address={tx.to as `0x${string}`}
                            size="sm"
                            disableAddressLink
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-base-content">
                            {friToStrk(tx.value)} STRK
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-base-200/30 px-6 py-4 border-t border-base-300">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/70">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length} transactions
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
          </div>

          {/* No results message */}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-base-content/60 text-lg">
                No transactions found matching your search.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
