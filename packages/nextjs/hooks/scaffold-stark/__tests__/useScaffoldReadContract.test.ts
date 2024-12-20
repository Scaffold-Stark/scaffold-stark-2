import { renderHook } from "@testing-library/react";
import { useScaffoldReadContract } from "../useScaffoldReadContract";
import { useReadContract } from "@starknet-react/core";
import { vi, describe, it, expect, Mock } from "vitest";

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
  const contractName = "Eth"; // Using a valid contract name. we could use 'TestContract' here
  const functionName = "symbol"; // Using a valid function name. we could actually use 'testFunction' here

  const mockUseReadContract = useReadContract as unknown as Mock;

  it("should call useReadContract with correct parameters when deployedContract is defined", () => {
    mockUseReadContract.mockReturnValue({
      data: "mockedData",
    });

    const filteredArgs = [1, undefined, 3].filter((arg) => arg !== undefined);

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: filteredArgs, // Pass filtered args
      }),
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
    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: [1, undefined, 3], // args with undefined
      }),
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false, // The read should be disabled if args contain undefined
      }),
    );
  });

  it("should enable read when args do not contain undefined", () => {
    const filteredArgs = [1, 2, 3];

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: filteredArgs,
      }),
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true, // The read should be enabled since args do not contain undefined, args was filtered
      }),
    );
  });

  it("should pass blockIdentifier as 'pending'", () => {
    const filteredArgs = [1, 2];

    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: filteredArgs,
      }),
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        blockIdentifier: "pending", // Ensure blockIdentifier is passed as 'pending'. using the default which is 'pending'
      }),
    );
  });
});
