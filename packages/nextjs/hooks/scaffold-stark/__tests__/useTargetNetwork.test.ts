import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useTargetNetwork } from "../useTargetNetwork";
import { useAccount } from "~~/hooks/useAccount";
import { useGlobalState } from "~~/services/store/store";
import scaffoldConfig from "~~/scaffold.config";

// Mock dependencies
vi.mock("~~/hooks/useAccount");
vi.mock("~~/services/store/store");
vi.mock("~~/scaffold.config", () => ({
  default: {
    targetNetworks: [
      { id: 1, name: "sepolia" },
      { id: 2, name: "mainnet" },
    ],
  },
}));

describe("useTargetNetwork", () => {
  const mockSetTargetNetwork = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAccount
    (useAccount as any).mockReturnValue({
      chainId: 1,
    });

    // Mock useGlobalState
    (useGlobalState as any)
      .mockReturnValueOnce({ id: 1, name: "sepolia" })
      .mockReturnValueOnce(mockSetTargetNetwork);
  });

  it("should return the current target network", () => {
    const { result } = renderHook(() => useTargetNetwork());

    expect(result.current.targetNetwork).toEqual({
      id: 1,
      name: "sepolia",
    });
  });

  it("should update target network when chainId changes", () => {
    const { rerender } = renderHook(() => useTargetNetwork());

    // Update chainId to 2
    (useAccount as any).mockReturnValue({
      chainId: 2,
    });

    (useGlobalState as any)
      .mockReturnValueOnce({ id: 1, name: "sepolia" })
      .mockReturnValueOnce(mockSetTargetNetwork);

    act(() => {
      rerender();
    });

    expect(mockSetTargetNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 2,
        name: "mainnet",
      }),
    );
  });

  it("should not update target network if chainId matches current network", () => {
    const { rerender } = renderHook(() => useTargetNetwork());

    (useGlobalState as any)
      .mockReturnValueOnce({ id: 1, name: "sepolia" })
      .mockReturnValueOnce(mockSetTargetNetwork);

    act(() => {
      rerender();
    });

    expect(mockSetTargetNetwork).not.toHaveBeenCalled();
  });

  it("should not update target network if new network not found", () => {
    const { rerender } = renderHook(() => useTargetNetwork());

    (useAccount as any).mockReturnValue({
      chainId: 999,
    });

    (useGlobalState as any)
      .mockReturnValueOnce({ id: 1, name: "sepolia" })
      .mockReturnValueOnce(mockSetTargetNetwork);

    act(() => {
      rerender();
    });

    expect(mockSetTargetNetwork).not.toHaveBeenCalled();
  });
});
