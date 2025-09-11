import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFetchAddressDetails } from "../useFetchAddressDetails";
import { useTargetNetwork } from "../../scaffold-stark/useTargetNetwork";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock dependencies
vi.mock("../../scaffold-stark/useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useContract: vi.fn(),
}));

// Mock RpcProvider
const mockRpcProvider = {
  getClassAt: vi.fn(),
  getClassHashAt: vi.fn(),
  getContractVersion: vi.fn(),
  getEvents: vi.fn(),
  getBlock: vi.fn(),
};

vi.mock("starknet", () => ({
  RpcProvider: vi.fn(() => mockRpcProvider),
  Contract: vi.fn().mockImplementation((abi, address, provider) => ({
    abi,
    address,
    provider,
  })),
  hash: {
    getSelectorFromName: vi.fn(),
  },
  num: {
    toHex: vi.fn((value) => `0x${value.toString(16)}`),
  },
  encode: {
    sanitizeHex: vi.fn((hex) => hex?.toLowerCase() || ""),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("useFetchAddressDetails", () => {
  const mockTargetNetwork = {
    rpcUrls: {
      public: {
        http: ["http://localhost:5050"],
      },
    },
    network: "devnet",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTargetNetwork as any).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });
  });

  it("should return null when no address is provided", async () => {
    const { result } = renderHook(() => useFetchAddressDetails(), {
      wrapper: createWrapper(),
    });

    expect(result.current.addressDetails.contractAddress).toBe("");
    expect(result.current.addressDetails.type).toBe("UNKNOWN");
    expect(result.current.addressDetails.isLoading).toBe(true);
  });

  it("should fetch contract details for a deployed contract", async () => {
    const testAddress = "0x123456789abcdef";
    const mockAbi = [
      {
        type: "interface",
        name: "ITest",
        items: [
          {
            type: "function",
            name: "test_function",
            inputs: [],
            outputs: [],
            state_mutability: "view",
          },
        ],
      },
    ];
    const mockClassHash = "0xabc123def456";

    mockRpcProvider.getClassAt.mockResolvedValue({ abi: mockAbi });
    mockRpcProvider.getClassHashAt.mockResolvedValue(mockClassHash);
    mockRpcProvider.getContractVersion.mockResolvedValue({ cairo: "1.0" });
    mockRpcProvider.getEvents.mockResolvedValue({ events: [] });

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails).toMatchObject({
      contractAddress: testAddress,
      type: "CONTRACT",
      classHash: mockClassHash,
      classVersion: "Cairo 1.0",
    });
  });

  it("should identify account type for addresses without class hash", async () => {
    const testAddress = "0x123456789abcdef";

    mockRpcProvider.getClassAt.mockRejectedValue(
      new Error("No class at address"),
    );
    mockRpcProvider.getClassHashAt.mockRejectedValue(
      new Error("No class hash"),
    );

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails).toMatchObject({
      contractAddress: testAddress,
      type: "ACCOUNT",
    });
  });

  it("should fetch deployment information when available", async () => {
    const testAddress = "0x123456789abcdef";
    const mockAbi = [
      {
        type: "interface",
        name: "ITest",
        items: [
          {
            type: "function",
            name: "test_function",
            inputs: [],
            outputs: [],
            state_mutability: "view",
          },
        ],
      },
    ];
    const mockClassHash = "0xabc123def456";
    const mockDeploymentHash = "0xdeployment123";
    const mockDeployer = "0xdeployer456";
    const mockBlockNumber = 100;
    const mockTimestamp = 1640995200;

    mockRpcProvider.getClassAt.mockResolvedValue({ abi: mockAbi });
    mockRpcProvider.getClassHashAt.mockResolvedValue(mockClassHash);
    mockRpcProvider.getContractVersion.mockResolvedValue({ cairo: "1.0" });
    mockRpcProvider.getEvents.mockResolvedValue({
      events: [
        {
          data: [testAddress, mockDeployer],
          transaction_hash: mockDeploymentHash,
          block_number: mockBlockNumber,
        },
      ],
    });
    mockRpcProvider.getBlock.mockResolvedValue({
      timestamp: mockTimestamp,
    });

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails).toMatchObject({
      contractAddress: testAddress,
      type: "CONTRACT",
      classHash: mockClassHash,
      deployedAtTransactionHash: mockDeploymentHash,
      deployedByContractAddress: mockDeployer,
    });
    expect(result.current.addressDetails.deployedAt).toBeDefined();
  });

  it("should handle contract version detection errors gracefully", async () => {
    const testAddress = "0x123456789abcdef";
    const mockAbi = [
      {
        type: "interface",
        name: "ITest",
        items: [],
      },
    ];
    const mockClassHash = "0xabc123def456";

    mockRpcProvider.getClassAt.mockResolvedValue({ abi: mockAbi });
    mockRpcProvider.getClassHashAt.mockResolvedValue(mockClassHash);
    mockRpcProvider.getContractVersion.mockRejectedValue(
      new Error("Version detection failed"),
    );
    mockRpcProvider.getEvents.mockResolvedValue({ events: [] });

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails).toMatchObject({
      contractAddress: testAddress,
      type: "CONTRACT",
      classHash: mockClassHash,
      classVersion: "Unknown",
    });
  });

  it("should handle deployment info fetch errors gracefully", async () => {
    const testAddress = "0x123456789abcdef";
    const mockAbi = [
      {
        type: "interface",
        name: "ITest",
        items: [],
      },
    ];
    const mockClassHash = "0xabc123def456";

    mockRpcProvider.getClassAt.mockResolvedValue({ abi: mockAbi });
    mockRpcProvider.getClassHashAt.mockResolvedValue(mockClassHash);
    mockRpcProvider.getContractVersion.mockResolvedValue({ cairo: "1.0" });
    mockRpcProvider.getEvents.mockRejectedValue(
      new Error("Events fetch failed"),
    );

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails).toMatchObject({
      contractAddress: testAddress,
      type: "CONTRACT",
      classHash: mockClassHash,
      classVersion: "Cairo 1.0",
    });
    expect(
      result.current.addressDetails.deployedAtTransactionHash,
    ).toBeUndefined();
  });

  it("should handle block timestamp fetch errors gracefully", async () => {
    const testAddress = "0x123456789abcdef";
    const mockAbi = [
      {
        type: "interface",
        name: "ITest",
        items: [],
      },
    ];
    const mockClassHash = "0xabc123def456";
    const mockDeploymentHash = "0xdeployment123";
    const mockBlockNumber = 100;

    mockRpcProvider.getClassAt.mockResolvedValue({ abi: mockAbi });
    mockRpcProvider.getClassHashAt.mockResolvedValue(mockClassHash);
    mockRpcProvider.getContractVersion.mockResolvedValue({ cairo: "1.0" });
    mockRpcProvider.getEvents.mockResolvedValue({
      events: [
        {
          data: [testAddress, "0xdeployer"],
          transaction_hash: mockDeploymentHash,
          block_number: mockBlockNumber,
        },
      ],
    });
    mockRpcProvider.getBlock.mockRejectedValue(new Error("Block fetch failed"));

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails.deployedAt).toBeUndefined();
  });

  it("should handle complete fetch errors gracefully", async () => {
    const testAddress = "0x123456789abcdef";

    mockRpcProvider.getClassAt.mockRejectedValue(new Error("Complete failure"));
    mockRpcProvider.getClassHashAt.mockRejectedValue(
      new Error("Complete failure"),
    );

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // The hook handles errors gracefully and falls back to ACCOUNT type
    expect(result.current.addressDetails.type).toBe("ACCOUNT");
    expect(result.current.error).toBeUndefined();
  });

  it("should refetch data when refetch is called", async () => {
    const testAddress = "0x123456789abcdef";

    mockRpcProvider.getClassAt.mockRejectedValue(new Error("No class"));
    mockRpcProvider.getClassHashAt.mockRejectedValue(
      new Error("No class hash"),
    );

    const { result } = renderHook(() => useFetchAddressDetails(testAddress), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.addressDetails.type).toBe("ACCOUNT");

    // Now mock successful response
    const mockAbi = [{ type: "interface", name: "ITest", items: [] }];
    mockRpcProvider.getClassAt.mockResolvedValue({ abi: mockAbi });
    mockRpcProvider.getClassHashAt.mockResolvedValue("0xabc123");
    mockRpcProvider.getContractVersion.mockResolvedValue({ cairo: "1.0" });
    mockRpcProvider.getEvents.mockResolvedValue({ events: [] });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.addressDetails.type).toBe("CONTRACT");
    });
  });
});
