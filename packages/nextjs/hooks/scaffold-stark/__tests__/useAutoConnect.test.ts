import { renderHook } from "@testing-library/react";
import { useAutoConnect } from "../useAutoConnect";
import { useConnect } from "@starknet-react/core";
import { useReadLocalStorage } from "usehooks-ts";
import scaffoldConfig from "~~/scaffold.config";
import { burnerAccounts } from "@scaffold-stark/stark-burner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependencies
vi.mock("usehooks-ts", () => ({
  useReadLocalStorage: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useConnect: vi.fn(),
}));

vi.mock("~~/scaffold.config", () => ({
  default: {
    walletAutoConnect: true,
  },
}));

vi.mock("@scaffold-stark/stark-burner", () => ({
  burnerAccounts: [{ address: "0x123" }, { address: "0x456" }],
  BurnerConnector: vi.fn(),
}));

describe("useAutoConnect", () => {
  let mockConnect: ReturnType<typeof vi.fn>;
  let mockConnectors: any[];

  beforeEach(() => {
    mockConnect = vi.fn();
    mockConnectors = [
      { id: "wallet-1" },
      { id: "burner-wallet", burnerAccount: null },
    ];
    (useConnect as ReturnType<typeof vi.fn>).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors,
    });
    vi.spyOn(scaffoldConfig, "walletAutoConnect", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should auto-connect if walletAutoConnect is enabled and a saved connector exists", () => {
    vi.mocked(useReadLocalStorage).mockReturnValue({ id: "wallet-1" });

    renderHook(() => useAutoConnect());

    expect(mockConnect).toHaveBeenCalledWith({
      connector: expect.objectContaining({ id: "wallet-1" }),
    });
  });

  it("should not auto-connect if walletAutoConnect is disabled", () => {
    vi.spyOn(scaffoldConfig, "walletAutoConnect", "get").mockReturnValue(
      false as true,
    );
    vi.mocked(useReadLocalStorage).mockReturnValue({ id: "wallet-1" });

    renderHook(() => useAutoConnect());

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("should auto-connect to the burner wallet and set burnerAccount if savedConnector exists", () => {
    vi.mocked(useReadLocalStorage).mockReturnValue({
      id: "burner-wallet",
      ix: 1,
    });
    mockConnectors = [
      { id: "wallet-1" },
      {
        id: "burner-wallet",
        burnerAccount: burnerAccounts[1],
      },
    ];
    (useConnect as ReturnType<typeof vi.fn>).mockReturnValue({
      connect: mockConnect,
      connectors: mockConnectors,
    });

    renderHook(() => useAutoConnect());

    expect(mockConnect).toHaveBeenCalledWith({
      connector: expect.objectContaining({
        id: "burner-wallet",
        burnerAccount: burnerAccounts[1],
      }),
    });
  });

  it("should not connect if there is no saved connector", () => {
    vi.mocked(useReadLocalStorage).mockReturnValue(null);

    renderHook(() => useAutoConnect());

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("should not connect if saved connector is not found in the connectors list", () => {
    vi.mocked(useReadLocalStorage).mockReturnValue({
      id: "non-existent-connector",
    });

    renderHook(() => useAutoConnect());

    expect(mockConnect).not.toHaveBeenCalled();
  });
});
