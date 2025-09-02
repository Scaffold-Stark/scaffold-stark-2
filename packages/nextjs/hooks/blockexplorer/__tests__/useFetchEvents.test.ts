import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetchEvents } from "../../blockexplorer/useFetchEvents";
import { useProvider } from "@starknet-react/core";
import { useTargetNetwork } from "../useTargetNetwork";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock dependencies
vi.mock("@starknet-react/core", () => ({
  useProvider: vi.fn(),
}));

vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

// Mock RpcProvider
const mockRpcProvider = {
  getBlockLatestAccepted: vi.fn(),
  getEvents: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getTransactionByHash: vi.fn(),
  getBlockWithTxHashes: vi.fn(),
};

vi.mock("starknet", () => ({
  RpcProvider: vi.fn(() => mockRpcProvider),
  hash: {
    getSelectorFromName: vi.fn(),
  },
  events: {
    parseEvents: vi.fn(),
    getAbiEvents: vi.fn(),
  },
  CallData: {
    getAbiStruct: vi.fn(),
    getAbiEnum: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useFetchEvents", () => {
  const mockProvider = {};
  const mockTargetNetwork = {
    rpcUrls: {
      public: {
        http: ["http://localhost:5050"],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useProvider as any).mockReturnValue({ provider: mockProvider });
    (useTargetNetwork as any).mockReturnValue({ targetNetwork: mockTargetNetwork });
  });

  it("should return empty events when no address or transaction hash provided", async () => {
    const { result } = renderHook(() => useFetchEvents(), {
      wrapper: createWrapper(),
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalEvents).toBe(0);
  });

  it("should fetch events for a specific address", async () => {
    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xkey1"],
        data: ["0xdata1"],
      },
    ];

    mockRpcProvider.getBlockLatestAccepted.mockResolvedValue({
      block_number: 1000,
    });
    mockRpcProvider.getEvents.mockResolvedValue({
      events: mockEvents,
    });
    mockRpcProvider.getBlockWithTxHashes.mockResolvedValue({
      timestamp: 1640995200,
    });

    const { result } = renderHook(
      () =>
        useFetchEvents({
          address: "0x123456789",
          pageSize: 10,
          page: 1,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      blockHash: "0x123",
      blockNumber: 100,
      transactionHash: "0xabc",
      contractAddress: "0x456",
    });
  });

  it("should handle errors gracefully", async () => {
    mockRpcProvider.getBlockLatestAccepted.mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(
      () =>
        useFetchEvents({
          address: "0x123456789",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
