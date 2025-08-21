"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";

// Helper function to convert STRK to fri (BigInt)
const strkToFri = (friAmount: string): bigint => {
  const strkValue = parseFloat(friAmount);
  return BigInt(Math.round(strkValue * 1e18));
};

// Helper function to format fri to readable STRK
const friToStrk = (friValue: bigint): string => {
  const strkValue = Number(friValue) / 1e18;
  return strkValue.toFixed(4).replace(/\.?0+$/, "");
};

// Mock transaction details data
const MOCK_TRANSACTION_DETAILS = {
  hash: "0x7020938dfa5121817945d9d2640971cadbf1f78ad30adfac6df70e21126890ce1",
  blockNumber: 4,
  from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  to: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  value: strkToFri("1.5"),
  functionCalled: "setGreeting(string _newGreeting = hello world)",
  selector: "0xa4136862",
  gasPrice: 1673320887,
  data: "0xa41368620000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000c68656c6c6f20776f726c6400000000000000000000000000000000000000000000000000000000000000000000",
  logs: [
    "0x94cbd7e04dca26a7667654f6448b2ca0a40fec60218dc5fd8c82b9cf3c645ad",
    "0x0000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
  ],
  timestamp: "2025-01-20T15:15:06Z",
  status: "Success",
  gasUsed: "21000",
  nonce: 42,
};

interface TransactionDetailsProps {
  params: {
    hash: string;
  };
}

export default function TransactionDetails({
  params,
}: TransactionDetailsProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const CopyButton = ({
    text,
    fieldName,
  }: {
    text: string;
    fieldName: string;
  }) => (
    <button
      onClick={() => handleCopy(text, fieldName)}
      className="p-1 rounded hover:bg-base-300/50 transition-colors ml-2"
      title={`Copy ${fieldName}`}
    >
      {copiedField === fieldName ? (
        <CheckIcon className="h-4 w-4 text-success" />
      ) : (
        <DocumentDuplicateIcon className="h-4 w-4 text-base-content/60 hover:text-base-content" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      {/* Header with gradient background */}
      <div className="bg-primary py-8 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-primary-content hover:text-primary-content/80 transition-colors mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>

          <h1 className="text-4xl font-bold text-primary-content">
            Transaction Details
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-8">
            <div className="space-y-8">
              {/* Transaction Hash */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Transaction Hash:
                </label>
                <div className="flex items-center">
                  <code className="text-base font-mono text-accent bg-base-200 px-3 py-2 rounded">
                    {MOCK_TRANSACTION_DETAILS.hash}
                  </code>
                  <CopyButton
                    text={MOCK_TRANSACTION_DETAILS.hash}
                    fieldName="hash"
                  />
                </div>
              </div>

              {/* Block Number */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Block Number:
                </label>
                <span className="text-base text-base-content">
                  {MOCK_TRANSACTION_DETAILS.blockNumber}
                </span>
              </div>

              {/* From Address */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  From:
                </label>
                <div className="flex items-center">
                  <Address
                    address={MOCK_TRANSACTION_DETAILS.from as `0x${string}`}
                    format="long"
                    size="base"
                  />
                  <CopyButton
                    text={MOCK_TRANSACTION_DETAILS.from}
                    fieldName="from"
                  />
                </div>
              </div>

              {/* To Address */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  To:
                </label>
                <div className="flex items-center">
                  <Address
                    address={MOCK_TRANSACTION_DETAILS.to as `0x${string}`}
                    format="long"
                    size="base"
                  />
                  <CopyButton
                    text={MOCK_TRANSACTION_DETAILS.to}
                    fieldName="to"
                  />
                </div>
              </div>

              {/* Value */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Value:
                </label>
                <span className="text-base text-base-content">
                  {friToStrk(MOCK_TRANSACTION_DETAILS.value)} STRK
                </span>
              </div>

              {/* Function Called */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Function called:
                </label>
                <div className="flex items-start">
                  <div className="flex flex-col space-y-1">
                    <span className="text-base text-base-content">
                      {MOCK_TRANSACTION_DETAILS.functionCalled}
                    </span>
                    <code className="text-sm text-base-content/60 bg-base-200 px-2 py-1 rounded w-fit">
                      {MOCK_TRANSACTION_DETAILS.selector}
                    </code>
                  </div>
                </div>
              </div>

              {/* Gas Price */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Gas Price:
                </label>
                <span className="text-base text-base-content">
                  {friToStrk(BigInt(MOCK_TRANSACTION_DETAILS.gasPrice))} STRK
                </span>
              </div>

              {/* Data */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Data:
                </label>
                <div className="relative">
                  <div className="bg-base-200 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <code className="text-sm font-mono text-base-content break-all whitespace-pre-wrap">
                      {MOCK_TRANSACTION_DETAILS.data}
                    </code>
                  </div>
                  <CopyButton
                    text={MOCK_TRANSACTION_DETAILS.data}
                    fieldName="data"
                  />
                </div>
              </div>

              {/* Logs */}
              <div className="flex flex-col space-y-2">
                <label className="text-lg font-semibold text-base-content">
                  Logs:
                </label>
                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-sm text-base-content">
                      Log 0 topics: [
                      {MOCK_TRANSACTION_DETAILS.logs.map((log, index) => (
                        <div key={index} className="ml-4">
                          <code className="text-sm font-mono text-accent">
                            &quot;{log}&quot;
                            {index < MOCK_TRANSACTION_DETAILS.logs.length - 1
                              ? ","
                              : ""}
                          </code>
                        </div>
                      ))}
                      ]
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-base-300">
                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Status:
                  </label>
                  <span
                    className={`text-base px-3 py-1 rounded w-fit ${
                      MOCK_TRANSACTION_DETAILS.status === "Success"
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {MOCK_TRANSACTION_DETAILS.status}
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Gas Used:
                  </label>
                  <span className="text-base text-base-content">
                    {MOCK_TRANSACTION_DETAILS.gasUsed}
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Nonce:
                  </label>
                  <span className="text-base text-base-content">
                    {MOCK_TRANSACTION_DETAILS.nonce}
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Timestamp:
                  </label>
                  <span className="text-base text-base-content">
                    {new Date(
                      MOCK_TRANSACTION_DETAILS.timestamp,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
