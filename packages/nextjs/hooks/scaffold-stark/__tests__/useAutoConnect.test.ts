import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoConnect } from "../useAutoConnect";
import { useReadLocalStorage } from "usehooks-ts";
import scaffoldConfig from "~~/scaffold.config";
import { burnerAccounts } from "@scaffold-stark/stark-burner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockConnect = vi.fn();

const burnerConnector = {
  id: "burner-wallet",
  ix: 1,
  ready: true,
  burnerAccount: burnerAccounts[1],
};

vi.mock("@starknet-react/core", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    useConnect: () => ({
      connect: mockConnect,
      connectors: [burnerConnector],
    }),
    useAccount: () => ({
      account: null,
      address: undefined,
      status: "disconnected",
    }),
  };
});

vi.mock("usehooks-ts", () => ({
  useReadLocalStorage: vi.fn(),
}));

vi.mock("~~/scaffold.config", () => ({
  default: {
    walletAutoConnect: true,
    autoConnectTTL: 10000,
  },
}));

vi.mock("@scaffold-stark/stark-burner", () => ({
  burnerAccounts: [{ address: "0x123" }, { address: "0x456" }],
  BurnerConnector: class BurnerConnector {},
}));

describe("useAutoConnect", () => {
  beforeEach(() => {
    localStorage.setItem("wasDisconnectedManually", "false");
    vi.clearAllMocks();
  });

  it("should auto-connect to the burner wallet if savedConnector exists", async () => {
    vi.mocked(useReadLocalStorage).mockImplementation((key) => {
      if (key === "lastUsedConnector") {
        return { id: "burner-wallet", ix: 1 };
      }
      if (key === "lastConnectedTime") {
        return Date.now() - 20000;
      }
      return null;
    });

    await act(async () => {
      renderHook(() => useAutoConnect());
    });

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith({
        connector: expect.objectContaining({
          id: "burner-wallet",
          burnerAccount: burnerAccounts[1],
        }),
      });
    });
  });
});
