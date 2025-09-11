import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetchEvents } from "../useFetchEvents";
import { useProvider } from "@starknet-react/core";
import { useTargetNetwork } from "../../scaffold-stark/useTargetNetwork";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock dependencies
vi.mock("@starknet-react/core", () => ({
  useProvider: vi.fn(),
}));

vi.mock("../../scaffold-stark/useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("~~/utils/scaffold-stark/eventsData", () => ({
  parseEventData: vi.fn(),
}));

vi.mock("@starknet-react/chains", () => ({
  devnet: { network: "devnet" },
}));

vi.mock("~~/contracts/deployedContracts", () => ({
  default: {},
}));

vi.mock("~~/contracts/predeployedContracts", () => ({
  default: {},
}));

vi.mock("~~/contracts/configExternalContracts", () => ({
  default: {},
}));

vi.mock("~~/utils/scaffold-stark/contract", () => ({
  deepMergeContracts: vi.fn(() => ({
    devnet: {
      TestContract: {
        abi: [
          {
            type: "event",
            name: "TestEvent",
            kind: "struct",
            members: [
              {
                name: "sender",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              { name: "amount", type: "core::integer::u256", kind: "data" },
            ],
          },
        ],
      },
    },
  })),
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
    starknetKeccak: vi.fn((name) => {
      // Create predictable hashes for test events
      if (name === "TestEvent") return "0x9";
      if (name === "StringEvent") return "0xb";
      if (name === "Transfer") return "0x8";
      return `0x${name.length.toString(16)}`;
    }),
  },
  num: {
    toHex: vi.fn((value) => {
      if (typeof value === "string") return value;
      return `0x${value.toString(16)}`;
    }),
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

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("useFetchEvents", () => {
  const mockProvider = {};
  const mockTargetNetwork = {
    rpcUrls: {
      public: {
        http: ["http://localhost:5050"],
      },
    },
    network: "devnet",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useProvider as any).mockReturnValue({ provider: mockProvider });
    (useTargetNetwork as any).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });
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
        event_index: 0,
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
      },
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
      eventName: "Event",
      timestamp: 1640995200,
      eventIndex: 0,
    });
  });

  it("should fetch events for a specific transaction hash", async () => {
    const txHash = "0x123456789abcdef";
    const mockReceipt = {
      block_hash: "0xblock123",
      block_number: 100,
      transaction_hash: txHash,
      events: [
        {
          from_address: "0xcontract456",
          keys: ["0x9", "0xsender123"], // TestEvent selector and sender
          data: ["0x100", "0x0"], // u256 amount (low, high)
        },
      ],
    };
    const mockTransaction = {
      transaction_hash: txHash,
      type: "INVOKE",
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockReceipt);
    mockRpcProvider.getTransactionByHash.mockResolvedValue(mockTransaction);
    mockRpcProvider.getBlockWithTxHashes.mockResolvedValue(mockBlock);

    const { result } = renderHook(
      () => useFetchEvents({ transactionHash: txHash }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      blockHash: "0xblock123",
      blockNumber: 100,
      transactionHash: txHash,
      contractAddress: "0xcontract456",
      eventName: "TestEvent",
      timestamp: 1640995200,
    });
    expect(result.current.events[0].parsedArgs).toMatchObject({
      sender: "0xsender123",
      amount: 256n,
    });
  });

  it("should handle ABI-based event parsing with different data types", async () => {
    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0x9", "0xsender123"], // TestEvent selector and sender key
        data: ["0x100", "0x0"], // u256 amount (low, high)
        event_index: 0,
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
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      eventName: "TestEvent",
      contractAddress: "0x456",
    });
    expect(result.current.events[0].parsedArgs).toMatchObject({
      sender: "0xsender123",
      amount: 256n,
    });
    expect(result.current.events[0].argTypes).toMatchObject({
      sender: "core::starknet::contract_address::ContractAddress",
      amount: "core::integer::u256",
    });
  });

  it("should handle events with ByteArray data", async () => {
    // Mock contract with ByteArray event
    const { deepMergeContracts } = await vi.importMock(
      "~~/utils/scaffold-stark/contract",
    );
    (deepMergeContracts as any).mockReturnValue({
      devnet: {
        TestContract: {
          abi: [
            {
              type: "event",
              name: "StringEvent",
              kind: "struct",
              members: [
                {
                  name: "message",
                  type: "core::byte_array::ByteArray",
                  kind: "data",
                },
              ],
            },
          ],
        },
      },
    });

    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xb"], // StringEvent selector
        data: ["0x1", "0x48656c6c6f20576f726c6421", "0x0", "0x0"], // ByteArray: "Hello World!"
        event_index: 0,
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
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].eventName).toBe("StringEvent");
    expect(result.current.events[0].parsedArgs.message).toBe("Hello World!");
  });

  it("should handle events without ABI definition (fallback to raw data)", async () => {
    // Mock empty contracts to force fallback
    const { deepMergeContracts } = await vi.importMock(
      "~~/utils/scaffold-stark/contract",
    );
    (deepMergeContracts as any).mockReturnValue({
      devnet: {},
    });

    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xunknown", "0xkey1"],
        data: ["0xdata1", "0xdata2"],
        event_index: 0,
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
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      eventName: "Event", // Default fallback name
      contractAddress: "0x456",
    });
    expect(result.current.events[0].args).toMatchObject({
      selector: "0xunknown",
      key0: "0xkey1",
      data0: "0xdata1",
      data1: "0xdata2",
    });
  });

  it("should handle pagination correctly", async () => {
    const mockEvents = Array.from({ length: 25 }, (_, i) => ({
      block_hash: `0xblock${i}`,
      block_number: 100 + i,
      transaction_hash: `0xtx${i}`,
      from_address: "0x456",
      keys: ["0xkey1"],
      data: ["0xdata1"],
      event_index: i,
    }));

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
      () => useFetchEvents({ address: "0x123456789", pageSize: 10, page: 2 }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(10);
    expect(result.current.currentPage).toBe(2);
    // The hook returns the length of current page events as totalEvents in this implementation
    expect(result.current.totalEvents).toBe(10);
    expect(result.current.totalPages).toBe(1);
  });

  it("should sort events by block number and event index (newest first)", async () => {
    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xkey1"],
        data: ["0xdata1"],
        event_index: 1,
      },
      {
        block_hash: "0x124",
        block_number: 101,
        transaction_hash: "0xdef",
        from_address: "0x456",
        keys: ["0xkey1"],
        data: ["0xdata1"],
        event_index: 0,
      },
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xkey1"],
        data: ["0xdata1"],
        event_index: 0,
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
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(3);
    // Should be sorted by block number desc, then event index desc
    expect(result.current.events[0].blockNumber).toBe(101);
    expect(result.current.events[0].eventIndex).toBe(0);
    expect(result.current.events[1].blockNumber).toBe(100);
    expect(result.current.events[1].eventIndex).toBe(1);
    expect(result.current.events[2].blockNumber).toBe(100);
    expect(result.current.events[2].eventIndex).toBe(2);
  });

  it("should handle block timestamp fetch errors gracefully", async () => {
    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xkey1"],
        data: ["0xdata1"],
        event_index: 0,
      },
    ];

    mockRpcProvider.getBlockLatestAccepted.mockResolvedValue({
      block_number: 1000,
    });
    mockRpcProvider.getEvents.mockResolvedValue({
      events: mockEvents,
    });
    mockRpcProvider.getBlockWithTxHashes.mockRejectedValue(
      new Error("Block not found"),
    );

    const { result } = renderHook(
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].timestamp).toBeUndefined();
  });

  it("should handle transaction receipt errors for transaction hash queries", async () => {
    const txHash = "0x123456789abcdef";

    mockRpcProvider.getTransactionReceipt.mockRejectedValue(
      new Error("Transaction not found"),
    );

    const { result } = renderHook(
      () => useFetchEvents({ transactionHash: txHash }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull(); // Should handle error gracefully
  });

  it("should handle address events fetch errors gracefully", async () => {
    mockRpcProvider.getBlockLatestAccepted.mockResolvedValue({
      block_number: 1000,
    });
    mockRpcProvider.getEvents.mockRejectedValue(
      new Error("Events fetch failed"),
    );

    const { result } = renderHook(
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull(); // Should handle error gracefully
  });

  it("should handle complete fetch errors", async () => {
    mockRpcProvider.getBlockLatestAccepted.mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(
      () =>
        useFetchEvents({
          address: "0x123456789",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should handle events with enum variants", async () => {
    // Mock contract with enum event
    const { deepMergeContracts } = await vi.importMock(
      "~~/utils/scaffold-stark/contract",
    );
    (deepMergeContracts as any).mockReturnValue({
      devnet: {
        TestContract: {
          abi: [
            {
              type: "event",
              name: "Event",
              kind: "enum",
              variants: [
                {
                  name: "Transfer",
                  kind: "nested",
                  type: "TransferEvent",
                },
              ],
            },
            {
              type: "event",
              name: "TransferEvent",
              kind: "struct",
              members: [
                {
                  name: "from",
                  type: "core::starknet::contract_address::ContractAddress",
                  kind: "key",
                },
                {
                  name: "to",
                  type: "core::starknet::contract_address::ContractAddress",
                  kind: "key",
                },
                { name: "value", type: "core::integer::u256", kind: "data" },
              ],
            },
          ],
        },
      },
    });

    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 100,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0x8", "0x123", "0x456"], // Transfer selector, from, to
        data: ["0x64", "0x0"], // u256 value (100, 0)
        event_index: 0,
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
      () => useFetchEvents({ address: "0x123456789" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].eventName).toBe("Transfer");
    expect(result.current.events[0].parsedArgs).toMatchObject({
      from: "0x123",
      to: "0x456",
      value: 100n,
    });
  });

  it("should handle fromBlock and toBlock parameters", async () => {
    const mockEvents = [
      {
        block_hash: "0x123",
        block_number: 50,
        transaction_hash: "0xabc",
        from_address: "0x456",
        keys: ["0xkey1"],
        data: ["0xdata1"],
        event_index: 0,
      },
    ];

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
          fromBlock: 40,
          toBlock: 60,
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockRpcProvider.getEvents).toHaveBeenCalledWith({
      address: "0x123456789",
      from_block: { block_number: 40 },
      to_block: { block_number: 60 },
      chunk_size: 40, // pageSize * 2
    });
  });
});
