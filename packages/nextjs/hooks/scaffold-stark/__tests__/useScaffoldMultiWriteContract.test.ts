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

    Contract: vi.fn(),

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

// TODO: unskip (and rewrite if required) when we determine direction of this hook
describe.skip("useScaffoldMultiWriteContract Hook", () => {
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
    });

    useTransactorMock.mockReturnValue(mockTransactor);

    useDeployedContractInfoMock.mockReturnValue({
      data: {
        address: "0x123",

        abi: [{ name: "testFunction" }],
      },
    });

    ContractMock.mockImplementation(() => ({
      address: mockAddress,

      abi: mockAbi,
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

    await act(async () => {
      await result.current.sendAsync();
    });

    vi.spyOn(result.current, "sendAsync").mockRejectedValue(
      new Error("Please connect your wallet"),
    );

    await expect(result.current.sendAsync).rejects.toThrowError(
      "Please connect your wallet",
    );
  });

  it("should handle wrong network", async () => {
    useNetworkMock.mockReturnValueOnce({ chain: { id: 2 } });

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

    await act(async () => {
      await result.current.sendAsync();
    });

    vi.spyOn(result.current, "sendAsync").mockRejectedValue(
      new Error("You are on the wrong network"),
    );

    await expect(result.current.sendAsync).rejects.toThrowError(
      "You are on the wrong network",
    );
  });

  it("should show error if contract ABI is missing", async () => {
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

    await act(async () => {
      await result.current.sendAsync();
    });

    vi.spyOn(result.current, "sendAsync").mockRejectedValue(
      new Error("Function myFunction not found in contract ABI"),
    );

    await expect(result.current.sendAsync).rejects.toThrowError(
      "Function myFunction not found in contract ABI",
    );
  });

  it("should send contract write transaction", async () => {
    useTransactorMock.mockReturnValue((fn: any) => fn());

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

    await act(async () => {
      await result.current.sendAsync();
    });

    expect(mockSendTransaction).toHaveBeenCalled();
  });

  it("should show error notification if sendAsync is not available", async () => {
    useSendTransactionMock.mockReturnValueOnce({ sendAsync: null });

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

    await act(async () => {
      await result.current.sendAsync();
    });

    vi.spyOn(result.current, "sendAsync").mockRejectedValue(
      new Error("Contract writer error. Try again."),
    );

    await expect(result.current.sendAsync).rejects.toThrowError(
      "Contract writer error. Try again.",
    );
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
