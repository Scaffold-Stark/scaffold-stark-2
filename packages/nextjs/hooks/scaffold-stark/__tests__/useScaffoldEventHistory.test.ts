import { renderHook, act, waitFor } from "@testing-library/react";
import { useScaffoldEventHistory } from "../useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "../useTargetNetwork";
import { useProvider } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeployedContractData } from "./seed/mockDeployedContractData";

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
  const mockContractName = "YourContract";
  const mockEventName = "contracts::YourContract::YourContract::EventParser";
  const mockTargetNetwork = {
    id: "testnet",
    rpcUrls: {
      public: {
        http: ["https://mock-rpc-url"],
      },
    },
  };
  /**
    #[derive(Drop, starknet::Event)]
    struct EventParser {
        #[key]
        sender: ContractAddress,
        #[key]
        message: ByteArray,
        bool_val: bool,
        u256_val: u256,
        tuple_val: (u8, u16, u32, u64, u128),
        arr_val: Array<u128>,
    }
    ...
    
    fn trigger_event(ref self: ContractState) {
      let mut arr = ArrayTrait::new();
      arr.append(10);
      arr.append(20);
      self
        .emit(
          EventParser {
            sender: get_caller_address(),
            message: "hello world",
            bool_val: true,
            u256_val: 1024,
            tuple_val: (1, 2, 3, 4, 5),
            arr_val: arr,
          }
        );
    }
   */
  const mockEvents = [
    {
      transaction_hash:
        "0x32fd3f52de430871452ba8f0e919df62d62371ae14854970751bb218f907043",
      block_hash:
        "0x3b2711fe29eba45f2a0250c34901d15e37b495599fac1a74960a09cc83e1234",
      block_number: 4,
      from_address:
        "0x4157387adde0a8300c484badd9dcae316f3ce4aef745d724774c775201ae7a6",
      keys: [
        "0x5bd809fd302dcb761cc197e17ab97cea5927a14a155597700cd4780ce32953",
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "0x0",
        "0x68656c6c6f20776f726c64",
        "0xb",
      ],
      data: [
        "0x1",
        "0x400",
        "0x0",
        "0x1",
        "0x2",
        "0x3",
        "0x4",
        "0x5",
        "0x2",
        "0xa",
        "0x14",
      ],
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
        contractName: mockContractName as any,
        eventName: mockEventName as never,
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
          arr_val: [10n, 20n],
          bool_val: true,
          message: "hello world",
          sender:
            2846891009026995430665703316224827616914889274105712248413538305735679628945n,
          tuple_val: {
            0: 1n,
            1: 2n,
            2: 3n,
            3: 4n,
            4: 5n,
          },
          u256_val: 1024n,
        },
        parsedArgs: {
          arr_val: [10n, 20n],
          bool_val: true,
          message: "hello world",
          sender:
            "0x064b48806902a367c8598f4F95C305e8c1a1aCbA5f082D294a43793113115691",
          tuple_val: {
            0: 1n,
            1: 2n,
            2: 3n,
            3: 4n,
            4: 5n,
          },
          u256_val: 1024n,
        },
        type: [
          {
            kind: "key",
            name: "sender",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            kind: "key",
            name: "message",
            type: "core::byte_array::ByteArray",
          },
          {
            kind: "data",
            name: "bool_val",
            type: "core::bool",
          },
          {
            kind: "data",
            name: "u256_val",
            type: "core::integer::u256",
          },
          {
            kind: "data",
            name: "tuple_val",
            type: "(core::integer::u8, core::integer::u16, core::integer::u32, core::integer::u64, core::integer::u128)",
          },
          {
            kind: "data",
            name: "arr_val",
            type: "core::array::Array::<core::integer::u128>",
          },
        ],
      },
    ]);
    expect(result.current.error).toBeUndefined();
  });

  it("should fetch and return events without formatting from the contract after mimicking a transaction", async () => {
    const { result } = renderHook(() =>
      useScaffoldEventHistory({
        contractName: mockContractName as any,
        eventName: mockEventName as never,
        fromBlock: BigInt(1),
        filters: {},
        blockData: true,
        transactionData: true,
        receiptData: true,
        watch: false,
        enabled: true,
        format: false,
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
          arr_val: [10n, 20n],
          bool_val: true,
          message: "hello world",
          sender:
            2846891009026995430665703316224827616914889274105712248413538305735679628945n,
          tuple_val: {
            0: 1n,
            1: 2n,
            2: 3n,
            3: 4n,
            4: 5n,
          },
          u256_val: 1024n,
        },
        parsedArgs: null,
        type: [
          {
            kind: "key",
            name: "sender",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            kind: "key",
            name: "message",
            type: "core::byte_array::ByteArray",
          },
          {
            kind: "data",
            name: "bool_val",
            type: "core::bool",
          },
          {
            kind: "data",
            name: "u256_val",
            type: "core::integer::u256",
          },
          {
            kind: "data",
            name: "tuple_val",
            type: "(core::integer::u8, core::integer::u16, core::integer::u32, core::integer::u64, core::integer::u128)",
          },
          {
            kind: "data",
            name: "arr_val",
            type: "core::array::Array::<core::integer::u128>",
          },
        ],
      },
    ]);
    expect(result.current.error).toBeUndefined();
  });
});
