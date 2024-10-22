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

// TODO: unskip (and rewrite if required) when we determine direction of this hook
describe.skip("useScaffoldWriteContract", () => {
  const contractName = "Eth";
  const functionName = "transfer";
  const args: readonly [string, number] = ["0x1234", 1000];

  const mockUseDeployedContractInfo =
    useDeployedContractInfo as unknown as Mock;
  const mochUseSendTransaction = useSendTransaction as unknown as Mock;
  const mockUseTransactor = useTransactor as unknown as Mock;
  const mockUseTargetNetwork = useTargetNetwork as unknown as Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should handle case where contract is not deployed", async () => {
    mockUseDeployedContractInfo.mockReturnValue({ data: undefined });
    const mockSendTransaction = { sendAsync: vi.fn() };
    mochUseSendTransaction.mockReturnValue(mockSendTransaction);
    mockUseTransactor.mockReturnValue(vi.fn());
    mockUseTargetNetwork.mockReturnValue({
      targetNetwork: { id: 1 },
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

    expect(mockSendTransaction.sendAsync).not.toHaveBeenCalled();
  });

  it("should handle case where user is on the wrong network", async () => {
    mockUseDeployedContractInfo.mockReturnValue({
      data: {
        address: "0x123",
        abi: [{ name: "testFunction" }],
      },
    });
    const mockSendTransaction = { sendAsync: vi.fn() };
    mochUseSendTransaction.mockReturnValue(mockSendTransaction);
    mockUseTransactor.mockReturnValue(vi.fn());
    mockUseTargetNetwork.mockReturnValue({
      targetNetwork: { id: 2 }, // Different network ID
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

    expect(mockSendTransaction.sendAsync).not.toHaveBeenCalled();
  });

  it("should send transaction when contract is deployed and user is on correct network", async () => {
    mockUseDeployedContractInfo.mockReturnValue({
      data: {
        address: "0x123",
        abi: [{ name: "testFunction" }],
      },
    });
    const mockSendTransaction = { sendAsync: vi.fn() };
    mochUseSendTransaction.mockReturnValue(mockSendTransaction);
    mockUseTransactor.mockReturnValue(vi.fn((fn) => fn()));
    mockUseTargetNetwork.mockReturnValue({
      targetNetwork: { id: 1 },
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

    expect(mockSendTransaction.sendAsync).toHaveBeenCalledWith([
      {
        contractAddress: "0x123",
        entrypoint: functionName,
        calldata: expect.any(Array),
      },
    ]);
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
