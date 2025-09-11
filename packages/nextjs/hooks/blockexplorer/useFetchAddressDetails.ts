"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contract, hash, num, RpcProvider } from "starknet";
import { Address } from "@starknet-react/chains";
import { useTargetNetwork } from "../scaffold-stark/useTargetNetwork";
import { useContract } from "@starknet-react/core";
import { devnetUDCAddress } from "~~/utils/Constants";
import { checkSanitizedEquals } from "~~/utils/blockexplorer";

interface AddressDetails {
  contractAddress: string;
  classHash?: string;
  type: "ACCOUNT" | "CONTRACT" | "UNKNOWN";
  deployedByContractAddress?: string;
  deployedAtTransactionHash?: string;
  deployedAt?: string;
  classVersion?: string;
  isLoading: boolean;
  error?: string;
}

const getContractDeployerAndHash = async (
  address: Address,
  provider: RpcProvider,
) => {
  try {
    // Search for Deployed events from UDC that match our target address
    const events = await provider.getEvents({
      address: devnetUDCAddress,
      keys: [
        ["0x26b160f10156dea0639bec90696772c640b9706a47f5b8c52ea1abe5858b34d"],
      ], // Deployed event selector
      chunk_size: 1000,
    });

    console.log("events", events);

    // Find the deployment event for our specific address
    const deploymentEvent = events.events.find((event) => {
      if (!event.data) return false;

      // Normalize both addresses for comparison
      const eventAddress = num.toHex(event.data[0]);
      const targetAddress = num.toHex(address);

      return checkSanitizedEquals(eventAddress, targetAddress);
    });

    return {
      deployer: deploymentEvent?.data[1],
      hash: deploymentEvent?.transaction_hash,
      blockNumber: deploymentEvent?.block_number,
    };
  } catch (error) {
    console.error("Error fetching deployment hash from UDC:", error);
    return undefined;
  }
};

/**
 * Hook to fetch comprehensive address details from the Starknet blockchain.
 * This includes contract information, class hash, deployment details, and more.
 *
 * @param address - The Starknet address to fetch details for
 * @returns AddressDetails object with all fetched information and loading states
 */
export const useFetchAddressDetails = (address?: Address | string) => {
  const { targetNetwork } = useTargetNetwork();

  const provider = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  const fetchAddressDetails = async (): Promise<AddressDetails | null> => {
    if (!address || !provider) return null;

    try {
      const addressDetails: AddressDetails = {
        contractAddress: address,
        type: "UNKNOWN",
        isLoading: false,
      };

      try {
        // Try to get class hash (indicates this is a deployed contract)
        const { abi: contractAbi } = await provider.getClassAt(address);
        const classHash = await provider.getClassHashAt(address);

        if (classHash && classHash !== "0x0") {
          addressDetails.classHash = classHash;

          try {
            // Determine if it's Cairo 1.0 or Cairo 2.0 based on the class structure
            if (contractAbi && typeof contractAbi === "object") {
              const version = (await provider.getContractVersion(address))
                .cairo;
              addressDetails.classVersion = `Cairo ${version}`;
              addressDetails.type = "CONTRACT";
            }
          } catch (classError) {
            console.warn("Could not fetch class details:", classError);
            addressDetails.classVersion = "Unknown";
            addressDetails.type = "CONTRACT";
          }

          // For now, set deployed by as the same address since we don't have deployment transaction info
          addressDetails.deployedByContractAddress = address;

          const deploymentInfo = await getContractDeployerAndHash(
            address as Address,
            provider,
          );
          addressDetails.deployedAtTransactionHash = deploymentInfo?.hash;
          addressDetails.deployedByContractAddress = deploymentInfo?.deployer;
          addressDetails.deployedAt = await (async () => {
            try {
              const blockIdentifier = deploymentInfo?.blockNumber;
              if (blockIdentifier) {
                const block = await provider.getBlock(blockIdentifier);
                return new Date(block.timestamp * 1000).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                );
              }
              return undefined;
            } catch (error) {
              console.warn("Could not fetch block timestamp:", error);
              return undefined;
            }
          })();
        } else {
          // Address exists but no class hash - likely an externally owned account or undeployed
          addressDetails.type = "ACCOUNT";
        }
      } catch (classHashError) {
        // If we can't get class hash, it might be an EOA or the address doesn't exist
        console.warn("Could not fetch class hash:", classHashError);
        addressDetails.type = "ACCOUNT";
      }

      return addressDetails;
    } catch (error) {
      console.error("Error fetching address details:", error);
      throw new Error("Failed to fetch address details");
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "address-details",
      address,
      targetNetwork.rpcUrls.public.http[0],
    ],
    queryFn: fetchAddressDetails,
    enabled: !!address && !!provider,
    staleTime: 5 * 1000, // 5 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    addressDetails: data || {
      contractAddress: address || "",
      type: "UNKNOWN" as const,
      isLoading: true,
    },
    isLoading,
    error: error?.message,
    refetch,
  };
};
