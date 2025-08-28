"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";
import { useFetchTxnDetail } from "~~/hooks/scaffold-stark";

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

interface TransactionDetailsProps {
  params: Promise<{
    hash: string;
  }>;
}

export default function TransactionDetails({
  params,
}: TransactionDetailsProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Unwrap the params Promise
  const resolvedParams = use(params);

  // Fetch transaction details using the custom hook
  const { transactionDetail, isLoading, error } = useFetchTxnDetail(
    resolvedParams.hash,
  );

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

  // Helper function to format transaction fees
  const formatFee = (fee?: string) => {
    if (!fee) return "0";
    try {
      return friToStrk(BigInt(fee));
    } catch {
      return fee;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleString();
  };

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
          {/* Loading state */}
          {isLoading && (
            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-8">
              <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
                <span className="ml-4 text-lg">
                  Loading transaction details...
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-error text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-error mb-2">
                  Error Loading Transaction
                </h2>
                <p className="text-base-content/70 text-center max-w-md">
                  {error.message ||
                    "Failed to load transaction details. Please check the transaction hash and try again."}
                </p>
              </div>
            </div>
          )}

          {/* Transaction not found */}
          {!isLoading && !error && !transactionDetail && (
            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-warning text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-warning mb-2">
                  Transaction Not Found
                </h2>
                <p className="text-base-content/70 text-center max-w-md">
                  The transaction with hash{" "}
                  <code className="bg-base-200 px-2 py-1 rounded">
                    {resolvedParams.hash}
                  </code>{" "}
                  could not be found.
                </p>
              </div>
            </div>
          )}

          {/* Transaction details */}
          {!isLoading && !error && transactionDetail && (
            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-8">
              <div className="space-y-8">
                {/* Transaction Hash */}
                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Transaction Hash:
                  </label>
                  <div className="flex items-center">
                    <code className="text-base font-mono text-accent bg-base-200 px-3 py-2 rounded">
                      {transactionDetail.transactionHash}
                    </code>
                    <CopyButton
                      text={transactionDetail.transactionHash}
                      fieldName="hash"
                    />
                  </div>
                </div>

                {/* Transaction Type */}
                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Transaction Type:
                  </label>
                  <span className="text-base text-base-content font-mono bg-base-200 px-3 py-1 rounded w-fit">
                    {transactionDetail.type}
                  </span>
                </div>

                {/* Status */}
                <div className="flex flex-col space-y-2">
                  <label className="text-lg font-semibold text-base-content">
                    Status:
                  </label>
                  <span
                    className={`text-base px-3 py-1 rounded w-fit ${
                      transactionDetail.status === "SUCCEEDED"
                        ? "bg-success/20 text-success"
                        : transactionDetail.status === "REVERTED"
                          ? "bg-error/20 text-error"
                          : "bg-warning/20 text-warning"
                    }`}
                  >
                    {transactionDetail.status}
                  </span>
                </div>

                {/* Block Number */}
                {transactionDetail.blockNumber && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Block Number:
                    </label>
                    <span className="text-base text-base-content">
                      {transactionDetail.blockNumber}
                    </span>
                  </div>
                )}

                {/* Timestamp */}
                {transactionDetail.timestamp && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Timestamp:
                    </label>
                    <span className="text-base text-base-content">
                      {formatTimestamp(transactionDetail.timestamp)}
                    </span>
                  </div>
                )}

                {/* Sender Address */}
                {transactionDetail.senderAddress && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Sender Address:
                    </label>
                    <div className="flex items-center">
                      <Address
                        address={
                          transactionDetail.senderAddress as `0x${string}`
                        }
                        format="long"
                        size="base"
                      />
                      <CopyButton
                        text={transactionDetail.senderAddress}
                        fieldName="sender"
                      />
                    </div>
                  </div>
                )}

                {/* Contract Address (for deploy/deploy account) */}
                {transactionDetail.contractAddress && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Contract Address:
                    </label>
                    <div className="flex items-center">
                      <Address
                        address={
                          transactionDetail.contractAddress as `0x${string}`
                        }
                        format="long"
                        size="base"
                      />
                      <CopyButton
                        text={transactionDetail.contractAddress}
                        fieldName="contract"
                      />
                    </div>
                  </div>
                )}

                {/* Nonce */}
                {transactionDetail.nonce && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Nonce:
                    </label>
                    <span className="text-base text-base-content">
                      {transactionDetail.nonce}
                    </span>
                  </div>
                )}

                {/* Function Calls (for INVOKE transactions) */}
                {transactionDetail.functionCalls &&
                  transactionDetail.functionCalls.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-lg font-semibold text-base-content">
                        Function Calls:
                      </label>
                      <div className="space-y-4">
                        {transactionDetail.functionCalls.map((call, index) => (
                          <div
                            key={index}
                            className="bg-base-200 p-4 rounded-lg"
                          >
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-semibold text-base-content/70">
                                  Contract:
                                </span>
                                <div className="flex items-center mt-1">
                                  <Address
                                    address={
                                      call.contractAddress as `0x${string}`
                                    }
                                    format="long"
                                    size="sm"
                                  />
                                  <CopyButton
                                    text={call.contractAddress}
                                    fieldName={`contract-${index}`}
                                  />
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-base-content/70">
                                  Entrypoint:
                                </span>
                                <code className="text-sm text-accent bg-base-300 px-2 py-1 rounded ml-2">
                                  {call.entrypoint}
                                </code>
                              </div>
                              {call.calldata.length > 0 && (
                                <div>
                                  <span className="text-sm font-semibold text-base-content/70">
                                    Arguments:
                                  </span>
                                  <div className="mt-1 max-h-32 overflow-y-auto">
                                    {call.calldata.map((arg, argIndex) => (
                                      <div
                                        key={argIndex}
                                        className="text-xs font-mono text-base-content/60 break-all"
                                      >
                                        [{argIndex}] {arg}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Max Fee */}
                {transactionDetail.maxFee && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Max Fee:
                    </label>
                    <span className="text-base text-base-content">
                      {formatFee(transactionDetail.maxFee)} STRK
                    </span>
                  </div>
                )}

                {/* Actual Fee */}
                {transactionDetail.actualFee && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Actual Fee:
                    </label>
                    <span className="text-base text-base-content">
                      {formatFee(transactionDetail.actualFee)} STRK
                    </span>
                  </div>
                )}

                {/* Calldata (Raw) */}
                {transactionDetail.calldata &&
                  transactionDetail.calldata.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-lg font-semibold text-base-content">
                        Calldata:
                      </label>
                      <div className="relative">
                        <div className="bg-base-200 p-4 rounded-lg max-h-40 overflow-y-auto">
                          <div className="space-y-1">
                            {transactionDetail.calldata.map((data, index) => (
                              <div
                                key={index}
                                className="text-sm font-mono text-base-content break-all"
                              >
                                [{index}] {data}
                              </div>
                            ))}
                          </div>
                        </div>
                        <CopyButton
                          text={JSON.stringify(
                            transactionDetail.calldata,
                            null,
                            2,
                          )}
                          fieldName="calldata"
                        />
                      </div>
                    </div>
                  )}

                {/* Signature */}
                {transactionDetail.signature &&
                  transactionDetail.signature.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-lg font-semibold text-base-content">
                        Signature:
                      </label>
                      <div className="relative">
                        <div className="bg-base-200 p-4 rounded-lg max-h-32 overflow-y-auto">
                          <div className="space-y-1">
                            {transactionDetail.signature.map((sig, index) => (
                              <div
                                key={index}
                                className="text-sm font-mono text-base-content break-all"
                              >
                                [{index}] {sig}
                              </div>
                            ))}
                          </div>
                        </div>
                        <CopyButton
                          text={JSON.stringify(
                            transactionDetail.signature,
                            null,
                            2,
                          )}
                          fieldName="signature"
                        />
                      </div>
                    </div>
                  )}

                {/* Events */}
                {transactionDetail.events &&
                  transactionDetail.events.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-lg font-semibold text-base-content">
                        Events:
                      </label>
                      <div className="space-y-4">
                        {transactionDetail.events.map((event, index) => (
                          <div
                            key={index}
                            className="bg-base-200 p-4 rounded-lg"
                          >
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-semibold text-base-content/70">
                                  From Contract:
                                </span>
                                <div className="flex items-center mt-1">
                                  <Address
                                    address={
                                      event.from_address as `0x${string}`
                                    }
                                    format="long"
                                    size="sm"
                                  />
                                  <CopyButton
                                    text={event.from_address}
                                    fieldName={`event-from-${index}`}
                                  />
                                </div>
                              </div>
                              {event.keys.length > 0 && (
                                <div>
                                  <span className="text-sm font-semibold text-base-content/70">
                                    Keys:
                                  </span>
                                  <div className="mt-1 max-h-24 overflow-y-auto">
                                    {event.keys.map((key, keyIndex) => (
                                      <div
                                        key={keyIndex}
                                        className="text-xs font-mono text-base-content/60 break-all"
                                      >
                                        [{keyIndex}] {key}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {event.data.length > 0 && (
                                <div>
                                  <span className="text-sm font-semibold text-base-content/70">
                                    Data:
                                  </span>
                                  <div className="mt-1 max-h-24 overflow-y-auto">
                                    {event.data.map((data, dataIndex) => (
                                      <div
                                        key={dataIndex}
                                        className="text-xs font-mono text-base-content/60 break-all"
                                      >
                                        [{dataIndex}] {data}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Logs (simplified view) */}
                {transactionDetail.logs &&
                  transactionDetail.logs.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-lg font-semibold text-base-content">
                        Transaction Logs:
                      </label>
                      <div className="bg-base-200 p-4 rounded-lg max-h-40 overflow-y-auto">
                        <div className="space-y-1">
                          {transactionDetail.logs.map((log, index) => (
                            <div
                              key={index}
                              className="text-sm font-mono text-accent break-all"
                            >
                              [{index}] {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Execution Resources */}
                {transactionDetail.executionResources && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Execution Resources:
                    </label>
                    <div className="bg-base-200 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {transactionDetail.gasUsed && (
                          <div>
                            <span className="text-sm font-semibold text-base-content/70">
                              Steps:
                            </span>
                            <div className="text-base text-base-content">
                              {transactionDetail.gasUsed}
                            </div>
                          </div>
                        )}
                        {transactionDetail.l1GasConsumed && (
                          <div>
                            <span className="text-sm font-semibold text-base-content/70">
                              L1 Gas:
                            </span>
                            <div className="text-base text-base-content">
                              {transactionDetail.l1GasConsumed}
                            </div>
                          </div>
                        )}
                        {transactionDetail.l2GasConsumed && (
                          <div>
                            <span className="text-sm font-semibold text-base-content/70">
                              L2 Gas:
                            </span>
                            <div className="text-base text-base-content">
                              {transactionDetail.l2GasConsumed}
                            </div>
                          </div>
                        )}
                        {transactionDetail.executionResources
                          .builtin_instance_counter && (
                          <div className="md:col-span-2">
                            <span className="text-sm font-semibold text-base-content/70">
                              Built-in Counters:
                            </span>
                            <div className="text-xs font-mono text-base-content/60 mt-1">
                              {JSON.stringify(
                                transactionDetail.executionResources
                                  .builtin_instance_counter,
                                null,
                                2,
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Version */}
                {transactionDetail.version && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-base-content">
                      Version:
                    </label>
                    <span className="text-base text-base-content font-mono bg-base-200 px-3 py-1 rounded w-fit">
                      {transactionDetail.version}
                    </span>
                  </div>
                )}

                {/* Revert Reason (if applicable) */}
                {transactionDetail.revertReason && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg font-semibold text-error">
                      Revert Reason:
                    </label>
                    <div className="bg-error/10 border border-error/20 p-4 rounded-lg">
                      <code className="text-sm font-mono text-error break-all">
                        {transactionDetail.revertReason}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
