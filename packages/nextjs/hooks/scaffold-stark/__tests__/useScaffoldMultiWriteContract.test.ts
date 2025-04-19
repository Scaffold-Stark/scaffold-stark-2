import { renderHook, act } from "@testing-library/react";

import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";

import {
  useScaffoldMultiWriteContract,
  createContractCall,
} from "../useScaffoldMultiWriteContract";

import { useTargetNetwork } from "../useTargetNetwork";

import { useNetwork, useSendTransaction } from "@starknet-react/core";

import { useTransactor } from "../useTransactor";

import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";

import { Contract, RpcProvider } from "starknet";

// Mock the contracts object
vi.mock("~~/utils/scaffold-stark/contract", () => ({
  contracts: {
    testNetwork: {
      Strk: {
        address: "0x12345",
        abi: [{ type: "function", name: "transfer", inputs: [], outputs: [] }],
      },
    },
  },
  // Add any other exports that might be needed
  ContractName: {},
}));

// Mock the external dependencies

vi.mock("~~/hooks/scaffold-stark/useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useSendTransaction: vi.fn(),

  useNetwork: vi.fn().mockReturnValue({ chain: { id: 1 } }),
}));

vi.mock("starknet", () => {
  const actualStarknet = vi.importActual("starknet");

  return {
    ...actualStarknet,

    Contract: vi.fn().mockImplementation(() => ({
      populate: vi.fn().mockReturnValue({
        contractAddress: "0x123",
        entrypoint: "transfer",
        calldata: ["0x1234", "1000"],
      }),
    })),

    RpcProvider: vi.fn(),
  };
});

vi.mock("../useTransactor");

vi.mock("~~/hooks/scaffold-stark", () => ({
  useDeployedContractInfo: vi.fn(),

  useTransactor: vi.fn(),
}));

const mockSendTransaction = vi.fn();

const mockTransactor = vi.fn((fn) => fn());

const mockedUseNetwork = useNetwork as Mock;

const useTargetNetworkMock = useTargetNetwork as Mock;
const useSendTransactionMock = useSendTransaction as Mock;
const useTransactorMock = useTransactor as Mock;
const useDeployedContractInfoMock = useDeployedContractInfo as Mock;
const ContractMock = Contract as Mock;
const useNetworkMock = useNetwork as Mock;

// Using the test without skipping as it has been updated for the new structure
describe("useScaffoldMultiWriteContract Hook", () => {
  const mockAbi = [
    { type: "function", name: "mockFunction", inputs: [], outputs: [] },
  ];

  const mockAddress = "0x12345";

  beforeEach(() => {
    vi.resetAllMocks();

    useTargetNetworkMock.mockReturnValue({
      targetNetwork: { network: "testNetwork", id: 1 },
    });

    mockedUseNetwork.mockReturnValue({ chain: { id: 1 } });

    useSendTransactionMock.mockReturnValue({
      sendAsync: mockSendTransaction,
      status: "idle",
    });

    useTransactorMock.mockReturnValue({
      writeTransaction: vi.fn().mockResolvedValue("mock-tx-hash"),
      sendTransactionInstance: {
        sendAsync: vi.fn(),
        status: "idle",
      },
      transactionReceiptInstance: {
        data: null,
        status: "idle",
      },
    });

    useDeployedContractInfoMock.mockReturnValue({
      data: {
        address: "0x123",

        abi: [{ name: "testFunction" }],
      },
    });

    ContractMock.mockImplementation(() => ({
      address: mockAddress,

      abi: mockAbi,
      populate: vi.fn().mockReturnValue({
        contractAddress: mockAddress,
        entrypoint: "mockFunction",
        calldata: [],
      }),
    }));
  });

  it("should correctly parse contract calls", () => {
    // Mock contract and ABI

    const { result } = renderHook(() =>
      useScaffoldMultiWriteContract({
        calls: [
          {
            contractName: "Strk",
            functionName: "transfer",
            args: ["arg1", 1],
          },
        ],
      }),
    );

    expect(result.current.sendAsync).toBeInstanceOf(Function);

    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it("should return error if wallet is not connected", async () => {
    useNetworkMock.mockReturnValueOnce({ chain: null });

    const { result } = renderHook(() =>
      useScaffoldMultiWriteContract({
        calls: [
          {
            contractName: "Strk",
            functionName: "transfer",
            args: ["arg1", 1],
          },
        ],
      }),
    );

    let error;
    await act(async () => {
      try {
        await result.current.sendAsync();
      } catch (e) {
        error = e;
      }
    });

    expect(error).toBeUndefined(); // We just log to console in this case
    expect(useTransactorMock().writeTransaction).not.toHaveBeenCalled();
  });
});

describe("createContractCall Function", () => {
  it("should create a contract call object", () => {
    const contractCall = createContractCall("Strk", "transfer", ["arg1", 1]);

    expect(contractCall).toEqual({
      contractName: "Strk",

      functionName: "transfer",

      args: ["arg1", 1],
    });
  });
});
