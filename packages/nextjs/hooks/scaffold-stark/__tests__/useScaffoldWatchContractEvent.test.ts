import { renderHook, waitFor } from "@testing-library/react";
import { useScaffoldWatchContractEvent } from "../useScaffoldWatchContractEvent";
import { useDeployedContractInfo } from "../useDeployedContractInfo";
import { useTargetNetwork } from "../useTargetNetwork";
import { useProvider } from "@starknet-react/core";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("starknet", async () => {
  const actual: typeof import("starknet") = await vi.importActual("starknet");
  return {
    ...actual,
  };
});

vi.mock("../useDeployedContractInfo", () => ({
  useDeployedContractInfo: vi.fn(),
}));
vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));
vi.mock("@starknet-react/core", () => ({
  useProvider: vi.fn(),
}));
vi.mock("../useScaffoldWebSocketEvents", () => ({
  useScaffoldWebSocketEvents: vi.fn(),
}));

describe("useScaffoldWatchContractEvent", () => {
  const mockContractName = "MyContract";
  const mockEventName = "MyEvent";
  const mockTargetNetwork = {
    id: "testnet",
    rpcUrls: { public: { http: ["https://mock-rpc-url"] } },
  };

  const mockDeployedContractData = {
    address: "0x123",
    abi: [{ type: "event", name: "Module::MyEvent" }],
  };

  const mockLog = {
    data: ["0x01"],
    keys: ["0xabc"],
    block_number: 1,
    block_hash: "0xblock",
    transaction_hash: "0xtx",
    from_address: "0xfrom",
  };

  const fakeBlock = { block_hash: "0xblock" };
  const fakeTx = { transaction_hash: "0xtx" };
  const fakeReceipt = { transaction_hash: "0xtx" };

  beforeEach(async () => {
    // @ts-ignore
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: mockDeployedContractData,
      isLoading: false,
    });
    // @ts-ignore
    (useTargetNetwork as vi.Mock).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });
    // @ts-ignore
    (useProvider as vi.Mock).mockReturnValue({
      provider: {},
    });

    const { useScaffoldWebSocketEvents } = await import(
      "../useScaffoldWebSocketEvents"
    );
    (useScaffoldWebSocketEvents as unknown as any).mockImplementation(() => ({
      isLoading: false,
      error: null,
      events: [],
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("calls onLogs when WS events arrive", async () => {
    const { useScaffoldWebSocketEvents } = await import(
      "../useScaffoldWebSocketEvents"
    );
    (useScaffoldWebSocketEvents as unknown as any).mockImplementationOnce(
      ({ onEvent }: any) => {
        const eventAbi = {
          name: mockDeployedContractData.abi[0].name,
          members: [{ name: "foo", type: "core::felt252", kind: "data" }],
        } as any;
        const payload = {
          event: eventAbi,
          log: mockLog,
          block: fakeBlock,
          transaction: fakeTx,
          receipt: fakeReceipt,
          args: { foo: "bar" },
          parsedArgs: { parsed: true },
        };
        onEvent?.(payload);
        return { isLoading: false, error: null, events: [payload] };
      },
    );
    const onLogs = vi.fn();
    const { result } = renderHook(() =>
      useScaffoldWatchContractEvent({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        onLogs,
      }),
    );

    expect(result.current.isLoading).toBe(false);

    await waitFor(() => {
      expect(onLogs).toHaveBeenCalled();
    });

    const payload = onLogs.mock.calls[0][0] as Record<string, any>;

    expect(payload).toMatchObject({
      parsedArgs: { parsed: true },
      block: fakeBlock,
      transaction: fakeTx,
      receipt: fakeReceipt,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("does not call onLogs if WS doesn't emit", async () => {
    const { useScaffoldWebSocketEvents } = await import(
      "../useScaffoldWebSocketEvents"
    );
    (useScaffoldWebSocketEvents as unknown as any).mockReturnValueOnce({
      isLoading: false,
      error: null,
    });
    const onLogs = vi.fn();
    renderHook(() =>
      useScaffoldWatchContractEvent({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        onLogs,
      }),
    );
    await waitFor(() => expect(onLogs).not.toHaveBeenCalled());
  });

  it("throws error if the event is not found in the contract ABI", () => {
    // @ts-ignore
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: { address: "0x123", abi: [] },
      isLoading: false,
    });

    expect(() =>
      renderHook(() =>
        useScaffoldWatchContractEvent({
          contractName: mockContractName as any,
          eventName: mockEventName as never,
          onLogs: () => {},
        }),
      ),
    ).toThrow(`Event ${mockEventName} not found in contract ABI`);
  });

  it("throws error if multiple matching events are found in the ABI", () => {
    // @ts-ignore
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: {
        address: "0x123",
        abi: [
          { type: "event", name: "Module::MyEvent" },
          { type: "event", name: "Other::MyEvent" },
        ],
      },
      isLoading: false,
    });

    expect(() =>
      renderHook(() =>
        useScaffoldWatchContractEvent({
          contractName: mockContractName as any,
          eventName: mockEventName as never,
          onLogs: () => {},
        }),
      ),
    ).toThrow(/Ambiguous event/);
  });

  it("sets an error if contract data is not found after loading", async () => {
    // @ts-ignore
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    const { useScaffoldWebSocketEvents } = await import(
      "../useScaffoldWebSocketEvents"
    );
    (useScaffoldWebSocketEvents as unknown as any).mockReturnValueOnce({
      isLoading: false,
      error: new Error("Contract not found"),
      events: [],
    });
    const onLogs = vi.fn();
    const { result } = renderHook(() =>
      useScaffoldWatchContractEvent({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        onLogs,
      }),
    );

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain("Contract not found");
    expect(onLogs).not.toHaveBeenCalled();
  });
});
