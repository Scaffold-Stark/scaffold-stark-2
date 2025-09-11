"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";
import { useFetchTxnDetail, useFetchEvents } from "~~/hooks/blockexplorer";

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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showRawEventData, setShowRawEventData] = useState(false);

  // Unwrap the params Promise
  const resolvedParams = use(params);

  // Fetch transaction details using the custom hook
  const { transactionDetail, isLoading, error } = useFetchTxnDetail(
    resolvedParams.hash,
  );

  // Fetch events for this transaction using the enhanced hook
  const { events: eventsData, isLoading: isEventsLoading } = useFetchEvents({
    transactionHash: resolvedParams.hash,
    pageSize: 50,
    page: 1,
  });

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

  const toggleEventExpansion = (eventId: string) => {
    const newExpandedEvents = new Set(expandedEvents);
    if (newExpandedEvents.has(eventId)) {
      newExpandedEvents.delete(eventId);
    } else {
      newExpandedEvents.add(eventId);
    }
    setExpandedEvents(newExpandedEvents);
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
                              {call.selector && (
                                <div>
                                  <span className="text-sm font-semibold text-base-content/70">
                                    Selector:
                                  </span>
                                  <div className="flex items-center mt-1">
                                    <code className="text-xs font-mono text-base-content bg-base-200 px-2 py-1 rounded break-all">
                                      {call.selector}
                                    </code>
                                    <CopyButton
                                      text={call.selector}
                                      fieldName={`selector-${index}`}
                                    />
                                  </div>
                                </div>
                              )}
                              {(call.calldata.length > 0 ||
                                (call.decodedArgs &&
                                  Object.keys(call.decodedArgs).length >
                                    0)) && (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-base-content/70">
                                      Arguments:
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-base-content/50">
                                        Raw Data:
                                      </span>
                                      <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-xs"
                                        checked={showRawEventData}
                                        onChange={(e) =>
                                          setShowRawEventData(e.target.checked)
                                        }
                                      />
                                    </div>
                                  </div>

                                  {showRawEventData ? (
                                    // Raw arguments display
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
                                  ) : call.decodedArgs &&
                                    Object.keys(call.decodedArgs).length > 0 ? (
                                    // Decoded arguments display
                                    <div className="bg-base-300 rounded-lg overflow-hidden">
                                      {/* Table Header */}
                                      <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-base-200 text-base-content/70 text-xs font-medium">
                                        <div className="col-span-3">INPUT</div>
                                        <div className="col-span-5">TYPE</div>
                                        <div className="col-span-4">DATA</div>
                                      </div>

                                      {/* Table Body */}
                                      <div className="divide-y divide-base-200/50">
                                        {Object.entries(call.decodedArgs).map(
                                          ([key, value], argIndex) => {
                                            // Format the display value
                                            const getDisplayValue = (
                                              val: any,
                                            ) => {
                                              if (typeof val === "bigint") {
                                                return `0x${val.toString(16)}`;
                                              }
                                              if (typeof val === "boolean") {
                                                return val ? "true" : "false";
                                              }
                                              if (typeof val === "string") {
                                                return val.startsWith("0x")
                                                  ? val
                                                  : `"${val}"`;
                                              }
                                              return String(val);
                                            };

                                            // Get the Cairo type from ABI or infer it
                                            const getCairoType = (
                                              val: any,
                                              paramName: string,
                                            ) => {
                                              if (
                                                call.argTypes &&
                                                call.argTypes[paramName]
                                              ) {
                                                return call.argTypes[paramName];
                                              }

                                              // Fallback to inference
                                              if (typeof val === "boolean") {
                                                return "core::bool";
                                              }
                                              if (typeof val === "string") {
                                                if (
                                                  val.startsWith("0x") &&
                                                  val.length === 66
                                                ) {
                                                  return "core::starknet::contract_address::ContractAddress";
                                                }
                                                if (val.startsWith("0x")) {
                                                  return "core::felt252";
                                                }
                                                return "core::byte_array::ByteArray";
                                              }
                                              if (typeof val === "bigint") {
                                                return "core::integer::u256";
                                              }
                                              return "core::felt252";
                                            };

                                            const displayValue =
                                              getDisplayValue(value);
                                            const cairoType = getCairoType(
                                              value,
                                              key,
                                            );
                                            const copyValue =
                                              typeof value === "bigint"
                                                ? `0x${value.toString(16)}`
                                                : String(value);

                                            return (
                                              <div
                                                key={argIndex}
                                                className="grid grid-cols-12 gap-4 px-3 py-2 hover:bg-base-100/50"
                                              >
                                                {/* INPUT Column */}
                                                <div className="col-span-3">
                                                  <span className="text-base-content font-medium text-xs">
                                                    {key}
                                                  </span>
                                                </div>

                                                {/* TYPE Column */}
                                                <div className="col-span-5">
                                                  <code className="text-orange-600 text-xs font-mono">
                                                    {cairoType}
                                                  </code>
                                                </div>

                                                {/* DATA Column */}
                                                <div className="col-span-4">
                                                  <div className="flex items-center space-x-1">
                                                    <code className="text-blue-600 text-xs font-mono break-all">
                                                      {displayValue}
                                                    </code>
                                                    <CopyButton
                                                      text={copyValue}
                                                      fieldName={`func-arg-${index}-${argIndex}`}
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    // Fallback: raw arguments display
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
                                  )}
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

                {/* Events - Enhanced Version */}
                {((eventsData && eventsData.length > 0) || isEventsLoading) && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-lg font-semibold text-base-content">
                        Events ({eventsData?.length || 0})
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-base-content/70">
                          Raw Data:
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={showRawEventData}
                          onChange={(e) =>
                            setShowRawEventData(e.target.checked)
                          }
                        />
                      </div>
                    </div>

                    {isEventsLoading ? (
                      <div className="bg-base-200 rounded-lg p-8">
                        <div className="flex items-center justify-center">
                          <div className="loading loading-spinner loading-lg"></div>
                          <span className="ml-4 text-base-content/70">
                            Loading events...
                          </span>
                        </div>
                      </div>
                    ) : eventsData && eventsData.length > 0 ? (
                      <div className="bg-base-200 rounded-lg overflow-hidden">
                        {/* Events Table */}
                        <div className="overflow-x-auto">
                          <table className="table w-full">
                            <thead>
                              <tr className="border-b border-base-300 bg-base-100">
                                <th className="text-left text-base-content/70 font-medium py-3 px-4">
                                  Name
                                </th>
                                <th className="text-left text-base-content/70 font-medium py-3 px-4">
                                  From Address
                                </th>
                                <th className="text-left text-base-content/70 font-medium py-3 px-4">
                                  Block Num.
                                </th>
                                <th className="text-left text-base-content/70 font-medium py-3 px-4">
                                  Event Index
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {eventsData.map((event, index) => {
                                const eventId = `${event.transactionHash}-${event.eventIndex}`;
                                const isExpanded = expandedEvents.has(eventId);

                                return (
                                  <React.Fragment key={eventId}>
                                    {/* Main Event Row */}
                                    <tr className="border-b border-base-300/30 hover:bg-base-50/50">
                                      <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() =>
                                              toggleEventExpansion(eventId)
                                            }
                                            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                                          >
                                            {isExpanded ? (
                                              <ChevronDownIcon className="h-4 w-4" />
                                            ) : (
                                              <ChevronRightIcon className="h-4 w-4" />
                                            )}
                                            <span className="font-medium">
                                              {event.eventName || "Event"}
                                            </span>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() =>
                                              router.push(
                                                `/blockexplorer/address/${event.contractAddress}`,
                                              )
                                            }
                                            className="text-blue-400 font-mono text-sm hover:text-blue-300 hover:underline transition-colors"
                                          >
                                            {`${event.contractAddress.slice(0, 6)}...${event.contractAddress.slice(-4)}`}
                                          </button>
                                          <CopyButton
                                            text={event.contractAddress}
                                            fieldName={`event-contract-${index}`}
                                          />
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className="text-blue-400 font-medium">
                                          {event.blockNumber}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className="text-base-content/70 text-sm">
                                          {event.eventIndex}
                                        </span>
                                      </td>
                                    </tr>

                                    {/* Expanded Event Arguments Row */}
                                    {isExpanded && (
                                      <tr className="bg-base-50/30">
                                        <td colSpan={4} className="py-4 px-4">
                                          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
                                            <div className="flex items-center justify-between mb-3">
                                              <h4 className="font-semibold text-base-content">
                                                Event Arguments
                                              </h4>
                                              <div className="flex items-center space-x-2">
                                                <span className="text-xs text-base-content/50">
                                                  {showRawEventData
                                                    ? "Raw"
                                                    : "Decoded"}
                                                </span>
                                              </div>
                                            </div>

                                            {showRawEventData ? (
                                              // Raw event data display
                                              <div className="space-y-3">
                                                <div className="flex flex-col space-y-1 border-b border-base-300/30 pb-2">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-base-content/70 text-sm">
                                                      keys:
                                                    </span>
                                                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                      array
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <code className="text-sm font-mono text-base-content bg-base-200 px-2 py-1 rounded break-all">
                                                      {JSON.stringify([
                                                        event.args.selector,
                                                        ...Object.keys(
                                                          event.args,
                                                        )
                                                          .filter((k) =>
                                                            k.startsWith("key"),
                                                          )
                                                          .map(
                                                            (k) =>
                                                              event.args[k],
                                                          ),
                                                      ])}
                                                    </code>
                                                    <CopyButton
                                                      text={JSON.stringify([
                                                        event.args.selector,
                                                        ...Object.keys(
                                                          event.args,
                                                        )
                                                          .filter((k) =>
                                                            k.startsWith("key"),
                                                          )
                                                          .map(
                                                            (k) =>
                                                              event.args[k],
                                                          ),
                                                      ])}
                                                      fieldName={`event-keys-${index}`}
                                                    />
                                                  </div>
                                                </div>
                                                <div className="flex flex-col space-y-1">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-base-content/70 text-sm">
                                                      data:
                                                    </span>
                                                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                      array
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <code className="text-sm font-mono text-base-content bg-base-200 px-2 py-1 rounded break-all">
                                                      {JSON.stringify(
                                                        Object.keys(event.args)
                                                          .filter((k) =>
                                                            k.startsWith(
                                                              "data",
                                                            ),
                                                          )
                                                          .map(
                                                            (k) =>
                                                              event.args[k],
                                                          ),
                                                      )}
                                                    </code>
                                                    <CopyButton
                                                      text={JSON.stringify(
                                                        Object.keys(event.args)
                                                          .filter((k) =>
                                                            k.startsWith(
                                                              "data",
                                                            ),
                                                          )
                                                          .map(
                                                            (k) =>
                                                              event.args[k],
                                                          ),
                                                      )}
                                                      fieldName={`event-data-${index}`}
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ) : // Decoded event arguments display using parsedArgs from the new implementation
                                            Object.keys(event.parsedArgs)
                                                .length > 0 &&
                                              !Object.keys(
                                                event.parsedArgs,
                                              ).every(
                                                (key) =>
                                                  key.startsWith("key") ||
                                                  key.startsWith("data"),
                                              ) ? (
                                              <div className="bg-base-200 rounded-lg overflow-hidden">
                                                {/* Table Header */}
                                                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-base-300 text-base-content/70 text-sm font-medium">
                                                  <div className="col-span-3">
                                                    INPUT
                                                  </div>
                                                  <div className="col-span-5">
                                                    TYPE
                                                  </div>
                                                  <div className="col-span-4">
                                                    DATA
                                                  </div>
                                                </div>

                                                {/* Table Body */}
                                                <div className="divide-y divide-base-300/50">
                                                  {Object.entries(
                                                    event.parsedArgs,
                                                  ).map(
                                                    (
                                                      [key, value],
                                                      argIndex,
                                                    ) => {
                                                      // Format the display value
                                                      const getDisplayValue = (
                                                        val: any,
                                                      ) => {
                                                        if (
                                                          typeof val ===
                                                          "bigint"
                                                        ) {
                                                          // Convert to hex for display
                                                          return `0x${val.toString(16)}`;
                                                        }
                                                        if (
                                                          typeof val ===
                                                          "boolean"
                                                        ) {
                                                          return val
                                                            ? "true"
                                                            : "false";
                                                        }
                                                        if (
                                                          typeof val ===
                                                          "string"
                                                        ) {
                                                          // If it's already hex, keep it, otherwise convert
                                                          return val.startsWith(
                                                            "0x",
                                                          )
                                                            ? val
                                                            : `"${val}"`;
                                                        }
                                                        return String(val);
                                                      };

                                                      // Get the Cairo type from ABI or infer it
                                                      const getCairoType = (
                                                        val: any,
                                                        paramName: string,
                                                      ) => {
                                                        // First try to get the actual ABI type
                                                        if (
                                                          event.argTypes &&
                                                          event.argTypes[
                                                            paramName
                                                          ]
                                                        ) {
                                                          return event.argTypes[
                                                            paramName
                                                          ];
                                                        }

                                                        // Fallback to inference
                                                        if (
                                                          typeof val ===
                                                          "boolean"
                                                        ) {
                                                          return "core::bool";
                                                        }
                                                        if (
                                                          typeof val ===
                                                          "string"
                                                        ) {
                                                          if (
                                                            val.startsWith(
                                                              "0x",
                                                            ) &&
                                                            val.length === 66
                                                          ) {
                                                            return "core::starknet::contract_address::ContractAddress";
                                                          }
                                                          if (
                                                            val.startsWith("0x")
                                                          ) {
                                                            return "core::felt252";
                                                          }
                                                          return "core::byte_array::ByteArray";
                                                        }
                                                        if (
                                                          typeof val ===
                                                          "bigint"
                                                        ) {
                                                          return "core::integer::u256";
                                                        }
                                                        return "core::felt252";
                                                      };

                                                      const displayValue =
                                                        getDisplayValue(value);
                                                      const cairoType =
                                                        getCairoType(
                                                          value,
                                                          key,
                                                        );
                                                      const copyValue =
                                                        typeof value ===
                                                        "bigint"
                                                          ? `0x${value.toString(16)}`
                                                          : String(value);

                                                      return (
                                                        <div
                                                          key={argIndex}
                                                          className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-base-100/50"
                                                        >
                                                          {/* INPUT Column */}
                                                          <div className="col-span-3">
                                                            <span className="text-base-content font-medium">
                                                              {key}
                                                            </span>
                                                          </div>

                                                          {/* TYPE Column */}
                                                          <div className="col-span-5">
                                                            <code className="text-orange-600 text-sm font-mono">
                                                              {cairoType}
                                                            </code>
                                                          </div>

                                                          {/* DATA Column */}
                                                          <div className="col-span-4">
                                                            <div className="flex items-center space-x-2">
                                                              <code className="text-blue-600 text-sm font-mono break-all">
                                                                {displayValue}
                                                              </code>
                                                              <CopyButton
                                                                text={copyValue}
                                                                fieldName={`event-arg-${index}-${argIndex}`}
                                                              />
                                                            </div>
                                                          </div>
                                                        </div>
                                                      );
                                                    },
                                                  )}
                                                </div>
                                              </div>
                                            ) : Object.keys(event.parsedArgs)
                                                .length > 0 ? (
                                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                <p className="text-amber-800 text-sm mb-2">
                                                  <strong>
                                                    Raw event data (ABI decoding
                                                    unavailable):
                                                  </strong>
                                                </p>
                                                <div className="space-y-2">
                                                  {Object.entries(
                                                    event.parsedArgs,
                                                  ).map(
                                                    (
                                                      [key, value],
                                                      argIndex,
                                                    ) => (
                                                      <div
                                                        key={argIndex}
                                                        className="flex items-center justify-between"
                                                      >
                                                        <span className="text-amber-700 font-mono text-sm">
                                                          {key}:
                                                        </span>
                                                        <code className="text-amber-900 bg-amber-100 px-2 py-1 rounded text-sm">
                                                          {String(value)}
                                                        </code>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-base-content/50 text-sm">
                                                No decoded arguments available
                                                for this event
                                              </p>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-base-200 rounded-lg p-8">
                        <div className="text-center">
                          <div className="text-6xl mb-4">⚡</div>
                          <h3 className="text-xl font-semibold text-base-content mb-2">
                            No Events Found
                          </h3>
                          <p className="text-base-content/70">
                            This transaction has no events.
                          </p>
                        </div>
                      </div>
                    )}
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
