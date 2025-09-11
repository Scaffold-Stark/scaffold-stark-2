import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProvider } from "@starknet-react/core";
import {
  RpcProvider,
  hash,
  events as starknetEvents,
  CallData,
  num,
} from "starknet";
import { useTargetNetwork } from "../scaffold-stark/useTargetNetwork";
import { parseEventData } from "~~/utils/scaffold-stark/eventsData";
import { devnet } from "@starknet-react/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import predeployedContracts from "~~/contracts/predeployedContracts";
import configExternalContracts from "~~/contracts/configExternalContracts";
import { deepMergeContracts } from "~~/utils/scaffold-stark/contract";

export interface EventData {
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  eventName: string;
  contractAddress: string;
  args: Record<string, any>;
  parsedArgs: Record<string, any>;
  argTypes: Record<string, string>;
  timestamp?: number;
  eventIndex: number;
}

// Helper function to get merged contracts for the network
const getMergedContracts = (targetNetwork: any) => {
  try {
    // Merge all contract sources first using the deepMergeContracts function
    const allMerged = deepMergeContracts(
      deepMergeContracts(deployedContracts, predeployedContracts),
      configExternalContracts,
    );

    const networkKey = targetNetwork.network as keyof typeof allMerged;

    // Get contracts for the current network from the merged contracts
    const merged = allMerged[networkKey] || {};

    return merged;
  } catch (error) {
    console.warn("Error merging contracts:", error);
    return {};
  }
};

// Helper function to find event definition by selector
const findEventDefinition = (selector: string, mergedContracts: any) => {
  try {
    // Search through all contracts and their ABIs
    for (const contractName in mergedContracts) {
      const contract = mergedContracts[contractName];
      if (contract && contract.abi) {
        // Find event definitions in the ABI
        const eventDefinitions = contract.abi.filter(
          (item: any) => item.type === "event",
        );

        for (const eventDef of eventDefinitions) {
          if (eventDef.name) {
            // For nested events, we need to check both the full name and the short name
            const fullEventNameHash = num.toHex(
              hash.starknetKeccak(eventDef.name),
            );
            const shortEventName = eventDef.name.split("::").pop() || "Event";
            const shortEventNameHash = num.toHex(
              hash.starknetKeccak(shortEventName),
            );

            if (
              fullEventNameHash === selector ||
              shortEventNameHash === selector
            ) {
              return {
                eventDef,
                contractName,
                eventName: shortEventName,
              };
            }
          }

          // Also check enum variants for nested events
          if (eventDef.kind === "enum" && eventDef.variants) {
            for (const variant of eventDef.variants) {
              if (variant.kind === "nested" && variant.name) {
                const variantHash = num.toHex(
                  hash.starknetKeccak(variant.name),
                );

                if (variantHash === selector) {
                  // Find the actual event definition
                  const actualEventDef = eventDefinitions.find(
                    (ed: any) => ed.name === variant.type,
                  );

                  if (actualEventDef) {
                    return {
                      eventDef: actualEventDef,
                      contractName,
                      eventName: variant.name,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.warn("Error finding event definition:", error);
    return null;
  }
};

// Helper function to decode event arguments based on ABI
const decodeEventArguments = (
  eventDefinition: any,
  keys: string[],
  data: string[],
) => {
  try {
    const decodedArgs: Record<string, any> = {};
    const argTypes: Record<string, string> = {};

    if (!eventDefinition.members) {
      return { decodedArgs, argTypes };
    }

    let keyIndex = 1; // Skip first key (selector)
    let dataIndex = 0;

    // Process event members according to their kind (key or data)
    for (const member of eventDefinition.members) {
      const { name, type, kind } = member;

      // Store the type information
      argTypes[name] = type;

      if (kind === "key" && keyIndex < keys.length) {
        // Decode indexed parameters (keys)
        decodedArgs[name] = decodeEventValue(keys[keyIndex], type);
        keyIndex++;
      } else if (kind === "data" && dataIndex < data.length) {
        // Decode non-indexed parameters (data)
        if (type === "core::integer::u256") {
          // u256 values are split into low and high parts
          if (dataIndex + 1 < data.length) {
            const low = BigInt(data[dataIndex]);
            const high = BigInt(data[dataIndex + 1]);
            decodedArgs[name] = (high << 128n) | low;
            dataIndex += 2;
          } else {
            decodedArgs[name] = BigInt(data[dataIndex]);
            dataIndex++;
          }
        } else if (type === "core::byte_array::ByteArray") {
          // Decode ByteArray according to Starknet.js documentation
          decodedArgs[name] = decodeByteArray(data, dataIndex);
          // ByteArray consumes multiple data fields, update index accordingly
          dataIndex += getByteArrayDataLength(data, dataIndex);
        } else {
          decodedArgs[name] = decodeEventValue(data[dataIndex], type);
          dataIndex++;
        }
      }
    }

    return { decodedArgs, argTypes };
  } catch (error) {
    console.warn("Error decoding event arguments:", error);
    return { decodedArgs: {}, argTypes: {} };
  }
};

// Helper function to decode individual event values based on type
const decodeEventValue = (value: string, type: string): any => {
  try {
    if (type === "core::starknet::contract_address::ContractAddress") {
      return num.toHex(BigInt(value));
    } else if (type === "core::bool") {
      return BigInt(value) === 1n;
    } else if (type.startsWith("core::integer::")) {
      return BigInt(value);
    } else if (type === "core::felt252" || type === "core::bytes_31::bytes31") {
      return value;
    } else {
      return value;
    }
  } catch (error) {
    console.warn("Error decoding event value:", error);
    return value;
  }
};

// Helper function to decode ByteArray according to Starknet.js documentation
const decodeByteArray = (data: string[], startIndex: number): string => {
  try {
    if (startIndex >= data.length) return "";

    const numFullWords = Number(data[startIndex]);
    let result = "";
    let currentIndex = startIndex + 1;

    // Process full words (31 bytes each)
    for (let i = 0; i < numFullWords; i++) {
      if (currentIndex < data.length) {
        const word = data[currentIndex];
        result += Buffer.from(word.slice(2), "hex").toString("utf8");
        currentIndex++;
      }
    }

    // Process pending word if exists
    if (currentIndex < data.length) {
      const pendingWord = data[currentIndex];
      if (pendingWord !== "0x0") {
        result += Buffer.from(pendingWord.slice(2), "hex").toString("utf8");
      }
      currentIndex++;
    }

    return result;
  } catch (error) {
    console.warn("Error decoding ByteArray:", error);
    return "";
  }
};

// Helper function to calculate ByteArray data length
const getByteArrayDataLength = (data: string[], startIndex: number): number => {
  try {
    if (startIndex >= data.length) return 1;

    const numFullWords = Number(data[startIndex]);
    // Structure: [numFullWords, ...fullWords, pendingWord, pendingWordLen]
    return numFullWords + 3; // +1 for numFullWords, +1 for pendingWord, +1 for pendingWordLen
  } catch (error) {
    return 1;
  }
};

export interface UseFetchEventsOptions {
  address?: string;
  transactionHash?: string;
  fromBlock?: number;
  toBlock?: number;
  pageSize?: number;
  page?: number;
}

export interface UseFetchEventsResult {
  events: EventData[];
  totalEvents: number;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

/**
 * Custom hook to fetch events from Starknet blockchain
 * Can filter by address or transaction hash
 *
 * @param options - Configuration options for fetching events
 * @returns Object containing events data and loading state
 */
export function useFetchEvents(
  options: UseFetchEventsOptions = {},
): UseFetchEventsResult {
  const {
    address,
    transactionHash,
    fromBlock = 0,
    toBlock,
    pageSize = 20,
    page = 1,
  } = options;

  const { targetNetwork } = useTargetNetwork();
  const { provider } = useProvider();

  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: targetNetwork.rpcUrls.public.http[0],
    });
  }, [targetNetwork.rpcUrls.public.http]);

  const fetchEvents = useCallback(async (): Promise<{
    events: EventData[];
    totalEvents: number;
    hasMore: boolean;
  }> => {
    if (!publicClient) {
      return { events: [], totalEvents: 0, hasMore: false };
    }

    try {
      // Get the latest block number if toBlock is not specified
      const latestBlock =
        toBlock || (await publicClient.getBlockLatestAccepted()).block_number;

      let events: EventData[] = [];

      if (transactionHash) {
        // Fetch events for a specific transaction
        try {
          const receipt =
            await publicClient.getTransactionReceipt(transactionHash);
          if ((receipt as any).events) {
            const transaction =
              await publicClient.getTransactionByHash(transactionHash);
            const block = await publicClient.getBlockWithTxHashes(
              (receipt as any).block_hash,
            );

            // Get merged contracts for ABI-based parsing
            const mergedContracts = getMergedContracts(targetNetwork);

            events = await Promise.all(
              (receipt as any).events.map(async (event: any, index: number) => {
                try {
                  // Initialize event data
                  const eventData: EventData = {
                    blockHash: (receipt as any).block_hash,
                    blockNumber: (receipt as any).block_number,
                    transactionHash: (receipt as any).transaction_hash,
                    eventName: "Event",
                    contractAddress: event.from_address,
                    args: {},
                    parsedArgs: {},
                    argTypes: {},
                    timestamp: block.timestamp,
                    eventIndex: index,
                  };

                  // Parse event using ABI-based approach (same logic as address-based)
                  if (event.keys && event.keys.length > 0) {
                    const selector = event.keys[0];
                    eventData.args.selector = selector;

                    // Find event definition from merged contracts
                    const eventInfo = findEventDefinition(
                      selector,
                      mergedContracts,
                    );

                    if (eventInfo) {
                      eventData.eventName = eventInfo.eventName;

                      // Decode arguments using ABI definition
                      const { decodedArgs, argTypes } = decodeEventArguments(
                        eventInfo.eventDef,
                        event.keys,
                        event.data || [],
                      );

                      // Store decoded arguments and their types
                      eventData.parsedArgs = { ...decodedArgs };
                      eventData.argTypes = { ...argTypes };

                      // Also store raw keys and data for raw view
                      event.keys.slice(1).forEach((key: any, i: number) => {
                        eventData.args[`key${i}`] = key;
                      });

                      if (event.data) {
                        event.data.forEach((data: any, i: number) => {
                          eventData.args[`data${i}`] = data;
                        });
                      }
                    } else {
                      // Fallback: store raw keys and data
                      event.keys.slice(1).forEach((key: any, i: number) => {
                        eventData.args[`key${i}`] = key;
                      });

                      if (event.data) {
                        event.data.forEach((data: any, i: number) => {
                          eventData.args[`data${i}`] = data;
                        });
                      }

                      eventData.parsedArgs = { ...eventData.args };
                      eventData.argTypes = {};
                    }
                  }

                  return eventData;
                } catch (error) {
                  console.warn("Failed to process transaction event:", error);
                  return {
                    blockHash: (receipt as any).block_hash,
                    blockNumber: (receipt as any).block_number,
                    transactionHash: (receipt as any).transaction_hash,
                    eventName: "Unknown",
                    contractAddress: event.from_address,
                    args: {},
                    parsedArgs: {},
                    argTypes: {},
                    timestamp: block.timestamp,
                    eventIndex: index,
                  } as EventData;
                }
              }),
            );
          }
        } catch (error) {
          console.warn("Failed to fetch events for transaction:", error);
        }
      } else if (address) {
        // Fetch events for a specific address
        try {
          const eventResponse = await publicClient.getEvents({
            address,
            from_block: { block_number: fromBlock },
            to_block: { block_number: latestBlock },
            chunk_size: pageSize * 2, // Fetch a bit more to handle pagination
          });

          if (eventResponse.events) {
            // Sort events by block number and event index (newest first)
            const sortedEvents = eventResponse.events.sort((a, b) => {
              if (a.block_number !== b.block_number) {
                return b.block_number - a.block_number;
              }
              return (b as any).event_index - (a as any).event_index;
            });

            // Apply pagination
            const startIndex = (page - 1) * pageSize;
            const paginatedEvents = sortedEvents.slice(
              startIndex,
              startIndex + pageSize,
            );

            // Process events
            events = await Promise.all(
              paginatedEvents.map(async (event, index) => {
                try {
                  // Try to get block timestamp
                  let timestamp: number | undefined;
                  try {
                    const block = await publicClient.getBlockWithTxHashes(
                      event.block_hash,
                    );
                    timestamp = block.timestamp;
                  } catch (error) {
                    console.warn("Failed to fetch block timestamp:", error);
                  }

                  // Initialize event data
                  const eventData: EventData = {
                    blockHash: event.block_hash,
                    blockNumber: event.block_number,
                    transactionHash: event.transaction_hash,
                    eventName: "Event",
                    contractAddress: event.from_address,
                    args: {},
                    parsedArgs: {},
                    argTypes: {},
                    timestamp,
                    eventIndex: (event as any).event_index || index,
                  };

                  // Get merged contracts for ABI-based parsing
                  const mergedContracts = getMergedContracts(targetNetwork);

                  // Parse event using ABI-based approach
                  if (event.keys && event.keys.length > 0) {
                    const selector = event.keys[0];
                    eventData.args.selector = selector;

                    // Find event definition from merged contracts
                    const eventInfo = findEventDefinition(
                      selector,
                      mergedContracts,
                    );

                    if (eventInfo) {
                      eventData.eventName = eventInfo.eventName;

                      // Decode arguments using ABI definition
                      const { decodedArgs, argTypes } = decodeEventArguments(
                        eventInfo.eventDef,
                        event.keys,
                        event.data || [],
                      );

                      // Store decoded arguments and their types
                      eventData.parsedArgs = { ...decodedArgs };
                      eventData.argTypes = { ...argTypes };

                      // Also store raw keys and data for raw view
                      event.keys.slice(1).forEach((key, i) => {
                        eventData.args[`key${i}`] = key;
                      });

                      if (event.data) {
                        event.data.forEach((data, i) => {
                          eventData.args[`data${i}`] = data;
                        });
                      }
                    } else {
                      // Fallback: store raw keys and data
                      event.keys.slice(1).forEach((key, i) => {
                        eventData.args[`key${i}`] = key;
                      });

                      if (event.data) {
                        event.data.forEach((data, i) => {
                          eventData.args[`data${i}`] = data;
                        });
                      }

                      eventData.parsedArgs = { ...eventData.args };
                      eventData.argTypes = {};
                    }
                  }

                  return eventData;
                } catch (error) {
                  console.warn("Failed to process event:", error);
                  return {
                    blockHash: event.block_hash,
                    blockNumber: event.block_number,
                    transactionHash: event.transaction_hash,
                    eventName: "Unknown",
                    contractAddress: event.from_address,
                    args: {},
                    parsedArgs: {},
                    argTypes: {},
                    eventIndex: index,
                  } as EventData;
                }
              }),
            );
          }
        } catch (error) {
          console.warn("Failed to fetch events for address:", error);
        }
      }

      const totalEvents = events.length; // This would be more accurate with proper pagination
      const hasMore = events.length === pageSize; // Simple check, could be more sophisticated

      return {
        events,
        totalEvents,
        hasMore,
      };
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }, [
    publicClient,
    address,
    transactionHash,
    fromBlock,
    toBlock,
    pageSize,
    page,
    targetNetwork,
  ]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "fetchEvents",
      targetNetwork.rpcUrls.public.http[0],
      address,
      transactionHash,
      fromBlock,
      toBlock,
      pageSize,
      page,
    ],
    queryFn: fetchEvents,
    enabled: !!(publicClient && (address || transactionHash)),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const totalPages = data ? Math.ceil(data.totalEvents / pageSize) : 0;

  return {
    events: data?.events || [],
    totalEvents: data?.totalEvents || 0,
    isLoading,
    error: error as Error | null,
    hasMore: data?.hasMore || false,
    currentPage: page,
    totalPages,
  };
}
