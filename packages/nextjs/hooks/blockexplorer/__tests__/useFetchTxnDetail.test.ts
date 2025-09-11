import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetchTxnDetail } from "../useFetchTxnDetail";
import { useTargetNetwork } from "../../scaffold-stark/useTargetNetwork";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { devnetUDCAddress } from "~~/utils/Constants";

// Mock dependencies
vi.mock("../../scaffold-stark/useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
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
  deepMergeContracts: vi.fn(() => ({})),
}));

// Mock RpcProvider
const mockRpcProvider = {
  getTransaction: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getBlock: vi.fn(),
};

vi.mock("starknet", () => ({
  RpcProvider: vi.fn(() => mockRpcProvider),
  hash: {
    starknetKeccak: vi.fn((name) => `0x${name.length.toString(16)}`),
  },
  num: {
    toHex: vi.fn((value) => `0x${value.toString(16)}`),
  },
  encode: {
    sanitizeHex: vi.fn((hex) => hex?.toLowerCase() || ""),
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

describe("useFetchTxnDetail", () => {
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
  });

  it("should return null when no transaction hash is provided", async () => {
    const { result } = renderHook(() => useFetchTxnDetail(), {
      wrapper: createWrapper(),
    });

    expect(result.current.transactionDetail).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch INVOKE transaction details", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: [
        "0x1",
        "0xcontract123",
        "0xselector456",
        "0x2",
        "0xarg1",
        "0xarg2",
      ],
      signature: ["0xsig1", "0xsig2"],
      nonce: "0x1",
      max_fee: "1000000000000000",
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
        actual_fee: { amount: "500000000000000" },
        execution_resources: {
          steps: 1000,
          l1_gas: 50,
          l2_gas: 100,
        },
        events: [
          {
            from_address: "0xcontract123",
            keys: ["0xkey1"],
            data: ["0xdata1"],
          },
        ],
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      type: "INVOKE",
      version: "0x3",
      status: "SUCCEEDED",
      blockNumber: 100,
      timestamp: 1640995200,
      senderAddress: "0xsender123",
      actualFee: "500000000000000",
      gasUsed: "1000",
      l1GasConsumed: "50",
      l2GasConsumed: "100",
    });

    expect(result.current.transactionDetail?.functionCalls).toHaveLength(1);
    expect(result.current.transactionDetail?.functionCalls?.[0]).toMatchObject({
      contractAddress: "0xcontract123",
      entrypoint: "Unknown Function (0xselector456)",
      calldata: ["0xarg1", "0xarg2"],
      selector: "0xselector456",
    });

    expect(result.current.transactionDetail?.events).toHaveLength(1);
    expect(result.current.transactionDetail?.logs).toEqual([
      "0xcontract123",
      "0xkey1",
      "0xdata1",
    ]);
  });

  it("should fetch DECLARE transaction details", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "DECLARE",
      version: "0x3",
      sender_address: "0xsender123",
      signature: ["0xsig1", "0xsig2"],
      nonce: "0x1",
      max_fee: "1000000000000000",
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
        actual_fee: { amount: "500000000000000" },
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      type: "DECLARE",
      version: "0x3",
      status: "SUCCEEDED",
      senderAddress: "0xsender123",
      actualFee: "500000000000000",
    });
  });

  it("should fetch DEPLOY_ACCOUNT transaction details", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "DEPLOY_ACCOUNT",
      version: "0x3",
      contract_address_salt: "0xcontract123",
      signature: ["0xsig1", "0xsig2"],
      nonce: "0x1",
      max_fee: "1000000000000000",
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
        actual_fee: { amount: "500000000000000" },
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      type: "DEPLOY_ACCOUNT",
      version: "0x3",
      status: "SUCCEEDED",
      contractAddress: "0xcontract123",
    });
  });

  it("should fetch DEPLOY transaction details", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "DEPLOY",
      constructor_calldata: ["0xsender123", "0xarg1", "0xarg2"],
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
        actual_fee: "500000000000000",
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      type: "DEPLOY",
      status: "SUCCEEDED",
      senderAddress: "0xsender123",
    });
  });

  it("should handle UDC deployment detection in INVOKE transactions", async () => {
    const txHash = "0x123456789abcdef";
    const udcAddress = devnetUDCAddress;
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: ["0x1", udcAddress, "0xselector456", "0x2", "0xarg1", "0xarg2"],
      signature: ["0xsig1"],
      nonce: "0x1",
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail?.type).toBe("DEPLOY");
    expect(result.current.transactionDetail?.functionCalls?.[0]).toMatchObject({
      contractAddress: udcAddress,
      entrypoint: "Deploy Contract",
      calldata: ["0xarg1", "0xarg2"],
      selector: "0xselector456",
    });
  });

  it("should handle transaction receipt without execution resources", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: [],
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
        actual_fee: "500000000000000",
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      type: "INVOKE",
      status: "SUCCEEDED",
      actualFee: "500000000000000",
    });
    expect(result.current.transactionDetail?.gasUsed).toBeUndefined();
    expect(result.current.transactionDetail?.l1GasConsumed).toBeUndefined();
    expect(result.current.transactionDetail?.l2GasConsumed).toBeUndefined();
  });

  it("should handle failed transactions with revert reason", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: [],
    };
    const mockTxReceipt = {
      value: {
        execution_status: "REVERTED",
        block_hash: "0xblock123",
        block_number: 100,
        revert_reason: "Transaction reverted: insufficient balance",
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      status: "REVERTED",
      revertReason: "Transaction reverted: insufficient balance",
    });
  });

  it("should handle block fetch failure gracefully", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: [],
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
      },
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockRejectedValue(new Error("Block not found"));

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      status: "SUCCEEDED",
      blockNumber: 100,
    });
    expect(result.current.transactionDetail?.timestamp).toBeUndefined();
  });

  it("should handle calldata parsing errors gracefully", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: ["invalid", "calldata", "format"],
      signature: [],
      nonce: "0x1",
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
      },
    };
    const mockBlock = {
      timestamp: 1640995200,
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue(mockBlock);

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      transactionHash: txHash,
      type: "INVOKE",
      status: "SUCCEEDED",
      senderAddress: "0xsender123",
    });
    // Should handle parsing error gracefully and still return basic transaction info
  });

  it.skip("should handle complete fetch errors", async () => {
    const txHash = "0x123456789abcdef";

    mockRpcProvider.getTransaction.mockRejectedValue(
      new Error("Transaction not found"),
    );
    mockRpcProvider.getTransactionReceipt.mockRejectedValue(
      new Error("Receipt not found"),
    );

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.transactionDetail).toBeUndefined();
  });

  it.skip("should refetch data when refetch is called", async () => {
    const txHash = "0x123456789abcdef";

    // Initial mock - transaction not found
    mockRpcProvider.getTransaction.mockRejectedValue(
      new Error("Transaction not found"),
    );
    mockRpcProvider.getTransactionReceipt.mockRejectedValue(
      new Error("Receipt not found"),
    );

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 },
    );

    expect(result.current.error).toBeInstanceOf(Error);

    // Now mock successful response
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: [],
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
      },
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue({ timestamp: 1640995200 });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.transactionDetail?.transactionHash).toBe(txHash);
    });
  });

  it("should handle fee extraction from different formats", async () => {
    const txHash = "0x123456789abcdef";
    const mockTxInstance = {
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xsender123",
      calldata: [],
      max_fee: { amount: "2000000000000000" },
    };
    const mockTxReceipt = {
      value: {
        execution_status: "SUCCEEDED",
        block_hash: "0xblock123",
        block_number: 100,
        actual_fee: "1500000000000000", // String format
      },
    };

    mockRpcProvider.getTransaction.mockResolvedValue(mockTxInstance);
    mockRpcProvider.getTransactionReceipt.mockResolvedValue(mockTxReceipt);
    mockRpcProvider.getBlock.mockResolvedValue({ timestamp: 1640995200 });

    const { result } = renderHook(() => useFetchTxnDetail(txHash), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactionDetail).toMatchObject({
      actualFee: "1500000000000000",
      maxFee: "2000000000000000",
    });
  });
});
