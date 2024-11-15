import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNativeCurrencyPrice } from "../useNativeCurrencyPrice";
import { priceService } from "~~/services/web3/PriceService";
import { useGlobalState } from "~~/services/store/store";

// Mock the store
vi.mock("~~/services/store/store", () => ({
  useGlobalState: vi.fn(),
}));

// Mock the price service
vi.mock("~~/services/web3/PriceService", () => ({
  priceService: {
    getNextId: vi.fn(),
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
  },
}));

describe("useNativeCurrencyPrice", () => {
  const mockSetNativeCurrencyPrice = vi.fn();
  const mockSetStrkCurrencyPrice = vi.fn();
  const mockIds = {
    first: 123,
    second: 124,
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(useGlobalState).mockImplementation((selector) => {
      if (selector.toString().includes("setNativeCurrencyPrice")) {
        return mockSetNativeCurrencyPrice;
      }
      return mockSetStrkCurrencyPrice;
    });

    vi.mocked(priceService.getNextId).mockReturnValue(mockIds.first);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start polling on mount", () => {
    renderHook(() => useNativeCurrencyPrice());

    expect(priceService.getNextId).toHaveBeenCalled();
    expect(priceService.startPolling).toHaveBeenCalledWith(
      mockIds.first.toString(),
      mockSetNativeCurrencyPrice,
      mockSetStrkCurrencyPrice,
    );
  });

  it("should stop polling on unmount", () => {
    const { unmount } = renderHook(() => useNativeCurrencyPrice());

    unmount();

    expect(priceService.stopPolling).toHaveBeenCalledWith(
      mockIds.first.toString(),
    );
  });

  it("should maintain the same polling instance across rerenders", () => {
    const { rerender } = renderHook(() => useNativeCurrencyPrice());
    const firstCallArgs = vi.mocked(priceService.startPolling).mock.calls[0];

    vi.clearAllMocks();

    rerender();

    expect(priceService.startPolling).not.toHaveBeenCalled();
    expect(priceService.getNextId).toReturnWith(Number(firstCallArgs[0]));
  });

  it("should use store setters from global state", () => {
    renderHook(() => useNativeCurrencyPrice());

    expect(useGlobalState).toHaveBeenCalledWith(expect.any(Function));
    expect(priceService.startPolling).toHaveBeenCalledWith(
      mockIds.first.toString(),
      mockSetNativeCurrencyPrice,
      mockSetStrkCurrencyPrice,
    );
  });

  it("should handle multiple instances correctly", () => {
    vi.mocked(priceService.getNextId)
      .mockReturnValueOnce(mockIds.first)
      .mockReturnValueOnce(mockIds.second);

    const { unmount: unmount1 } = renderHook(() => useNativeCurrencyPrice());
    const { unmount: unmount2 } = renderHook(() => useNativeCurrencyPrice());

    expect(priceService.startPolling).toHaveBeenNthCalledWith(
      1,
      mockIds.first.toString(),
      mockSetNativeCurrencyPrice,
      mockSetStrkCurrencyPrice,
    );
    expect(priceService.startPolling).toHaveBeenNthCalledWith(
      2,
      mockIds.second.toString(),
      mockSetNativeCurrencyPrice,
      mockSetStrkCurrencyPrice,
    );

    unmount1();
    expect(priceService.stopPolling).toHaveBeenCalledWith(
      mockIds.first.toString(),
    );

    unmount2();
    expect(priceService.stopPolling).toHaveBeenCalledWith(
      mockIds.second.toString(),
    );
  });

  it("should handle errors in global state selectors gracefully", () => {
    vi.mocked(useGlobalState).mockImplementation(() => {
      return () => {};
    });

    expect(() => {
      renderHook(() => useNativeCurrencyPrice());
    }).not.toThrow();
  });
});
