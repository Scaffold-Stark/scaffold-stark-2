import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScaffoldContract } from "~~/hooks/scaffold-stark/useScaffoldContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark/useDeployedContractInfo";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useAccount } from "~~/hooks/useAccount";
import { Contract, RpcProvider } from "starknet";

import type { Mock } from "vitest";
import { ContractName } from "~~/utils/scaffold-stark/contract";

//Using vitest's functionality to mock modules from different paths
vi.mock("~~/hooks/scaffold-stark/useDeployedContractInfo");
vi.mock("~~/hooks/scaffold-stark/useTargetNetwork");
vi.mock("~~/hooks/useAccount");
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

  //Some necessary mocks
  const mockedUseDeployedContractInfo =
    useDeployedContractInfo as unknown as Mock;
  const mockedUseTargetNetwork = useTargetNetwork as unknown as Mock;
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

    mockedUseTargetNetwork.mockReturnValue({
      targetNetwork: {
        rpcUrls: { public: { http: ["https://mock-rpc-url"] } },
      },
    });

    mockedUseAccount.mockReturnValue({
      account: {
        address: "0x129846",
      },
    });

    MockedContract.mockImplementation(() => ({
      address: mockAddress,
      abi: mockAbi,
    }));

    MockedRpcProvider.mockImplementation(() => ({
      nodeAddress: "https://mock-rpc-url",
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

  it("should create RpcProvider with the correct public URL", () => {
    renderHook(() => useScaffoldContract({ contractName }));

    expect(MockedRpcProvider).toHaveBeenCalledWith({
      nodeUrl: "https://mock-rpc-url",
    });
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
});
