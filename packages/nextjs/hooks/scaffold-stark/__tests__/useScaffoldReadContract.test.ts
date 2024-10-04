import { renderHook } from "@testing-library/react";
import { useScaffoldReadContract } from "../useScaffoldReadContract";
import { useReadContract } from "@starknet-react/core";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { vi, describe, it, expect } from 'vitest'; 

// Mocking dependencies using Vitest
vi.mock("~~/hooks/scaffold-stark", () => ({
  useDeployedContractInfo: vi.fn(() => ({
    data: {
      address: "0x123",
      abi: [{ name: "symbol" }],
    },
  })),
}));

vi.mock("@starknet-react/core", () => ({
  useReadContract: vi.fn(),
}));

describe("useScaffoldReadContract", () => {
  const contractName = "Eth"; // Use a valid contract name
  const functionName = "symbol"; // Use a valid function name

  it("should call useReadContract with correct parameters when deployedContract is defined", () => {
    const mockUseReadContract = useReadContract as vi.Mock;
    mockUseReadContract.mockReturnValue({
      data: "mockedData",
    });

    const filteredArgs = [1, undefined, 3].filter(arg => arg !== undefined);

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: filteredArgs, // Pass filtered args
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith({
      functionName: "symbol",
      address: "0x123",
      abi: [{ name: "symbol" }],
      watch: true,
      args: filteredArgs,
      enabled: true,
      blockIdentifier: "pending",
    });
  });

  it("should disable read when args contain undefined", () => {
    const mockUseReadContract = useReadContract as vi.Mock;

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: [1, undefined, 3], // args with undefined
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false, // The read should be disabled if args contain undefined
      })
    );
  });

  it("should enable read when args do not contain undefined", () => {
    const mockUseReadContract = useReadContract as vi.Mock;

    const filteredArgs = [1, 2, 3];

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: filteredArgs,
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true, // The read should be enabled since args do not contain undefined
      })
    );
  });

  it("should pass blockIdentifier as 'pending'", () => {
    const mockUseReadContract = useReadContract as vi.Mock;

    const filteredArgs = [1, 2];

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: filteredArgs,
      })
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        blockIdentifier: "pending", // Ensure blockIdentifier is passed as 'pending'
      })
    );
  });
});
