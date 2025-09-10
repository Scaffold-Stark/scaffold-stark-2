import { renderHook } from "@testing-library/react";
import { useAutoConnect } from "../useAutoConnect";
import { useConnect } from "@starknet-react/core";
import { useReadLocalStorage } from "usehooks-ts";
import { burnerAccounts } from "@scaffold-stark/stark-burner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("usehooks-ts", () => ({
  useReadLocalStorage: vi.fn(),
}));

vi.mock("@starknet-react/core", async (importOriginal) => {
  const actual = (await import("@starknet-react/core")) as Record<string, any>;
  return {
    ...actual,
    useConnect: vi.fn(),
    useAccount: () => ({
      account: null,
      address: undefined,
      status: "disconnected",
    }),
  };
});

vi.mock("@scaffold-stark/stark-burner", () => ({
  burnerAccounts: [{ address: "0x123" }, { address: "0x456" }],
  BurnerConnector: class {},
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
      { id: "wallet-1", ready: true },
      {
        id: "burner-wallet",
        ready: true,
        burnerAccount: undefined,
      },
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
      connector: expect.objectContaining({ id: "wallet-1" }),
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

  it("should auto-connect to the burner wallet and set burnerAccount if savedConnector exists", () => {
    vi.mocked(useReadLocalStorage).mockImplementation((key) => {
      if (key === "lastUsedConnector") return { id: "burner-wallet", ix: 1 };
      if (key === "lastConnectedTime") return Date.now() - 20000;
      if (key === "wasDisconnectedManually") return false;
      return null;
    });

    const burnerConnector = mockConnectors.find(
      (c) => c.id === "burner-wallet",
    );
    if (burnerConnector) {
      burnerConnector.burnerAccount = burnerAccounts[1];
    }

    renderHook(() => useAutoConnect());

    expect(mockConnect).toHaveBeenCalledWith({
      connector: expect.objectContaining({
        id: "burner-wallet",
        burnerAccount: burnerAccounts[1],
      }),
    });
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
