import { renderHook, act, waitFor } from "@testing-library/react";
import { useDataTransaction } from "../useDataTransaction";
import { useTargetNetwork } from "../useTargetNetwork";
import { RpcProvider } from "starknet";
import {
  vi,
  describe,
  beforeEach,
  it,
  expect,
  afterEach,
  type Mock,
} from "vitest";

vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

const mockGetBlock = vi.fn();
const mockGetBlockWithTxHashes = vi.fn();
const mockGetTransactionReceipt = vi.fn();
const mockGetClass: any[] = [];
const mockGetTransaction: any[] = [];

vi.mock("starknet", () => ({
  RpcProvider: vi.fn().mockImplementation(() => ({
    getBlock: mockGetBlock,
    getBlockWithTxHashes: mockGetBlockWithTxHashes,
    getTransactionReceipt: mockGetTransactionReceipt,
    getClass: mockGetClass,
    getTransaction: mockGetTransaction,
  })),
}));

describe("useDataTransaction", () => {
  const mockTargetNetwork = {
    rpcUrls: {
      public: {
        http: ["https://mock-rpc-url"],
      },
    },
  };

  const mockBlockLatest = {
    status: "ACCEPTED_ON_L2",
    sequencer_address: "0xabcdef",
    starknet_version: "1.0.0",
    timestamp: 1692200000,
    transactions: ["0xhash1", "0xhash2"],
    parent_hash: "0xparent_hash_latest",
    l1_gas_price: {
      price_in_wei: "10000000000",
      price_in_fri: "20000000000",
    },
  };

  const mockBlockPrevious = {
    status: "ACCEPTED_ON_L2",
    sequencer_address: "0xabc123",
    starknet_version: "1.0.0",
    timestamp: 1692199990,
    transactions: ["0xhash3"],
    parent_hash: "0xparent_hash_prev",
    l1_gas_price: {
      price_in_wei: "10000000000",
      price_in_fri: "20000000000",
    },
  };

  const mockBlockWithTxHashes = {
    transactions: ["0xhash1", "0xhash2"],
  };

  // Mocks for transactions
  const mockTransactionReceipt1 = {
    actual_fee: { amount: "1000000000000000000" }, // 1 Ether in Wei
  };

  const mockTransactionReceipt2 = {
    actual_fee: { amount: "1000000000000000000" }, // 1 Ether in Wei
  };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Set up the mock for useTargetNetwork
    (useTargetNetwork as Mock).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });

    // Mock fetch to get ETH price
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ethereum: { usd: 2000 } }),
    });

    // Configure RpcProvider mocks
    mockGetBlock.mockImplementation((identifier: number) => {
      if (identifier === 10) return Promise.resolve(mockBlockLatest);
      if (identifier === 9) return Promise.resolve(mockBlockPrevious);
      return Promise.resolve(mockBlockPrevious);
    });

    mockGetBlockWithTxHashes.mockResolvedValue(mockBlockWithTxHashes);

    // Simulate getTransactionReceipt being called twice, returning 1 Ether each time
    mockGetTransactionReceipt
      .mockResolvedValueOnce(mockTransactionReceipt1)
      .mockResolvedValueOnce(mockTransactionReceipt2);

    // Mock getClass and getTransaction as arrays with fixed lengths
    mockGetClass.length = 10; // Arbitrary value
    mockGetTransaction.length = 5; // Arbitrary value
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch block data and set blockData with the given blockNumber", async () => {
    // Call the hook with blockNumber = 10
    const { result } = renderHook(() => useDataTransaction(10));

    // Initially, there is no data
    expect(result.current.blockData).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isEnabled).toBe(true);

    await waitFor(() => {
      // After the hook fetches data
      expect(result.current.blockData).not.toBeNull();
    });

    // Check the block data
    const bd = result.current.blockData;
    expect(bd?.blockNumber).toBe(10);
    // Now blockHash corresponds to sequencer_address in the new code
    expect(bd?.blockHash).toBe(mockBlockLatest.sequencer_address);
    // Total transactions in the current block
    expect(bd?.totalTransactions).toBe(mockBlockLatest.transactions.length);

    // Check the average fee calculation (averageFeeUSD)
    // total actual_fee = 2 Ether = 4000 USD, 2 transactions => average fee = 2000 USD
    expect(bd?.averageFeeUSD).toBe("2000.0000");

    // TPS Calculation:
    // time between blocks = 1692200000 (current) - 1692199990 (previous) = 10 sec
    // transactions in the current block = 2
    // TPS = 2/10 = 0.2
    expect(bd?.tps).toBeCloseTo(0.2);

    // Test toggleFetching
    act(() => {
      result.current.toggleFetching();
    });
    expect(result.current.isEnabled).toBe(false);
  });

  it("should handle errors when data fetching fails", async () => {
    // Simulate an error in getBlock
    mockGetBlock.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useDataTransaction(10));

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });
    expect(result.current.blockData).toBeNull();
  });

  it("should handle block number 0 correctly", async () => {
    const mockBlockZero = {
      status: "ACCEPTED_ON_L2",
      sequencer_address: "0xabcdef",
      starknet_version: "1.0.0",
      timestamp: 1692200000,
      transactions: ["0xhash1"],
      parent_hash: "0xparent_hash_zero",
      l1_gas_price: {
        price_in_wei: "10000000000",
        price_in_fri: "20000000000",
      },
    };

    mockGetBlock.mockImplementationOnce(() => Promise.resolve(mockBlockZero));
    // No previous block available
    mockGetBlock.mockImplementationOnce(() => Promise.resolve(null));

    const { result } = renderHook(() => useDataTransaction(0));

    await waitFor(() => {
      expect(result.current.blockData).not.toBeNull();
    });

    const bd = result.current.blockData;
    expect(bd?.blockNumber).toBe(0);
    expect(bd?.tps).toBeNull(); // No previous block to calculate TPS
  });

  it("should toggle data fetching enablement", async () => {
    const { result } = renderHook(() => useDataTransaction(10));

    // Initially, fetching is enabled
    expect(result.current.isEnabled).toBe(true);

    // Disable fetching
    act(() => {
      result.current.toggleFetching();
    });
    expect(result.current.isEnabled).toBe(false);

    // Mock getBlock should not be called when fetching is disabled
    mockGetBlock.mockImplementation(() => Promise.resolve(mockBlockLatest));

    // Force an update
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      // blockData should still be null since fetching is disabled
      expect(result.current.blockData).toBeNull();
    });

    // Re-enable fetching
    act(() => {
      result.current.toggleFetching();
    });
    expect(result.current.isEnabled).toBe(true);

    await waitFor(() => {
      expect(result.current.blockData).not.toBeNull();
    });
  });

  it("should set all fields in blockData correctly", async () => {
    const { result } = renderHook(() => useDataTransaction(10));

    await waitFor(() => {
      expect(result.current.blockData).not.toBeNull();
    });

    const bd = result.current.blockData;
    expect(bd).toMatchObject({
      transaction: 2,
      blockStatus: mockBlockLatest.status,
      blockNumber: 10,
      blockHash: mockBlockLatest.sequencer_address,
      blockVersion: mockBlockLatest.starknet_version,
      blockTimestamp: mockBlockLatest.timestamp,
      blockTransactions: mockBlockLatest.transactions,
      parentBlockHash: mockBlockLatest.parent_hash, // <-- Incluye esto
      totalTransactions: mockBlockLatest.transactions.length,
      tps: 0.2,
      gasprice: mockBlockLatest.l1_gas_price.price_in_wei,
      gaspricefri: mockBlockLatest.l1_gas_price.price_in_fri,
      timeDiff: 10,
      averageFeeUSD: "2000.0000",
    });
  });

  it("should not update state after the hook is unmounted", async () => {
    const { result, unmount } = renderHook(() => useDataTransaction(10));

    // Unmount the hook before the promises resolve
    unmount();

    // Resolve promises after unmounting
    mockGetBlock.mockResolvedValueOnce(mockBlockLatest);
    mockGetBlockWithTxHashes.mockResolvedValueOnce({
      transactions: ["0xhash1", "0xhash2"],
    });
    mockGetTransactionReceipt.mockResolvedValueOnce({
      actual_fee: { amount: "1000000000000000000" },
    });
    mockGetTransactionReceipt.mockResolvedValueOnce({
      actual_fee: { amount: "1000000000000000000" },
    });

    // Try to wait, but there is nothing to update
    await waitFor(() => {
      expect(result.current.blockData).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  it("should set tps as null when the time difference is 0", async () => {
    const mockBlockCurrent = {
      ...mockBlockLatest,
      timestamp: 1692200000,
    };

    const mockBlockPreviousSameTime = {
      ...mockBlockPrevious,
      timestamp: 1692200000, // Same timestamp
    };

    mockGetBlock.mockResolvedValueOnce(mockBlockCurrent);
    mockGetBlock.mockResolvedValueOnce(mockBlockPreviousSameTime);
    mockGetBlockWithTxHashes.mockResolvedValueOnce({
      transactions: ["0xhash1", "0xhash2"],
    });
    mockGetTransactionReceipt.mockResolvedValueOnce({
      actual_fee: { amount: "1000000000000000000" },
    });
    mockGetTransactionReceipt.mockResolvedValueOnce({
      actual_fee: { amount: "1000000000000000000" },
    });

    const { result } = renderHook(() => useDataTransaction(10));

    await waitFor(() => {
      expect(result.current.blockData).not.toBeNull();
    });

    const bd = result.current.blockData;
    expect(bd?.tps).toBeNull(); // Because timeDiff = 0
  });
});
