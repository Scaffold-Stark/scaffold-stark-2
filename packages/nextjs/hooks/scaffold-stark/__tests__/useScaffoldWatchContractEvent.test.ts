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

describe("UseScaffoldWatchContractEvent", () => {
  const mockContractName = "YourContract";
  const mockEventName = "EventParser";
  const mockTargetNetwork = {
    id: "testnet",
    rpcUrls: {
      public: {
        http: ["https://mock-rpc-url"],
      }
    }
  };

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

  
})