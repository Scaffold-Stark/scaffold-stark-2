import { renderHook } from "@testing-library/react";
import { useScaffoldReadContract } from "../useScaffoldReadContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useReadContract } from "@starknet-react/core";
import { vi, describe, it, expect,  } from 'vitest';
//import { ContractCodeStatus } from "~~/utils/scaffold-stark/contract";
//import { functionName, contractName } from ;

// Mocking dependencies
vi.mock("~~/hooks/scaffold-stark", () => ({
  useDeployedContractInfo: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
  useReadContract: vi.fn(),
}));

describe("useScaffoldReadContract", () => {
  const contractName = "TestContract";
  const functionName = "testFunction";
  const args = [1, 2, 3];
  
  // it("should call useReadContract with correct parameters when deployedContract is defined", () => {
  //   // Mock deployed contract info
  //   (useDeployedContractInfo as vi.Mock).mockReturnValue({
  //     data: {
  //       address: "0x123",
  //       abi: [{ name: "symbol" }],
  //     },
  //   });

  //   // Mock useReadContract function
  //   const mockUseReadContract = useReadContract as vi.Mock;
  //   mockUseReadContract.mockReturnValue({
  //     data: "mockedData",
  //   });

  //   // Filter out undefined values from the args array
  //   const filteredArgs = [1, undefined, 3].filter(arg => arg !== undefined);

  //   // Render the hook
  //   renderHook(() =>
  //     useScaffoldReadContract({
  //       contractName,
  //       functionName,
  //       args: filteredArgs, // Pass filtered args
  //     })
  //   );

  //   // Validate that useReadContract was called with the correct arguments
  //   expect(mockUseReadContract).toHaveBeenCalledWith({
  //     functionName: "symbol",
  //     address: "0x123",
  //     abi: [{ name: "symbol" }],
  //     watch: true,
  //     args: filteredArgs,
  //     enabled: true,
  //     blockIdentifier: "pending",
  //   });
  // });

  it("should handle when deployedContract is undefined", () => {
    // Mock deployed contract info to be undefined
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: undefined,
    });

    // Mock useReadContract function
    const mockUseReadContract = useReadContract as vi.Mock;
    mockUseReadContract.mockReturnValue({
      data: "mockedData",
    });

    // Render the hook
    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args,
      })
    );

    // Ensure useReadContract is not called when deployedContract is undefined
    expect(mockUseReadContract).toHaveBeenCalledWith({
      functionName: "testFunction",
      address: undefined,
      abi: undefined,
      watch: true,
      args: [1, 2, 3],
      enabled: true,
      blockIdentifier: "pending",
    });
  });

  it("should disable the hook when args contain undefined", () => {
    // Mock deployed contract info
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: {
        address: "0x123",
        abi: [{ name: "testFunction" }],
      },
    });

    // To render the hook with args containing undefined
    renderHook(() =>
      useScaffoldReadContract({
        contractName,
        functionName,
        args: [1, undefined, 3], // args with undefined
      })
    );

    // To validate that the hook is disabled
    expect(useReadContract).toHaveBeenCalledWith({
      functionName: "testFunction",
      address: "0x123",
      abi: [{ name: "testFunction" }],
      watch: true,
      args: [1, undefined, 3],
      enabled: false, // Hook should be disabled when args contain undefined
      blockIdentifier: "pending",
    });
  });
});
