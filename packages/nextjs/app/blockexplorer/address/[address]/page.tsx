"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";

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

  // Mock data - replace with actual data fetching
  const addressData = {
    contractAddress: resolvedParams.address,
    classHash:
      "0x079a9a12fdfa0481e8d8d46599b90226cd7247b2667358bb00636dd864002314",
    ethBalance: "0.001998119207217959",
    type: "ACCOUNT",
    deployedByContractAddress: resolvedParams.address,
    deployedAtTransactionHash:
      "0x03659c858c1f2f813cd8de66c71f7d236a5a233b1b71dc9449ef3e0d92403ec",
    deployedAt: "April 2, 2025 at 4:48:46 PM GMT+7",
    classVersion: "Cairo 2",
  };

  const tabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "transactions", label: "Transactions", count: 130533 },
    { id: "events", label: "Events", count: 2 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
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
                <code className="text-blue-400 font-mono text-sm">
                  {addressData.classHash}
                </code>
                <CopyButton
                  text={addressData.classHash}
                  fieldName="class-hash"
                />
              </div>
            </div>

            {/* ETH Balance */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">💰</span>
                <span className="font-medium text-base-content">
                  ETH Balance
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-base-content">
                  {addressData.ethBalance} ETH
                </span>
                <button className="ml-2 text-blue-400 hover:text-blue-300 text-sm">
                  View All Tokens →
                </button>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between py-4 border-b border-base-300">
              <div className="flex items-center">
                <span className="text-base-content/70 mr-2">🏷️</span>
                <span className="font-medium text-base-content">Type</span>
              </div>
              <div className="flex items-center">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
                  {addressData.type}
                </span>
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
                <code className="text-blue-400 font-mono text-sm">
                  {addressData.deployedAtTransactionHash}
                </code>
                <CopyButton
                  text={addressData.deployedAtTransactionHash}
                  fieldName="deployed-tx"
                />
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
                <span className="text-base-content">
                  {addressData.deployedAt}
                </span>
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
                <span className="bg-orange-500 text-white px-2 py-1 rounded text-sm font-medium">
                  {addressData.classVersion}
                </span>
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

          <h1 className="text-4xl font-bold text-primary-content">
            Address Details
          </h1>
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
