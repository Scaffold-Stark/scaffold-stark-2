import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetchAllTxns } from "../useFetchAllTxns";
import { useTargetNetwork } from "../../scaffold-stark/useTargetNetwork";
import { useBlockNumber } from "@starknet-react/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock dependencies
vi.mock("../../scaffold-stark/useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useBlockNumber: vi.fn(),
}));

vi.mock("../../utils/scaffold-stark/selectorUtils", () => ({
  getFunctionNameFromSelector: vi.fn(
    (selector) => `Unknown Function (${selector})`,
  ),
}));

vi.mock("~~/utils/Constants", () => ({
  devnetUDCAddress:
    "0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf",
  universalStrkAddress:
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  strkAbi: [],
  devnetStrkClassHash:
    "0x046ded64ae2dead6448e247234bab192a9c483644395b66f2155f2614e5804b0",
  sepoliaMainnetStrkClassHash:
    "0x04ad3c1dc8413453db314497945b6903e1c766495a1e60492d44da9c2a986e4b",
}));

// Mock RpcProvider
const mockRpcProvider = {
  getBlock: vi.fn(),
  getTransaction: vi.fn(),
  getTransactionReceipt: vi.fn(),
};

vi.mock("starknet", () => ({
  RpcProvider: vi.fn(() => mockRpcProvider),
  BlockTag: {
    LATEST: "latest",
  },
  encode: {
    sanitizeHex: vi.fn((hex) => hex.toLowerCase()),
  },
  hash: {
    starknetKeccak: vi.fn((name) => {
      // Create predictable hashes for test functions
      if (name === "transfer")
        return "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e";
      if (name === "transfer_ownership") return "0x123456789abcdef";
      if (name === "renounce_ownership") return "0xfedcba987654321";
      return `0x${name.length.toString(16)}`;
    }),
  },
  num: {
    toHex: vi.fn((value) => `0x${value.toString(16)}`),
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

describe("useFetchAllTxns", () => {
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
    (useTargetNetwork as any).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });
    (useBlockNumber as any).mockReturnValue({ data: 10 });
  });

  it("should return empty data when no blocks are available", async () => {
    (useBlockNumber as any).mockReturnValue({ data: null });

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toEqual([]);
    expect(result.current.totalTxns).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it("should fetch transactions with default pagination", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1", "0xtx2"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance1 = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", "0xcontract1", "0xselector1", "0x1", "0xarg1"],
    };
    const mockTxInstance2 = {
      type: "DECLARE",
      sender_address: "0xsender2",
    };
    const mockTxReceipt1 = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxReceipt2 = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction
      .mockResolvedValueOnce(mockTxInstance1)
      .mockResolvedValueOnce(mockTxInstance2);
    mockRpcProvider.getTransactionReceipt
      .mockResolvedValueOnce(mockTxReceipt1)
      .mockResolvedValueOnce(mockTxReceipt2);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(2);
    expect(result.current.txns[0]).toMatchObject({
      blockHash: "0xblock1",
      blockNumber: 10,
      timestamp: 1640995200,
      transactionHash: "0xtx1",
      fromAddress: "0xsender1",
    });
    expect(result.current.txns[0].txCalls).toHaveLength(1);
    expect(result.current.txns[0].txCalls[0]).toMatchObject({
      toAddress: "0xcontract1",
      functionSelector: "0xselector1",
      functionCalled: "Unknown Function (0xselector1)",
    });
  });

  it.skip("should handle DECLARE transactions correctly", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance = {
      type: "DECLARE",
      sender_address: "0xsender1",
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.txns[0]).toMatchObject({
      fromAddress: "0xsender1",
    });
    expect(result.current.txns[0].txCalls).toHaveLength(1);
    expect(result.current.txns[0].txCalls[0]).toMatchObject({
      functionCalled: "Declare",
      functionSelector: "Declare",
    });
  });

  it.skip("should handle DEPLOY_ACCOUNT transactions correctly", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance = {
      type: "DEPLOY_ACCOUNT",
      contract_address_salt: "0xcontract1",
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.txns[0]).toMatchObject({
      fromAddress: "0x0xcontract1",
    });
    expect(result.current.txns[0].txCalls).toHaveLength(1);
    expect(result.current.txns[0].txCalls[0]).toMatchObject({
      toAddress: "0xcontract1",
      functionCalled: "Deploy Account",
      functionSelector: "Deploy Account",
    });
  });

  it.skip("should detect UDC contract deployments", async () => {
    const udcAddress =
      "0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf";
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", udcAddress, "0xselector1", "0x2", "0xarg1", "0xarg2"],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.txns[0].txCalls).toHaveLength(1);
    expect(result.current.txns[0].txCalls[0]).toMatchObject({
      toAddress: udcAddress,
      functionCalled: "Deploy Contract",
      functionSelector: "0xselector1",
    });
  });

  it.skip("should filter transactions by sender address", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1", "0xtx2"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance1 = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", "0xcontract1", "0xselector1", "0x1", "0xarg1"],
    };
    const mockTxInstance2 = {
      type: "INVOKE",
      sender_address: "0xsender2",
      calldata: ["0x1", "0xcontract2", "0xselector2", "0x1", "0xarg1"],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction
      .mockResolvedValueOnce(mockTxInstance1)
      .mockResolvedValueOnce(mockTxInstance2);
    mockRpcProvider.getTransactionReceipt
      .mockResolvedValueOnce(mockTxReceipt)
      .mockResolvedValueOnce(mockTxReceipt);

    const { result } = renderHook(
      () => useFetchAllTxns({ bySenderAddress: "0xsender1" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.txns[0].fromAddress).toBe("0xsender1");
  });

  it("should filter transactions by receiver address", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1", "0xtx2"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance1 = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", "0xcontract1", "0xselector1", "0x1", "0xarg1"],
    };
    const mockTxInstance2 = {
      type: "INVOKE",
      sender_address: "0xsender2",
      calldata: ["0x1", "0xcontract2", "0xselector2", "0x1", "0xarg1"],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction
      .mockResolvedValueOnce(mockTxInstance1)
      .mockResolvedValueOnce(mockTxInstance2);
    mockRpcProvider.getTransactionReceipt
      .mockResolvedValueOnce(mockTxReceipt)
      .mockResolvedValueOnce(mockTxReceipt);

    const { result } = renderHook(
      () => useFetchAllTxns({ byReceiverAddress: "0xcontract1" }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.txns[0].txCalls[0].toAddress).toBe("0xcontract1");
  });

  it.skip("should apply union filter when both sender and receiver filters are provided", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1", "0xtx2", "0xtx3"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance1 = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", "0xcontract1", "0xselector1", "0x1", "0xarg1"],
    };
    const mockTxInstance2 = {
      type: "INVOKE",
      sender_address: "0xsender2",
      calldata: ["0x1", "0xcontract2", "0xselector2", "0x1", "0xarg1"],
    };
    const mockTxInstance3 = {
      type: "INVOKE",
      sender_address: "0xsender3",
      calldata: ["0x1", "0xcontract3", "0xselector3", "0x1", "0xarg1"],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction
      .mockResolvedValueOnce(mockTxInstance1)
      .mockResolvedValueOnce(mockTxInstance2)
      .mockResolvedValueOnce(mockTxInstance3);
    mockRpcProvider.getTransactionReceipt
      .mockResolvedValueOnce(mockTxReceipt)
      .mockResolvedValueOnce(mockTxReceipt)
      .mockResolvedValueOnce(mockTxReceipt);

    const { result } = renderHook(
      () =>
        useFetchAllTxns({
          bySenderAddress: "0xsender1",
          byReceiverAddress: "0xcontract2",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should include transactions that match either sender OR receiver filter
    expect(result.current.txns).toHaveLength(2);
    expect(
      result.current.txns.some((tx) => tx.fromAddress === "0xsender1"),
    ).toBe(true);
    expect(
      result.current.txns.some((tx) =>
        tx.txCalls.some((call) => call.toAddress === "0xcontract2"),
      ),
    ).toBe(true);
  });

  it("should handle pagination correctly", async () => {
    (useBlockNumber as any).mockReturnValue({ data: 5 });

    const mockBlocks = [
      {
        timestamp: 1640995200,
        transactions: ["0xtx1"],
        block_hash: "0xblock5",
        block_number: 5,
      },
      {
        timestamp: 1640995100,
        transactions: ["0xtx2"],
        block_hash: "0xblock4",
        block_number: 4,
      },
    ];
    const mockTxInstance = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", "0xcontract1", "0xselector1", "0x1", "0xarg1"],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
    };

    mockRpcProvider.getBlock
      .mockResolvedValueOnce(mockBlocks[0])
      .mockResolvedValueOnce(mockBlocks[1]);
    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);

    const { result } = renderHook(
      () => useFetchAllTxns({ page: 1, pageSize: 1 }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(1);
    expect(result.current.totalPages).toBeGreaterThan(0);
  });

  it.skip("should sort transactions by block number and timestamp in descending order", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1", "0xtx2"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance1 = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: ["0x1", "0xcontract1", "0xselector1", "0x1", "0xarg1"],
    };
    const mockTxInstance2 = {
      type: "INVOKE",
      sender_address: "0xsender2",
      calldata: ["0x1", "0xcontract2", "0xselector2", "0x1", "0xarg1"],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction
      .mockResolvedValueOnce(mockTxInstance1)
      .mockResolvedValueOnce(mockTxInstance2);
    mockRpcProvider.getTransactionReceipt
      .mockResolvedValueOnce(mockTxReceipt)
      .mockResolvedValueOnce(mockTxReceipt);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(2);
    // All transactions from the same block should have the same timestamp
    expect(result.current.txns[0].timestamp).toBe(1640995200);
    expect(result.current.txns[1].timestamp).toBe(1640995200);
  });

  it("should handle block fetch errors gracefully", async () => {
    mockRpcProvider.getBlock.mockRejectedValue(new Error("Block not found"));

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should continue processing other blocks even if one fails
    expect(result.current.txns).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should handle transaction processing errors gracefully", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1"],
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction.mockRejectedValue(
      new Error("Transaction not found"),
    );

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should handle individual transaction errors gracefully
    expect(result.current.error).toBeNull();
  });

  it("should handle empty blocks", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: [],
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toEqual([]);
    expect(result.current.totalTxns).toBe(0);
  });

  it.skip("should handle complex calldata parsing", async () => {
    const mockBlock = {
      timestamp: 1640995200,
      transactions: ["0xtx1"],
      block_hash: "0xblock1",
      block_number: 10,
    };
    const mockTxInstance = {
      type: "INVOKE",
      sender_address: "0xsender1",
      calldata: [
        "0x2", // num_calls
        "0xcontract1",
        "0xselector1",
        "0x2",
        "0xarg1",
        "0xarg2", // first call
        "0xcontract2",
        "0xselector2",
        "0x1",
        "0xarg3", // second call
      ],
    };
    const mockTxReceipt = {
      execution_status: "SUCCEEDED",
      block_hash: "0xblock1",
      block_number: 10,
    };

    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);
    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);

    const { result } = renderHook(() => useFetchAllTxns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.txns).toHaveLength(1);
    expect(result.current.txns[0].txCalls).toHaveLength(2);
    expect(result.current.txns[0].txCalls[0]).toMatchObject({
      toAddress: "0xcontract1",
      functionSelector: "0xselector1",
    });
    expect(result.current.txns[0].txCalls[1]).toMatchObject({
      toAddress: "0xcontract2",
      functionSelector: "0xselector2",
    });
  });
});
