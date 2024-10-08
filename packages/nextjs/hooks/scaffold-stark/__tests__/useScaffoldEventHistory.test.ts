import { renderHook, act, waitFor } from "@testing-library/react";
import { useScaffoldEventHistory } from "../useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "../useTargetNetwork";
import { useProvider } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

// Mock dependencies
vi.mock("~~/hooks/scaffold-stark", () => ({
  useDeployedContractInfo: vi.fn(),
}));

vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useProvider: vi.fn(),
}));

describe("useScaffoldEventHistory", () => {
  const mockContractName: "Eth" | "Strk" = "Strk";
  const mockEventName:
    | "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer"
    | "openzeppelin::token::erc20_v070::erc20::ERC20::Event" =
    "openzeppelin::token::erc20_v070::erc20::ERC20::Event";
  const mockDeployedContractData = {
    abi: [
      {
        type: "event",
        name: mockEventName,
        members: [
          { name: "arg1", type: "felt", kind: "key" },
          { name: "arg2", type: "felt", kind: "data" },
        ],
      },
    ],
    address: "0x1234567890abcdef",
  };
  const mockTargetNetwork = {
    id: "testnet",
    rpcUrls: {
      public: {
        http: ["https://mock-rpc-url"],
      },
    },
  };
  const mockEvents = [
    {
      log: {
        keys: ["0x1"],
        data: ["0x2"],
      },
      block_hash: "0xabc",
      transaction_hash: "0xdef",
    },
  ];

  beforeEach(() => {
    // @ts-ignore
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: mockDeployedContractData,
      isLoading: false,
    });
    // @ts-ignore
    (useTargetNetwork as Vi.Mock).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });
    // @ts-ignore
    (useProvider as vi.Mock).mockReturnValue({
      provider: new RpcProvider({
        nodeUrl: mockTargetNetwork.rpcUrls.public.http[0],
      }),
    });

    // Mock RpcProvider methods
    RpcProvider.prototype.getBlockLatestAccepted = vi.fn().mockResolvedValue({
      block_number: 1000,
    });

    RpcProvider.prototype.getEvents = vi.fn().mockResolvedValue({
      events: mockEvents,
    });

    RpcProvider.prototype.getBlockWithTxHashes = vi.fn().mockResolvedValue({
      block_hash: "0xabc",
    });

    RpcProvider.prototype.getTransactionByHash = vi.fn().mockResolvedValue({
      transaction_hash: "0xdef",
    });

    RpcProvider.prototype.getTransactionReceipt = vi.fn().mockResolvedValue({
      transaction_hash: "0xdef",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return events from the contract after mimicking a transaction", async () => {
    const { result } = renderHook(() =>
      useScaffoldEventHistory({
        contractName: mockContractName,
        eventName: mockEventName,
        fromBlock: BigInt(1),
        filters: {},
        blockData: true,
        transactionData: true,
        receiptData: true,
        watch: false,
        enabled: true,
      }),
    );

    // Initially, data should be loading
    expect(result.current.isLoading).toBe(true);

    // Simulate the completion of a transaction that triggers an event
    await act(async () => {
      RpcProvider.prototype.getEvents = vi.fn().mockResolvedValueOnce({
        events: mockEvents,
      });

      // Wait for the hook to stop loading and return the event data
      await waitFor(() => expect(result.current.isLoading).toBe(true));
    });

    // Check that loading is false and events are fetched
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([
      {
        log: mockEvents[0],
        block: { block_hash: "0xabc" },
        transaction: { transaction_hash: "0xdef" },
        receipt: { transaction_hash: "0xdef" },
        args: {
          arg1: "0x1",
          arg2: "0x2",
        },
      },
    ]);
    expect(result.current.error).toBeUndefined();
  });
});
