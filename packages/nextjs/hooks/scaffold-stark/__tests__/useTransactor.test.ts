import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act, render } from "@testing-library/react";
import { useTransactor } from "../useTransactor";
import { useAccount } from "~~/hooks/useAccount";
import { useTargetNetwork } from "../useTargetNetwork";
import { notification } from "~~/utils/scaffold-stark";
import { AccountInterface } from "starknet";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-stark";

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
    account: {
      getChainId: vi.fn().mockResolvedValue("mock-network-id"),
      execute: vi.fn(),
    },
    address: "mock-address",
    status: "connected",
  })),
}));

vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(() => ({
    targetNetwork: { network: "mock-network" },
  })),
}));

describe("useTransactor", () => {
  let walletClientMock: Partial<AccountInterface>;

  beforeEach(() => {
    walletClientMock = {
      address: "mock-address",
      getChainId: vi.fn().mockResolvedValue("mock-chain-id"),
      execute: vi.fn().mockResolvedValue({ transaction_hash: "mock-tx-hash" }),
    };
    (useAccount as Mock).mockReturnValue({
      account: walletClientMock,
      address: "mock-address",
      status: "connected",
    });

    (useTargetNetwork as Mock).mockReturnValue({
      targetNetwork: { network: "mock-network" },
    });

    vi.clearAllMocks();
  });

  it("should execute a transaction successfully", async () => {
    const { result } = renderHook(() =>
      useTransactor(walletClientMock as AccountInterface),
    );

    await act(async () => {
      const response = await result.current(() =>
        Promise.resolve("mock-tx-hash"),
      );
      expect(response).toBe("mock-tx-hash");
    });

    expect(notification.loading).toHaveBeenCalledWith(
      expect.objectContaining({
        props: { message: "Awaiting for user confirmation" },
      }),
    );

    expect(notification.success).toHaveBeenCalledWith(expect.any(Object), {
      icon: "🎉",
    });

    const successNotificationCall = (
      notification.success as ReturnType<typeof vi.fn>
    ).mock.calls[0][0];
    const { container } = render(successNotificationCall);

    // Verify message content
    const messageElement = container.querySelector("p");
    expect(messageElement?.textContent).toBe(
      "Transaction completed successfully!",
    );

    const linkElement = container.querySelector("a");
    expect(linkElement?.getAttribute("href")).toBe("mock-block-explorer-link");
    expect(linkElement?.textContent).toBe("check out transaction");
  });

  it("should show error notification when wallet client is unavailable", async () => {
    (useAccount as Mock).mockReturnValue({ account: null });

    const { result } = renderHook(() => useTransactor());

    await act(async () => {
      const response = await result.current(() =>
        Promise.resolve({ transaction_hash: "mock-tx-hash" }),
      );
      expect(response).toBeUndefined();
    });

    expect(notification.error).toHaveBeenCalledWith("Cannot access account");
  });

  it("should handle transaction failure", async () => {
    const mockError = new Error("Contract mock-error");
    const mockTransaction = vi.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() =>
      useTransactor(walletClientMock as AccountInterface),
    );

    await expect(result.current(mockTransaction)).rejects.toThrow(mockError);

    expect(notification.error).toHaveBeenCalledWith("Contract mock-error");
  });

  it("should execute the transaction and return the transaction hash", async () => {
    const { result } = renderHook(() =>
      useTransactor(walletClientMock as AccountInterface),
    );

    const mockTx = vi
      .fn()
      .mockResolvedValue({ transaction_hash: "mock-tx-hash" });

    await act(async () => {
      const transactionHash = await result.current(mockTx);
      expect(transactionHash).toBe("mock-tx-hash");
    });
  });

  it("should set blockExplorerTxURL to an empty string if networkId is falsy", async () => {
    const mockGetChainId = vi.fn().mockResolvedValue(null);
    (walletClientMock as any).getChainId = mockGetChainId;

    (getBlockExplorerTxLink as Mock).mockReturnValue("");

    const { result } = renderHook(() =>
      useTransactor(walletClientMock as AccountInterface),
    );

    const mockTx = vi
      .fn()
      .mockResolvedValue({ transaction_hash: "mock-tx-hash" });

    await act(async () => {
      const transactionHash = await result.current(mockTx);
      expect(transactionHash).toBe("mock-tx-hash");
    });

    expect(getBlockExplorerTxLink).not.toHaveBeenCalled();

    const blockExplorerTxURL = mockGetChainId()
      ? getBlockExplorerTxLink("mock-network", "mock-tx-hash")
      : "";
    expect(blockExplorerTxURL).toBe("");
  });

  it("should handle string transaction results", async () => {
    const mockTransaction = vi.fn().mockResolvedValue("mock-tx-hash");
    const { result } = renderHook(() =>
      useTransactor(walletClientMock as AccountInterface),
    );

    const txHash = await result.current(mockTransaction);

    expect(txHash).toBe("mock-tx-hash");
  });

  it("should handle missing transaction function", async () => {
    const { result } = renderHook(() =>
      useTransactor(walletClientMock as AccountInterface),
    );

    await expect(result.current(undefined as any)).rejects.toThrow(
      "Incorrect transaction passed to transactor",
    );
  });
});
