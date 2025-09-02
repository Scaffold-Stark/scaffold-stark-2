"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Address, Balance } from "~~/components/scaffold-stark";
import {
  useFetchAddressDetails,
  useFetchAllTxns,
  useFetchEvents,
} from "~~/hooks/blockexplorer";
import { useScaffoldStarkProfile } from "~~/hooks/scaffold-stark/useScaffoldStarkProfile";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";

interface AddressDetailsProps {
  params: Promise<{
    address: string;
  }>;
}

export default function AddressDetails({ params }: AddressDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showRawEventData, setShowRawEventData] = useState(false);

  // Unwrap the params Promise
  const resolvedParams = use(params);

  // Fetch address details using scaffold hooks
  const {
    addressDetails,
    isLoading: isAddressLoading,
    error: addressError,
  } = useFetchAddressDetails(resolvedParams.address as `0x${string}`);
  const { data: profileData, isLoading: isProfileLoading } =
    useScaffoldStarkProfile(resolvedParams.address as `0x${string}`);
  const { formatted: strkBalance, isLoading: isBalanceLoading } =
    useScaffoldStrkBalance({
      address: resolvedParams.address as `0x${string}`,
    });

  const { txns: transactionsData, isLoading: isTransactionsLoading } =
    useFetchAllTxns({
      page: 1,
      pageSize: 10,
      bySenderAddress: resolvedParams.address as `0x${string}`,
      byReceiverAddress: resolvedParams.address as `0x${string}`,
    });

  const { events: eventsData, isLoading: isEventsLoading } = useFetchEvents({
    address: resolvedParams.address,
    pageSize: 10,
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

  // Use fetched data or fallback to loading states
  const addressData = {
    contractAddress: resolvedParams.address,
    classHash: addressDetails.classHash || "Not available",
    strkBalance: strkBalance || "0",
    type: addressDetails.type,
    deployedByContractAddress:
      addressDetails.deployedByContractAddress || "Not available",
    deployedAtTransactionHash:
      addressDetails.deployedAtTransactionHash || "Not available",
    deployedAt: addressDetails.deployedAt || "Not available",
    classVersion: addressDetails.classVersion || "Unknown",
    profileName: profileData?.name || "",
  };

  const tabs = [
    { id: "overview", label: "Overview", count: null },
    {
      id: "transactions",
      label: "Transactions",
      count: transactionsData?.length || 0,
    },
    { id: "events", label: "Events", count: eventsData?.length || 0 },
  ];

  // Show error state if address details failed to load
  if (addressError) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
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
              Address Details
            </h1>
          </div>
        </div>
        <div className="flex-1 px-6 lg:px-10 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-error mb-2">
                  Error Loading Address Details
                </h3>
                <p className="text-base-content/70 mb-4">{addressError}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Starknet Profile (if available) */}
            {(profileData?.name || isProfileLoading) && (
              <div className="flex items-center justify-between py-4 border-b border-base-300">
                <div className="flex items-center">
                  <span className="text-base-content/70 mr-2">👤</span>
                  <span className="font-medium text-base-content">
                    Starknet Profile
                  </span>
                </div>
                <div className="flex items-center">
                  {isProfileLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : profileData?.name ? (
                    <div className="flex items-center">
                      {profileData.profilePicture && (
                        <Image
                          src={profileData.profilePicture}
                          alt="Profile"
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      )}
                      <span className="text-blue-400 font-medium">
                        {profileData.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base-content/70">
                      No profile found
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contract Address */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">📋</span>
                <span className="font-medium text-base-content">
                  Contract Address
                </span>
              </div>
              <div className="flex items-center">
                <code className="text-blue-400 font-mono text-sm">
                  {addressData.contractAddress}
                </code>
                <CopyButton
                  text={addressData.contractAddress}
                  fieldName="contract-address"
                />
              </div>
            </div>

            {/* Class Hash */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">🔗</span>
                <span className="font-medium text-base-content">
                  Class Hash
                </span>
              </div>
              <div className="flex items-center">
                {isAddressLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <code className="text-blue-400 font-mono text-sm">
                      {addressData.classHash}
                    </code>
                    {addressData.classHash !== "Not available" && (
                      <CopyButton
                        text={addressData.classHash}
                        fieldName="class-hash"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* STRK Balance */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">💰</span>
                <span className="font-medium text-base-content">
                  STRK Balance
                </span>
              </div>
              <div className="flex items-center">
                {isBalanceLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Balance
                      address={resolvedParams.address as `0x${string}`}
                      className="text-base-content"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">🏷️</span>
                <span className="font-medium text-base-content">Type</span>
              </div>
              <div className="flex items-center">
                {isAddressLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span
                    className={`text-white px-2 py-1 rounded text-sm font-medium ${
                      addressData.type === "ACCOUNT"
                        ? "bg-green-500"
                        : addressData.type === "CONTRACT"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                    }`}
                  >
                    {addressData.type}
                  </span>
                )}
              </div>
            </div>

            {/* Deployed By Contract Address */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">🏗️</span>
                <span className="font-medium text-base-content">
                  Deployed By Contract Address
                </span>
              </div>
              <div className="flex items-center">
                <code className="text-blue-400 font-mono text-sm">
                  {addressData.deployedByContractAddress}
                </code>
                <CopyButton
                  text={addressData.deployedByContractAddress}
                  fieldName="deployed-by"
                />
              </div>
            </div>

            {/* Deployed At Transaction Hash */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">📦</span>
                <span className="font-medium text-base-content">
                  Deployed At Transaction Hash
                </span>
              </div>
              <div className="flex items-center">
                {isAddressLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <code className="text-blue-400 font-mono text-sm">
                      {addressData.deployedAtTransactionHash}
                    </code>
                    {addressData.deployedAtTransactionHash !==
                      "Not available" && (
                      <CopyButton
                        text={addressData.deployedAtTransactionHash}
                        fieldName="deployed-tx"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Deployed At */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">📅</span>
                <span className="font-medium text-base-content">
                  Deployed At
                </span>
              </div>
              <div className="flex items-center">
                {isAddressLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span className="text-base-content">
                    {addressData.deployedAt}
                  </span>
                )}
              </div>
            </div>

            {/* Class Version */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">🔧</span>
                <span className="font-medium text-base-content">
                  Class Version
                </span>
              </div>
              <div className="flex items-center">
                {isAddressLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span
                    className={`text-white px-2 py-1 rounded text-sm font-medium ${
                      addressData.classVersion === "Cairo 2"
                        ? "bg-orange-500"
                        : addressData.classVersion === "Cairo 1"
                          ? "bg-purple-500"
                          : "bg-gray-500"
                    }`}
                  >
                    {addressData.classVersion}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case "transactions":
        if (isTransactionsLoading) {
          return (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="loading loading-spinner loading-lg"></span>
                <span className="text-base-content/70">
                  Loading transactions...
                </span>
              </div>
            </div>
          );
        }

        if (!transactionsData || transactionsData.length === 0) {
          return (
            <div className="py-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-base-content mb-2">
                No Transactions Found
              </h3>
              <p className="text-base-content/70">
                This address has no transaction history yet.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-base-content">
                Transactions ({transactionsData.length})
              </h3>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-left text-base-content/70 font-medium">
                      Tx Hash
                    </th>
                    <th className="text-left text-base-content/70 font-medium">
                      Block
                    </th>
                    <th className="text-left text-base-content/70 font-medium">
                      Age
                    </th>
                    <th className="text-left text-base-content/70 font-medium">
                      From
                    </th>
                    <th className="text-left text-base-content/70 font-medium">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsData.map((txn, index) => {
                    const age = txn.timestamp
                      ? Math.floor((Date.now() / 1000 - txn.timestamp) / 60)
                      : null;

                    return (
                      <tr
                        key={txn.transactionHash || index}
                        className="border-b border-base-300/50 hover:bg-base-200/50"
                      >
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            {txn.transactionHash ? (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/blockexplorer/tx/${txn.transactionHash}`,
                                  )
                                }
                                className="text-blue-400 font-mono text-sm hover:text-blue-300 hover:underline transition-colors"
                              >
                                {`${txn.transactionHash.slice(0, 10)}...${txn.transactionHash.slice(-8)}`}
                              </button>
                            ) : (
                              <span className="text-base-content/50 font-mono text-sm">
                                N/A
                              </span>
                            )}
                            {txn.transactionHash && (
                              <CopyButton
                                text={txn.transactionHash}
                                fieldName={`tx-${index}`}
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-blue-400 font-medium">
                            {txn.blockNumber || "N/A"}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-base-content/70 text-sm">
                            {age !== null ? `${age} mins ago` : "N/A"}
                          </span>
                        </td>
                        <td className="py-4">
                          {txn.fromAddress ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/blockexplorer/address/${txn.fromAddress}`,
                                  )
                                }
                                className="text-blue-400 font-mono text-sm hover:text-blue-300 hover:underline transition-colors"
                              >
                                {`${txn.fromAddress.slice(0, 6)}...${txn.fromAddress.slice(-4)}`}
                              </button>
                              <CopyButton
                                text={txn.fromAddress}
                                fieldName={`from-${index}`}
                              />
                            </div>
                          ) : (
                            <span className="text-base-content/50">N/A</span>
                          )}
                        </td>
                        <td className="py-4">
                          {txn.txCalls && txn.txCalls.length > 0 ? (
                            <div className="space-y-1">
                              {txn.txCalls
                                .slice(0, 2)
                                .map((call, callIndex) => (
                                  <div key={callIndex}>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      {call.functionCalled || "Unknown"}
                                    </span>
                                  </div>
                                ))}
                              {txn.txCalls.length > 2 && (
                                <div className="text-xs text-base-content/50">
                                  +{txn.txCalls.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-base-content/50">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination would go here if needed */}
            {transactionsData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-base-content/70">
                  No more transactions to display
                </p>
              </div>
            )}
          </div>
        );

      case "events":
        if (isEventsLoading) {
          return (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="loading loading-spinner loading-lg"></span>
                <span className="text-base-content/70">Loading events...</span>
              </div>
            </div>
          );
        }

        if (!eventsData || eventsData.length === 0) {
          return (
            <div className="py-8 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-base-content mb-2">
                No Events Found
              </h3>
              <p className="text-base-content/70">
                This address has no contract events yet.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-base-content">
                Events ({eventsData.length})
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-base-content/70">Raw Data:</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={showRawEventData}
                  onChange={(e) => setShowRawEventData(e.target.checked)}
                />
              </div>
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-300 bg-base-100">
                    <th className="text-left text-base-content/70 font-medium py-3 px-4">
                      Name
                    </th>
                    <th className="text-left text-base-content/70 font-medium py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span>Block Num.</span>
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left text-base-content/70 font-medium py-3 px-4">
                      Transaction Hash
                    </th>
                    <th className="text-left text-base-content/70 font-medium py-3 px-4">
                      From Address
                    </th>
                    <th className="text-left text-base-content/70 font-medium py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span>Age</span>
                        <ChevronDownIcon className="h-4 w-4" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eventsData.map((event, index) => {
                    const eventId = `${event.transactionHash}-${event.eventIndex}`;
                    const isExpanded = expandedEvents.has(eventId);
                    const age = event.timestamp
                      ? Math.floor((Date.now() / 1000 - event.timestamp) / 60)
                      : null;

                    const formatAge = (ageInMinutes: number | null) => {
                      if (ageInMinutes === null) return "N/A";
                      if (ageInMinutes < 60) return `${ageInMinutes}s`;
                      if (ageInMinutes < 60 * 24)
                        return `${Math.floor(ageInMinutes / 60)}m`;
                      return `${Math.floor(ageInMinutes / (60 * 24))}d`;
                    };

                    return (
                      <React.Fragment key={eventId}>
                        {/* Main Event Row */}
                        <tr className="border-b border-base-300/30 hover:bg-base-50/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleEventExpansion(eventId)}
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
                            <span className="text-blue-400 font-medium">
                              {event.blockNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/blockexplorer/tx/${event.transactionHash}`,
                                  )
                                }
                                className="text-blue-400 font-mono text-sm hover:text-blue-300 hover:underline transition-colors"
                              >
                                {`${event.transactionHash.slice(0, 8)}...${event.transactionHash.slice(-4)}`}
                              </button>
                              <CopyButton
                                text={event.transactionHash}
                                fieldName={`event-tx-${index}`}
                              />
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
                                {event.contractAddress ===
                                resolvedParams.address
                                  ? "Self Contract"
                                  : `${event.contractAddress.slice(0, 6)}...${event.contractAddress.slice(-4)}`}
                              </button>
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                              <CopyButton
                                text={event.contractAddress}
                                fieldName={`event-contract-${index}`}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-base-content/70 text-sm">
                              {formatAge(age)}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Event Arguments Row */}
                        {isExpanded && (
                          <tr className="bg-base-50/30">
                            <td colSpan={5} className="py-4 px-4">
                              <div className="bg-base-100 rounded-lg p-4 border border-base-300">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-base-content">
                                    Event Arguments
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-base-content/50">
                                      {showRawEventData ? "Raw" : "Decoded"}
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
                                            ...Object.keys(event.args)
                                              .filter((k) =>
                                                k.startsWith("key"),
                                              )
                                              .map((k) => event.args[k]),
                                          ])}
                                        </code>
                                        <CopyButton
                                          text={JSON.stringify([
                                            event.args.selector,
                                            ...Object.keys(event.args)
                                              .filter((k) =>
                                                k.startsWith("key"),
                                              )
                                              .map((k) => event.args[k]),
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
                                                k.startsWith("data"),
                                              )
                                              .map((k) => event.args[k]),
                                          )}
                                        </code>
                                        <CopyButton
                                          text={JSON.stringify(
                                            Object.keys(event.args)
                                              .filter((k) =>
                                                k.startsWith("data"),
                                              )
                                              .map((k) => event.args[k]),
                                          )}
                                          fieldName={`event-data-${index}`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : // Decoded event arguments display using parsedArgs from the new implementation
                                Object.keys(event.parsedArgs).length > 0 &&
                                  !Object.keys(event.parsedArgs).every(
                                    (key) =>
                                      key.startsWith("key") ||
                                      key.startsWith("data"),
                                  ) ? (
                                  <div className="bg-base-200 rounded-lg overflow-hidden">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-base-300 text-base-content/70 text-sm font-medium">
                                      <div className="col-span-3">INPUT</div>
                                      <div className="col-span-5">TYPE</div>
                                      <div className="col-span-4">DATA</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-base-300/50">
                                      {Object.entries(event.parsedArgs).map(
                                        ([key, value], argIndex) => {
                                          // Format the display value
                                          const getDisplayValue = (
                                            val: any,
                                          ) => {
                                            if (typeof val === "bigint") {
                                              // Convert to hex for display
                                              return `0x${val.toString(16)}`;
                                            }
                                            if (typeof val === "boolean") {
                                              return val ? "true" : "false";
                                            }
                                            if (typeof val === "string") {
                                              // If it's already hex, keep it, otherwise convert
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
                                            // First try to get the actual ABI type
                                            if (
                                              event.argTypes &&
                                              event.argTypes[paramName]
                                            ) {
                                              return event.argTypes[paramName];
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
                                ) : Object.keys(event.parsedArgs).length > 0 ? (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-amber-800 text-sm mb-2">
                                      <strong>
                                        Raw event data (ABI decoding
                                        unavailable):
                                      </strong>
                                    </p>
                                    <div className="space-y-2">
                                      {Object.entries(event.parsedArgs).map(
                                        ([key, value], argIndex) => (
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
                                    No decoded arguments available for this
                                    event
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

            {/* Pagination info */}
            {eventsData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-base-content/70">
                  No more events to display
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
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

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary-content">
              Address Details
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-primary-content/80 text-lg">Address:</span>
              <Address
                address={resolvedParams.address as `0x${string}`}
                format="long"
                profile={profileData}
                isLoading={isProfileLoading}
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
            {/* Tabs */}
            <div className="border-b border-base-300">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-base-content/70 hover:text-base-content hover:border-base-300"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span
                        className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                          activeTab === tab.id
                            ? "bg-blue-100 text-blue-600"
                            : "bg-base-200 text-base-content/60"
                        }`}
                      >
                        {tab.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">{renderTabContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
