import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark/useDeployedContractInfo";
import { useAccount } from "@starknet-react/core";
import { Contract, RpcProvider } from "starknet";

import type { Mock } from "vitest";
import { ContractName } from "~~/utils/scaffold-stark/contract";
import { useProvider } from "@starknet-react/core";

//Using vitest's functionality to mock modules from different paths
vi.mock("~~/hooks/scaffold-stark/useDeployedContractInfo");
vi.mock("@starknet-react/core");
vi.mock("starknet", () => {
  const actualStarknet = vi.importActual("starknet");
  return {
    ...actualStarknet,
    Contract: vi.fn(),
    RpcProvider: vi.fn(),
  };
});

describe("useScaffoldContract", () => {
  const mockAbi = [
    { type: "function", name: "mockFunction", inputs: [], outputs: [] },
  ];
  const mockAddress = "0x12345";
  const contractName: ContractName = "Strk";
  const mockPublicClient = {
    nodeUrl: "https://mock-rpc-url",
  };
  //Some necessary mocks
  const mockedUseDeployedContractInfo =
    useDeployedContractInfo as unknown as Mock;
  const mockUseProvider = useProvider as unknown as Mock;
  const mockedUseAccount = useAccount as unknown as Mock;
  const MockedContract = Contract as unknown as Mock;
  const MockedRpcProvider = RpcProvider as unknown as Mock;

  beforeEach(() => {
    vi.resetAllMocks();

    mockedUseDeployedContractInfo.mockReturnValue({
      data: {
        abi: mockAbi,
        address: mockAddress,
      },
      isLoading: false,
    });

    mockUseProvider.mockReturnValue({
      provider: mockPublicClient,
    });

    mockedUseAccount.mockReturnValue({
      account: {
        address: "0x129846",
        connect: vi.fn(),
      },
    });

    MockedContract.mockImplementation(() => ({
      address: mockAddress,
      abi: mockAbi,
      call: vi.fn(),
      connect: vi.fn(),
    }));
  });

  it("should return a contract when deployedContractData is available", () => {
    const { result } = renderHook(() => useScaffoldContract({ contractName }));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.address).toBe(mockAddress);
    expect(result.current.data?.abi).toEqual(mockAbi);
  });

  it("should return undefined contract when deployedContractData is not available", () => {
    mockedUseDeployedContractInfo.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useScaffoldContract({ contractName }));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should set isLoading to true when deployed contract is loading", () => {
    mockedUseDeployedContractInfo.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useScaffoldContract({ contractName }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should create a contract instance with the correct parameters", () => {
    const { result } = renderHook(() => useScaffoldContract({ contractName }));
    expect(MockedContract).toHaveBeenCalledWith(
      mockAbi,
      mockAddress,
      expect.anything(),
    );
  });

  it("should return undefined when deployedContractData is not available", () => {
    mockedUseDeployedContractInfo.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
    });
    const { result } = renderHook(() => useScaffoldContract({ contractName }));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should create a contract instance with the correct parameters", () => {
    const { result } = renderHook(() => useScaffoldContract({ contractName }));
    expect(MockedContract).toHaveBeenCalledWith(
      mockAbi,
      mockAddress,
      expect.anything(),
    );
  });

  it("should return original result if first call succeeds", async () => {
    const mockOriginalCall = vi.fn().mockResolvedValue("SuccessResult");
    MockedContract.mockImplementationOnce(() => ({
      address: mockAddress,
      abi: mockAbi,
      call: mockOriginalCall,
      connect: vi.fn(),
    }));

    const { result } = renderHook(() => useScaffoldContract({ contractName }));
    const modifiedCall = result.current.data?.call;
    const callResult = await modifiedCall?.("mockMethod");

    expect(mockOriginalCall).toHaveBeenCalledTimes(1);
    expect(mockOriginalCall).toHaveBeenCalledWith("mockMethod", {
      parseResponse: false,
    });
    expect(callResult).toBe("SuccessResult");
  });

  it("should retry call without parseResponse on error", async () => {
    const originalCall = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("Mock Error");
      })
      .mockResolvedValueOnce("fallback-response");

    MockedContract.mockImplementationOnce(() => ({
      address: mockAddress,
      abi: mockAbi,
      call: originalCall,
      connect: vi.fn(),
    }));

    const { result } = renderHook(() => useScaffoldContract({ contractName }));
    const response = await result.current.data?.call("mockFunction");

    expect(originalCall).toHaveBeenCalledTimes(2);
    expect(originalCall).toHaveBeenNthCalledWith(1, "mockFunction", {
      parseResponse: false,
    });
    expect(originalCall).toHaveBeenNthCalledWith(2, "mockFunction");
    expect(response).toBe("fallback-response");
  });
});
