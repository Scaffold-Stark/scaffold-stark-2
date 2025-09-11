"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useProvider } from "@starknet-react/core";
import { RpcProvider } from "starknet";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search by transaction hash or contract address...",
  className = "",
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { provider } = useProvider();

  // Helper function to validate hex string
  const isValidHex = (str: string): boolean => {
    return /^0x[0-9a-fA-F]+$/.test(str);
  };

  // Helper function to validate input format
  const validateInput = (input: string): boolean => {
    const cleanInput = input.trim();

    // Check if it's a valid hex string
    if (!isValidHex(cleanInput)) {
      return false;
    }

    // Remove '0x' prefix for length calculation
    const hexPart = cleanInput.slice(2);

    // Validate reasonable length ranges for Starknet identifiers
    if (hexPart.length < 40 || hexPart.length > 66) {
      return false;
    }

    return true;
  };

  // API-based function to determine if input is a transaction hash or contract address
  const determineInputType = async (
    input: string,
  ): Promise<"transaction" | "address" | "invalid"> => {
    const cleanInput = input.trim().toLowerCase();

    if (!validateInput(cleanInput)) {
      return "invalid";
    }

    if (!provider) {
      // Fallback to length-based heuristic if no provider
      const hexPart = cleanInput.slice(2);
      return hexPart.length === 64 ? "transaction" : "address";
    }

    try {
      // Try to get transaction receipt first
      await provider.getTransactionReceipt(cleanInput);
      // If successful, it's definitely a transaction hash
      return "transaction";
    } catch (error) {
      // If getTransactionReceipt fails, it's likely an address
      // We could also try getClassAt to verify it's a valid address, but
      // we'll let the address page handle that validation
      return "address";
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError("Please enter a transaction hash or contract address");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const inputType = await determineInputType(searchInput);

      switch (inputType) {
        case "transaction":
          router.push(`/blockexplorer/tx/${searchInput.trim()}`);
          break;
        case "address":
          router.push(`/blockexplorer/address/${searchInput.trim()}`);
          break;
        case "invalid":
          setError(
            "Invalid format. Please enter a valid transaction hash or contract address (must start with 0x)",
          );
          setIsSearching(false);
          return;
      }

      // Clear the input after successful search
      setSearchInput("");
    } catch (err) {
      setError(
        "An error occurred while validating the input. Please try again.",
      );
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  return (
    <div className={`w-full max-w-2xl ${className}`}>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={`w-full px-4 py-3 pr-12 text-base bg-base-100 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
              error
                ? "border-error focus:ring-error"
                : "border-base-300 hover:border-base-400"
            }`}
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-base-content/60 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Search"
          >
            {isSearching ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Error message */}
        {error && <div className="mt-2 text-sm text-error">{error}</div>}

        {/* Helper text */}
        {!error && (
          <div className="mt-2 text-xs text-base-content/60">
            Enter a transaction hash or contract address starting with 0x.
            We&apos;ll automatically detect the type.
          </div>
        )}
      </div>
    </div>
  );
};
