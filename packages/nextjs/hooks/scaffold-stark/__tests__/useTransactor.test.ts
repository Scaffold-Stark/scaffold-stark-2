import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTransactor } from "../useTransactor";
import { useAccount } from "~~/hooks/useAccount";
import { useTargetNetwork } from "../useTargetNetwork";
import { notification } from "~~/utils/scaffold-stark";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-stark";

// Mock the @starknet-start/react hooks
const sendAsyncMock = vi
  .fn()
  .mockResolvedValue({ transaction_hash: "mock-tx-hash" });
vi.mock("@starknet-start/react", () => ({
  useSendTransaction: () => ({
    sendAsync: sendAsyncMock,
  }),
  useTransactionReceipt: () => ({
    data: { receipt: { status: "ACCEPTED_ON_L1" } },
    status: "success",
  }),
}));

vi.mock("~~/utils/scaffold-stark", () => ({
  notification: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn().mockReturnValue("notification-id"),
    remove: vi.fn(),
  },
  getBlockExplorerTxLink: vi.fn().mockReturnValue("mock-block-explorer-link"),
}));

vi.mock("~~/hooks/useAccount", () => ({
  useAccount: vi.fn(() => ({
    address: "mock-address",
    status: "connected",
    chainId: 0n,
  })),
}));

vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(() => ({
    targetNetwork: { network: "mock-network" },
  })),
}));

describe("useTransactor", () => {
  beforeEach(() => {
    (useAccount as Mock).mockReturnValue({
      address: "mock-address",
      status: "connected",
      chainId: 0n,
    });

    (useTargetNetwork as Mock).mockReturnValue({
      targetNetwork: { network: "mock-network" },
    });

    // Reset the sendAsyncMock for each test
    sendAsyncMock.mockClear();
    sendAsyncMock.mockResolvedValue({ transaction_hash: "mock-tx-hash" });

    vi.clearAllMocks();
  });

  it("should execute a transaction successfully", async () => {
    const { result } = renderHook(() => useTransactor());

    const mockTx = [
      { contractAddress: "0x123", entrypoint: "test", calldata: [] },
    ];

    await act(async () => {
      const response = await result.current.writeTransaction(mockTx);
      expect(response).toBe("mock-tx-hash");
    });

    expect(notification.loading).toHaveBeenCalled();
    expect(notification.remove).toHaveBeenCalled();
    expect(sendAsyncMock).toHaveBeenCalledWith(mockTx);
  });

  it("should show error notification when wallet is not connected", async () => {
    (useAccount as Mock).mockReturnValue({
      address: undefined,
      status: "disconnected",
      chainId: undefined,
    });

    const { result } = renderHook(() => useTransactor());

    const mockTx = [
      { contractAddress: "0x123", entrypoint: "test", calldata: [] },
    ];

    await act(async () => {
      const response = await result.current.writeTransaction(mockTx);
      expect(response).toBeUndefined();
    });

    expect(notification.error).toHaveBeenCalledWith("Cannot access account");
  });

  it("should handle transaction failure", async () => {
    const mockError = new Error("Contract mock-error");
    sendAsyncMock.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useTransactor());

    const mockTx = [
      { contractAddress: "0x123", entrypoint: "test", calldata: [] },
    ];

    await expect(result.current.writeTransaction(mockTx)).rejects.toThrow(
      mockError,
    );

    expect(notification.error).toHaveBeenCalled();
  });

  it("should execute the transaction and return the transaction hash", async () => {
    const { result } = renderHook(() => useTransactor());

    const mockTx = [
      { contractAddress: "0x123", entrypoint: "test", calldata: [] },
    ];

    await act(async () => {
      const transactionHash = await result.current.writeTransaction(mockTx);
      expect(transactionHash).toBe("mock-tx-hash");
    });
  });

  it("should set blockExplorerTxURL correctly", async () => {
    const { result } = renderHook(() => useTransactor());

    const mockTx = [
      { contractAddress: "0x123", entrypoint: "test", calldata: [] },
    ];

    await act(async () => {
      const transactionHash = await result.current.writeTransaction(mockTx);
      expect(transactionHash).toBe("mock-tx-hash");
    });

    expect(getBlockExplorerTxLink).toHaveBeenCalledWith(
      "mock-network",
      "mock-tx-hash",
    );
  });

  it("should handle string transaction results", async () => {
    sendAsyncMock.mockResolvedValueOnce("mock-tx-hash");

    const { result } = renderHook(() => useTransactor());

    const mockTx = [
      { contractAddress: "0x123", entrypoint: "test", calldata: [] },
    ];

    await act(async () => {
      const txHash = await result.current.writeTransaction(mockTx);
      expect(txHash).toBe("mock-tx-hash");
    });
  });
});
