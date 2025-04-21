import { renderHook, act } from "@testing-library/react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-stark/useScaffoldWriteContract";
import {
  useDeployedContractInfo,
  useTransactor,
} from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useSendTransaction } from "@starknet-react/core";
import { vi, describe, beforeEach, afterAll, it, expect } from "vitest";
import { Mock } from "vitest";

// Mock starknet Contract constructor
vi.mock("starknet", () => {
  return {
    Contract: vi.fn().mockImplementation(() => ({
      populate: vi.fn().mockReturnValue({
        contractAddress: "0x123",
        entrypoint: "transfer",
        calldata: ["0x1234", "1000"],
      }),
    })),
  };
});

// Mock dependencies
vi.mock("~~/hooks/scaffold-stark", () => ({
  useDeployedContractInfo: vi.fn(),
  useTransactor: vi.fn(),
}));

vi.mock("~~/hooks/scaffold-stark/useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useSendTransaction: vi.fn(),
  useNetwork: vi.fn().mockReturnValue({ chain: { id: 1 } }),
}));

// Now using the test without skipping as it has been updated for the new structure
describe("useScaffoldWriteContract", () => {
  const contractName = "Strk";
  const functionName = "transfer";
  const args: readonly [string, number] = ["0x1234", 1000];

  const mockUseDeployedContractInfo =
    useDeployedContractInfo as unknown as Mock;
  const mockUseSendTransaction = useSendTransaction as unknown as Mock;
  const mockUseTransactor = useTransactor as unknown as Mock;
  const mockUseTargetNetwork = useTargetNetwork as unknown as Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set up the mock implementations for the hooks
    mockUseSendTransaction.mockReturnValue({
      sendAsync: vi.fn(),
      status: "idle",
    });

    mockUseTransactor.mockReturnValue({
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

    mockUseTargetNetwork.mockReturnValue({
      targetNetwork: { id: 1, network: "testnet" },
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should handle case where contract is not deployed", async () => {
    mockUseDeployedContractInfo.mockReturnValue({ data: undefined });

    const { result } = renderHook(() =>
      useScaffoldWriteContract({
        contractName,
        functionName,
        args,
      }),
    );

    await act(async () => {
      await result.current.sendAsync();
    });

    expect(mockUseTransactor().writeTransaction).not.toHaveBeenCalled();
  });

  it("should handle case where user is on the wrong network", async () => {
    mockUseDeployedContractInfo.mockReturnValue({
      data: {
        address: "0x123",
        abi: [{ name: "testFunction" }],
      },
    });

    mockUseTargetNetwork.mockReturnValue({
      targetNetwork: { id: 2, network: "mainnet" }, // Different network ID
    });

    const { result } = renderHook(() =>
      useScaffoldWriteContract({
        contractName,
        functionName,
        args,
      }),
    );

    await act(async () => {
      await result.current.sendAsync();
    });

    expect(mockUseTransactor().writeTransaction).not.toHaveBeenCalled();
  });

  it("should send transaction when contract is deployed and user is on correct network", async () => {
    mockUseDeployedContractInfo.mockReturnValue({
      data: {
        address: "0x123",
        abi: [{ name: "testFunction" }],
      },
    });

    const { result } = renderHook(() =>
      useScaffoldWriteContract({
        contractName,
        functionName,
        args,
      }),
    );

    await act(async () => {
      await result.current.sendAsync();
    });

    expect(mockUseTransactor().writeTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          contractAddress: "0x123",
          entrypoint: functionName,
        }),
      ]),
    );
  });

  it("should call useDeployedContractInfo with the correct contract name", () => {
    renderHook(() =>
      useScaffoldWriteContract({
        contractName,
        functionName,
        args,
      }),
    );

    expect(useDeployedContractInfo).toHaveBeenCalledWith(contractName);
  });
});
