"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Address, Balance } from "~~/components/scaffold-stark";
import { useFetchAddressDetails } from "~~/hooks/scaffold-stark";
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

  // Use fetched data or fallback to loading states
  const addressData = {
    contractAddress: resolvedParams.address,
    classHash: addressDetails.classHash || "Not available",
    strkBalance: strkBalance || "0",
    type: addressDetails.type,
    deployedByContractAddress:
      addressDetails.deployedByContractAddress || resolvedParams.address,
    deployedAtTransactionHash:
      addressDetails.deployedAtTransactionHash || "Not available",
    deployedAt: addressDetails.deployedAt || "Not available",
    classVersion: addressDetails.classVersion || "Unknown",
    profileName: profileData?.name || "",
  };

  const tabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "transactions", label: "Transactions", count: 130533 },
    { id: "events", label: "Events", count: 2 },
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
        return (
          <div className="py-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-base-content mb-2">
              Transactions Tab
            </h3>
            <p className="text-base-content/70">
              Transaction history for this address will be displayed here.
            </p>
          </div>
        );

      case "events":
        return (
          <div className="py-8 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-base-content mb-2">
              Events Tab
            </h3>
            <p className="text-base-content/70">
              Contract events for this address will be displayed here.
            </p>
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
