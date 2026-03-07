import { renderHook } from "@testing-library/react";
import { useAutoConnect } from "../useAutoConnect";
import { useConnect } from "@starknet-start/react";
import { useReadLocalStorage } from "usehooks-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("usehooks-ts", () => ({
  useReadLocalStorage: vi.fn(),
}));

vi.mock("@starknet-start/react", async (importOriginal) => {
  const actual = (await import("@starknet-start/react")) as Record<string, any>;
  return {
    ...actual,
    useConnect: vi.fn(),
    useAccount: () => ({
      address: undefined,
      status: "disconnected",
    }),
  };
});

vi.mock("~~/hooks/useAccount", () => ({
  useAccount: () => ({
    address: undefined,
    status: "disconnected",
  }),
}));

vi.mock("~~/scaffold.config", () => ({
  default: {
    walletAutoConnect: true,
    autoConnectTTL: 10000,
  },
}));

describe("useAutoConnect", () => {
  let mockConnect: ReturnType<typeof vi.fn>;
  let mockConnectors: any[];

  beforeEach(() => {
    mockConnect = vi.fn();
    mockConnectors = [
      { name: "wallet-1", instanceId: "wallet-1" },
      { name: "wallet-2", instanceId: "wallet-2" },
    ];

    (useConnect as ReturnType<typeof vi.fn>).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors,
    });

    vi.clearAllMocks();
  });

  it("should auto-connect if walletAutoConnect is enabled and a saved connector exists", () => {
    vi.mocked(useReadLocalStorage).mockImplementation((key) => {
      if (key === "lastUsedConnector") return { id: "wallet-1" };
      if (key === "lastConnectedTime") return Date.now() - 20000;
      if (key === "wasDisconnectedManually") return false;
      return null;
    });

    renderHook(() => useAutoConnect());

    expect(mockConnect).toHaveBeenCalledWith({
      connector: expect.objectContaining({ name: "wallet-1" }),
    });
  });

  it("should not auto-connect if wasDisconnectedManually is true", () => {
    vi.mocked(useReadLocalStorage).mockImplementation((key) => {
      if (key === "lastUsedConnector") return { id: "wallet-1" };
      if (key === "lastConnectedTime") return Date.now() - 20000;
      if (key === "wasDisconnectedManually") return true;
      return null;
    });

    renderHook(() => useAutoConnect());

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("should not connect if there is no saved connector", () => {
    vi.mocked(useReadLocalStorage).mockImplementation((key) => {
      if (key === "wasDisconnectedManually") return false;
      return null;
    });

    renderHook(() => useAutoConnect());

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("should not connect if saved connector is not found in the connectors list", () => {
    vi.mocked(useReadLocalStorage).mockImplementation((key) => {
      if (key === "lastUsedConnector") return { id: "non-existent-connector" };
      if (key === "lastConnectedTime") return Date.now() - 20000;
      if (key === "wasDisconnectedManually") return false;
      return null;
    });

    renderHook(() => useAutoConnect());

    expect(mockConnect).not.toHaveBeenCalled();
  });
});
