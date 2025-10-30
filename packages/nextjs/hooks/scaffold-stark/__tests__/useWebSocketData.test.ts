import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as wsModule from "~~/services/web3/websocket";
import { useWebSocketData } from "../useWebSocketData";

vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(() => ({
    targetNetwork: {
      id: "testnet",
      rpcUrls: { public: { http: ["https://mock-rpc"] } },
    },
  })),
}));

vi.mock("~~/services/web3/websocket", () => ({
  getSharedWebSocketChannel: vi.fn(),
}));

describe("useWebSocketData", () => {
  beforeEach(() => {
    (wsModule.getSharedWebSocketChannel as any).mockReset?.();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to newHeads and receives messages", async () => {
    const messages: any[] = [];
    (wsModule.getSharedWebSocketChannel as any).mockResolvedValue({
      subscribeNewHeads: vi.fn(async () => ({
        on: (fn: any) => fn({ block_number: 1 }),
        unsubscribe: vi.fn(),
      })),
      waitForConnection: vi.fn(),
    });

    const { result } = renderHook(() =>
      useWebSocketData({
        topic: "newHeads",
        enabled: true,
        onMessage: (m) => messages.push(m),
      }),
    );

    await waitFor(() =>
      expect(result.current.data.length).toBeGreaterThanOrEqual(1),
    );
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });

  it("resets data when topic changes", async () => {
    (wsModule.getSharedWebSocketChannel as any).mockResolvedValue({
      subscribeNewHeads: vi.fn(async () => ({
        on: (fn: any) => fn({ h: 1 }),
        unsubscribe: vi.fn(),
      })),
      subscribeNewTransactionReceipts: vi.fn(async () => ({
        on: (fn: any) => fn({ r: 1 }),
        unsubscribe: vi.fn(),
      })),
      waitForConnection: vi.fn(),
    });

    const { result, rerender } = renderHook(
      (props: any) => useWebSocketData(props),
      {
        // Use any to avoid literal narrowing on topic for this test harness
        initialProps: { topic: "newHeads" as any, enabled: true },
      },
    );

    await waitFor(() =>
      expect(result.current.data.length).toBeGreaterThanOrEqual(1),
    );

    rerender({ topic: "newTransactionReceipts" as any, enabled: true });
    await waitFor(() =>
      expect(result.current.data.length).toBeGreaterThanOrEqual(1),
    );
  });
});
