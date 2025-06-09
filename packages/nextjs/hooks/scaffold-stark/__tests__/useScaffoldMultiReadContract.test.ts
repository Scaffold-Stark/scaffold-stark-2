import { renderHook } from "@testing-library/react";
import { useScaffoldMultiReadContract } from "../useScaffoldMultiReadContract";
import { useDeployedContractInfo } from "../useDeployedContractInfo";
import { vi, describe, it, expect, Mock, beforeEach } from "vitest";
import { ContractName } from "~~/utils/scaffold-stark/contract";

// Mock dependencies
vi.mock("../useDeployedContractInfo", () => ({
  useDeployedContractInfo: vi.fn(),
}));

vi.mock("../utils/multicall", () => ({
  getMulticallContract: vi.fn(() => ({
    aggregate: vi.fn(),
  })),
  parseMulticallResults: vi.fn(),
}));

describe("useScaffoldMultiReadContract", () => {
  const mockCalls = [
    {
      contractName: "TestContract1" as ContractName,
      functionName: "getValue",
      args: [1],
    },
    {
      contractName: "TestContract2" as ContractName,
      functionName: "getName",
      args: [],
    },
  ];

  const mockDeployedContracts = [
    {
      data: {
        address: "0x123",
        abi: [{ name: "getValue", type: "function", outputs: [{ type: "felt" }] }],
      },
    },
    {
      data: {
        address: "0x456",
        abi: [{ name: "getName", type: "function", outputs: [{ type: "felt" }] }],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useDeployedContractInfo as Mock).mockImplementation((contractName: ContractName) => {
      const index = mockCalls.findIndex((call) => call.contractName === contractName);
      return mockDeployedContracts[index];
    });
  });

  it("should return loading state initially", () => {
    const { result } = renderHook(() => useScaffoldMultiReadContract(mockCalls));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should handle empty calls array", () => {
    const { result } = renderHook(() => useScaffoldMultiReadContract([]));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should handle disabled state", () => {
    const { result } = renderHook(() =>
      useScaffoldMultiReadContract(mockCalls, { enabled: false })
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("should handle contract not found error", () => {
    (useDeployedContractInfo as Mock).mockImplementation(() => ({
      data: undefined,
    }));

    const { result } = renderHook(() => useScaffoldMultiReadContract(mockCalls));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should provide refetch function", () => {
    const { result } = renderHook(() => useScaffoldMultiReadContract(mockCalls));
    expect(typeof result.current.refetch).toBe("function");
  });
}); 