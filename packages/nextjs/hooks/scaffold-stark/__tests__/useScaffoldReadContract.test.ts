import { renderHook } from "@testing-library/react";
import { useScaffoldReadContract } from "../useScaffoldReadContract";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useReadContract } from "@starknet-react/core";
import { vi, describe, it, expect,  } from 'vitest';
//import { ContractCodeStatus } from "~~/utils/scaffold-stark/contract";
//import { functionName, contractName } from ;

// Mocking dependencies
// Mocking the useDeployedContractInfo hook from the ~~/hooks/scaffold-stark module
vi.mock("~~/hooks/scaffold-stark", () => ({
  useDeployedContractInfo: vi.fn(), //The vi.fn() creates a mock function
}));

//Mocking the useReadContract hook from the @starknet-react/core library
vi.mock("@starknet-react/core", () => ({
  useReadContract: vi.fn(),
}));

describe("useScaffoldReadContract", () => {
  const contractName = "TestContract";
  const functionName = "testFunction";
  const args = [1, 2, 3];
  
  // it("should call useReadContract only with correct parameters when deployedContract is defined", () => {
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
  //      contractName: "Strk",
  //      functionName,
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
    // Mocking deployed contract info to be undefined
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: undefined,
    });

    // Mocking useReadContract function
    const mockUseReadContract = useReadContract as vi.Mock;
    mockUseReadContract.mockReturnValue({
      data: "mockedData",
    });

    // To render the hook
    renderHook(() =>
      useScaffoldReadContract({
        contractName: "Strk",
        functionName: "testFunction",
        args,
      })
    );

    // Ensuring that useReadContract is not called when deployedContract is undefined
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
    // Mocking deployed contract info
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: {
        address: "0x123",
        abi: [{ name: "testFunction" }],
      },
    });

    // To render the hook with args containing undefined
    renderHook(() =>
      useScaffoldReadContract({
        contractName: "Eth",
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
      enabled: false, // Hook should be disabled when args contains undefined
      blockIdentifier: "pending",
    });
  });

  
});
