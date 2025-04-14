import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
} from "vitest";
import scaffoldConfig from "~~/scaffold.config";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
mockFetch.mockImplementation((url: string) => {
  if (url === "/api/price") {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ starknet: { usd: 100 } }),
    });
  }
  return Promise.reject(new Error("Unknown URL"));
});

import { priceService } from "../PriceService";

describe("PriceService", () => {
  let mockSetStrkCurrencyPrice: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Reset mocks and timers before each test
    vi.useFakeTimers();
    mockSetStrkCurrencyPrice = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.useRealTimers();
    // Stop all polling to clean up
    priceService["listeners"].forEach((_, ref) => {
      priceService.stopPolling(ref);
    });
  });

  describe("Singleton Pattern", () => {
    it("should always return the same instance", () => {
      const instance1 = priceService;
      const instance2 = priceService;
      expect(instance1).toBe(instance2);
    });
  });

  describe("ID Generation", () => {
    it("should generate incremental IDs", () => {
      const id1 = priceService.getNextId();
      const id2 = priceService.getNextId();
      expect(id2).toBe(id1 + 1);
    });
  });

  describe("Polling Management", () => {
    it("should start polling when first listener is added", () => {
      const ref = priceService.getNextId();
      priceService.startPolling(
        ref,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      expect(priceService["intervalId"]).not.toBeNull();
      expect(priceService["listeners"].size).toBe(1);
    });

    it("should not create multiple intervals for multiple listeners", () => {
      const ref1 = priceService.getNextId();
      const ref2 = priceService.getNextId();

      priceService.startPolling(
        ref1,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );
      const firstIntervalId = priceService["intervalId"];

      priceService.startPolling(
        ref2,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      expect(priceService["intervalId"]).toBe(firstIntervalId);
      expect(priceService["listeners"].size).toBe(2);
    });

    it("should stop polling when last listener is removed", () => {
      const ref = priceService.getNextId();
      priceService.startPolling(
        ref,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );
      priceService.stopPolling(ref);

      expect(priceService["intervalId"]).toBeNull();
      expect(priceService["listeners"].size).toBe(0);
    });

    it("should not stop polling if other listeners exist", () => {
      const ref1 = priceService.getNextId();
      const ref2 = priceService.getNextId();

      priceService.startPolling(
        ref1,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );
      priceService.startPolling(
        ref2,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      priceService.stopPolling(ref1);

      expect(priceService["intervalId"]).not.toBeNull();
      expect(priceService["listeners"].size).toBe(1);
    });

    it("should notify all listeners of price updates", async () => {
      const mockListener1 = { native: vi.fn(), strk: vi.fn() };
      const mockListener2 = { native: vi.fn(), strk: vi.fn() };

      const ref1 = priceService.getNextId();
      const ref2 = priceService.getNextId();

      priceService.startPolling(ref1, mockListener1.native, mockListener1.strk);
      priceService.startPolling(ref2, mockListener2.native, mockListener2.strk);

      await vi.advanceTimersByTimeAsync(0);

      expect(mockListener1.strk).toHaveBeenCalled();
      expect(mockListener2.strk).toHaveBeenCalled();
    });
  });

  describe("Price Updates", () => {
    it("should update STRK price and notify listeners immediately after starting", async () => {
      const mockStrkPrice = 100;

      const ref = priceService.getNextId();
      priceService.startPolling(
        ref,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      await vi.advanceTimersByTimeAsync(0);

      expect(mockSetStrkCurrencyPrice).toHaveBeenCalledWith(mockStrkPrice);
    });

    it("should update STRK price on polling interval", async () => {
      const mockStrkPrice = 100;

      const ref = priceService.getNextId();
      priceService.startPolling(
        ref,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      await vi.advanceTimersByTimeAsync(0);
      vi.clearAllMocks();

      await vi.advanceTimersByTimeAsync(scaffoldConfig.pollingInterval);

      expect(mockSetStrkCurrencyPrice).toHaveBeenCalledWith(mockStrkPrice);
    });

    it("should use cached prices when subsequent fetch fails", async () => {
      const mockStrkPrice = 100;

      mockFetch.mockImplementationOnce((url: string) => {
        if (url === "/api/price") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ starknet: { usd: mockStrkPrice } }),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      });

      const ref = priceService.getNextId();
      priceService.startPolling(
        ref,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      await vi.advanceTimersByTimeAsync(0);

      vi.clearAllMocks();
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );

      await vi.advanceTimersByTimeAsync(scaffoldConfig.pollingInterval);

      expect(mockSetStrkCurrencyPrice).toHaveBeenCalledWith(mockStrkPrice);
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      // Mock the entire function to avoid using fetch
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error("Network error")),
      );

      const ref = priceService.getNextId();
      priceService.startPolling(
        ref,
        vi.fn(),
        mockSetStrkCurrencyPrice,
      );

      // Should not throw error
      await expect(priceService["fetchPrices"]()).resolves.not.toThrow();
    });

    it("should handle malformed API responses", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: "format" }),
        }),
      );

      await expect(priceService["fetchPrices"]()).resolves.not.toThrow();
    });

    it("should retry failed requests up to maximum attempts", async () => {
      const mockError = new Error("Network error");
      mockFetch
        // First attempt
        .mockRejectedValueOnce(mockError)
        // Second attempt
        .mockRejectedValueOnce(mockError)
        // Third attempt
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ starknet: { usd: 100 } }),
        });

      await priceService["fetchPrices"]();
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 attempts
    });

    it("should handle non-200 API responses", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
        }),
      );

      await expect(priceService["fetchPrices"]()).resolves.not.toThrow();
    });
  });

  describe("Price Getters", () => {
    it("should return current STRK price", () => {
      const mockStrkPrice = 100;

      priceService["currentStrkCurrencyPrice"] = mockStrkPrice;

      expect(priceService.getCurrentStrkCurrencyPrice()).toBe(mockStrkPrice);
    });
  });

  describe("Resource Cleanup", () => {
    it("should properly clean up resources when stopping polling", () => {
      const ref = priceService.getNextId();
      priceService.startPolling(ref, vi.fn(), vi.fn());

      const intervalId = priceService["intervalId"];
      priceService.stopPolling(ref);

      expect(priceService["intervalId"]).toBeNull();
      expect(priceService["listeners"].size).toBe(0);
    });
  });

  describe("Invalid Usage", () => {
    it("should handle stopping non-existent polling reference", () => {
      expect(() => priceService.stopPolling(999)).not.toThrow();
    });

    it("should handle duplicate polling starts with same reference", () => {
      const ref = priceService.getNextId();
      priceService.startPolling(ref, vi.fn(), vi.fn());
      expect(() =>
        priceService.startPolling(ref, vi.fn(), vi.fn()),
      ).not.toThrow();
    });
  });
});
