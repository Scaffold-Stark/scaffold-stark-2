import { renderHook, act, waitFor } from "@testing-library/react";
import { useScaffoldWatchContractEvent } from "../useScaffoldWatchContractEvent";
import { useDeployedContractInfo } from "../useDeployedContractInfo";
import { useTargetNetwork } from "../useTargetNetwork";
import { useProvider } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { events as starknetEvents } from "starknet";
import * as eventsData from "~~/utils/scaffold-stark/eventsData";
import * as starknet from "starknet";

// Mock dependencies
vi.mock("starknet", async () => {
  const actual: typeof import("starknet") = await vi.importActual("starknet");
  return {
    ...actual,
    // replace only the `parseEvents` function, keep the rest intact
    events: {
      ...actual.events,
      parseEvents: vi.fn(),
      getAbiEvents: vi.fn(),
    },
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

describe("useScaffoldWatchContractEvent", () => {
  const mockContractName = "MyContract";
  const mockEventName = "MyEvent";
  const mockTargetNetwork = {
    id: "testnet",
    rpcUrls: { public: { http: ["https://mock-rpc-url"] } },
  };

  // A mock deployed contract with one event in its ABI
  const mockDeployedContractData = {
    address: "0x123",
    abi: [{ type: "event", name: "Module::MyEvent" }],
  };

  // A mock event log returned by the provider
  const mockLog = {
    data: ["0x01"],
    keys: ["0xabc"],
    block_number: 1,
    block_hash: "0xblock",
    transaction_hash: "0xtx",
    from_address: "0xfrom",
  };

  const fakeBlock = { block_hash: "0xblock" }
  const fakeTx   = { transaction_hash: "0xtx" }
  const fakeReceipt = { transaction_hash: "0xtx" }

  beforeEach(() => {
    // By default, simulate a loaded contract with the mock ABI
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
      provider: {}, // Not used directly in hook logic
    });

    // Mock the StarkNet RPC provider behavior
    RpcProvider.prototype.getBlockLatestAccepted = vi.fn().mockResolvedValue({
      block_number: 10,
    });
    RpcProvider.prototype.getEvents = vi.fn().mockResolvedValue({
      events: [mockLog],
    });

    RpcProvider.prototype.getBlockWithTxHashes = vi.fn().mockResolvedValue(fakeBlock);
    RpcProvider.prototype.getTransactionByHash    = vi.fn().mockResolvedValue(fakeTx);
    RpcProvider.prototype.getTransactionReceipt   = vi.fn().mockResolvedValue(fakeReceipt);

    // spy on parseEvents & parseEventData
    vi.spyOn(starknet.events, "parseEvents").mockReturnValue([
      { [mockEventName]: { foo: "bar" } },
    ]);
    vi.spyOn(starknet.events, "getAbiEvents").mockReturnValue(
      // @ts-ignore
      (mockDeployedContractData.abi as any).filter((x) => x.type === "event")
    );
    vi.spyOn(eventsData, "parseEventData").mockReturnValue({ parsed: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("calls onLogs when events are fetched after mount", async () => {
    const onLogs = vi.fn();
    const { result } = renderHook(() =>
      useScaffoldWatchContractEvent({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        onLogs,
      }),
    );

    // Initially, loading should be false (no operations yet)
    expect(result.current.isLoading).toBe(false);

    // Wait for the effect to fetch events and call onLogs
    await waitFor(() => {
      expect(onLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "event",             // or whatever your ABI’s `type` is
          args: { foo: "bar" },
          parsedArgs: { parsed: true },
          block: fakeBlock,
          transaction: fakeTx,
          receipt: fakeReceipt,
        }),
      );
    });

    // After processing, loading should be false and no error should be set
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("does not call onLogs if no events are returned", async () => {
    // Simulate the provider returning an empty events array
    // @ts-ignore
    (RpcProvider.prototype.getEvents as vi.Mock).mockResolvedValueOnce({
      events: [],
    });

    const onLogs = vi.fn();
    renderHook(() =>
      useScaffoldWatchContractEvent({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        onLogs,
      }),
    );

    // Wait a short time to ensure the effect has run
    await waitFor(() => {
      // onLogs should not have been called since there are no events
      expect(onLogs).not.toHaveBeenCalled();
    });
  });

  it("throws error if the event is not found in the contract ABI", () => {
    // @ts-ignore
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: { address: "0x123", abi: [] }, // empty ABI
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
    const onLogs = vi.fn();
    const { result } = renderHook(() =>
      useScaffoldWatchContractEvent({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        onLogs,
      }),
    );

    // Wait for the effect to detect the missing contract data and set the error
    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain("Contract not found");
    expect(onLogs).not.toHaveBeenCalled();
  });
});
