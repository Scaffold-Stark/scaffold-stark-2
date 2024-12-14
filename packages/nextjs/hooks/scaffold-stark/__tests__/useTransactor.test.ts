import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTransactor } from "../useTransactor";
import { notification } from "~~/utils/scaffold-stark";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-stark";

vi.mock("~~/utils/scaffold-stark", () => ({
  notification: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn().mockReturnValue("notification-id"),
    remove: vi.fn(),
  },
  getBlockExplorerTxLink: vi.fn(),
}));

vi.mock("~~/hooks/useAccount", () => ({
  useAccount: vi.fn(() => ({
    account: {
      getChainId: vi.fn().mockResolvedValue("mock-network-id"),
      execute: vi.fn(),
    },
    address: "mock-address",
    status: "connected",
  })),
}));

vi.mock("./useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(() => ({
    targetNetwork: { network: "mock-network" },
  })),
}));

describe("useTransactor", () => {
  let walletClientMock: {
    getChainId: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    walletClientMock = {
      getChainId: vi.fn().mockResolvedValue("mock-network-id"),
      execute: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("should execute a transaction successfully", async () => {
    const mockTransaction = vi
      .fn()
      .mockResolvedValue({ transaction_hash: "mock-tx-hash" });
    const { result } = renderHook(() => useTransactor(walletClientMock));

    const txHash = await result.current(mockTransaction);

    expect(walletClientMock.getChainId).toHaveBeenCalled();
    expect(mockTransaction).toHaveBeenCalled();
    expect(notification.loading).toHaveBeenCalledWith(
      expect.objectContaining({
        props: { message: "Awaiting for user confirmation" },
      })
    );
    expect(notification.success).toHaveBeenCalledWith(
      expect.objectContaining({
        props: { message: "Transaction completed successfully!" },
      }),
      { icon: "🎉" }
    );
    expect(txHash).toBe("mock-tx-hash");
  });

  it("should handle transaction failure", async () => {
    const mockError = new Error("Contract mock-error");
    const mockTransaction = vi.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useTransactor(walletClientMock));

    await expect(result.current(mockTransaction)).rejects.toThrow(mockError);

    expect(notification.error).toHaveBeenCalledWith("Contract mock-error");
  });

  it("should handle string transaction results", async () => {
    const mockTransaction = vi.fn().mockResolvedValue("mock-tx-hash");
    const { result } = renderHook(() => useTransactor(walletClientMock));

    const txHash = await result.current(mockTransaction);

    expect(txHash).toBe("mock-tx-hash");
  });

  it("should handle missing transaction function", async () => {
    const { result } = renderHook(() => useTransactor(walletClientMock));

    await expect(result.current(null)).rejects.toThrow(
      "Incorrect transaction passed to transactor"
    );
  });
});
