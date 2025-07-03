import { renderHook } from "@testing-library/react";
import {
    useScaffoldMultiReadContract,
    createMultiReadCall,
} from "../useScaffoldMultiReadContract";
import { useReadContract } from "@starknet-react/core";
import { vi, describe, it, expect, Mock, beforeEach } from "vitest";

// Mocking dependencies using Vitest
vi.mock("~~/hooks/scaffold-stark", () => ({
    useDeployedContractInfo: vi.fn((contractName: string) => {
        if (contractName === "Multicall") {
            return {
                data: {
                    address:
                        "0x05754af3760f3356da99aea5c3ec39ccac7783d925a19666ebbeca58ff0087f4",
                    abi: [
                        {
                            type: "function",
                            name: "call_contracts",
                            inputs: [],
                            outputs: [],
                        },
                    ],
                },
            };
        }
        return {
            data: {
                address: "0x123",
                abi: [
                    {
                        type: "function",
                        name: "symbol",
                        inputs: [],
                        outputs: [{ type: "core::felt252" }],
                    },
                    {
                        type: "function",
                        name: "balance_of",
                        inputs: [
                            {
                                name: "account",
                                type: "core::starknet::contract_address::ContractAddress",
                            },
                        ],
                        outputs: [{ type: "core::integer::u256" }],
                    },
                ],
            },
        };
    }),
}));

vi.mock("@starknet-react/core", () => ({
    useReadContract: vi.fn(),
}));

// Mock starknet with all required exports
vi.mock("starknet", async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        hash: {
            getSelectorFromName: vi.fn((name: string) => {
                // Mock hash function that returns a predictable selector
                return `0x${name.length.toString().padStart(64, "0")}`;
            }),
        },
        validateAndParseAddress: vi.fn((address: string) => address),
        uint256: {
            uint256ToBN: vi.fn((value: any) => value),
            bnToUint256: vi.fn((value: any) => value),
        },
        byteArray: {
            byteArrayFromString: vi.fn((value: any) => value),
        },
    };
});

describe("useScaffoldMultiReadContract", () => {
    const mockUseReadContract = useReadContract as unknown as Mock;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call useReadContract with correct parameters when all contracts are ready", () => {
        mockUseReadContract.mockReturnValue({
            data: [["0x123"], ["0x456"]],
        });

        const calls = [
            createMultiReadCall("Strk", "symbol", []),
            createMultiReadCall("Strk", "balance_of", ["0x789"]),
        ];

        renderHook(() =>
            useScaffoldMultiReadContract({
                calls,
            })
        );

        expect(mockUseReadContract).toHaveBeenCalledWith({
            functionName: "call_contracts",
            address:
                "0x05754af3760f3356da99aea5c3ec39ccac7783d925a19666ebbeca58ff0087f4",
            abi: expect.any(Array),
            watch: true,
            args: [
                ["0x123", "0x123"],
                [
                    "0x0000000000000000000000000000000000000000000000000000000000000006",
                    "0x000000000000000000000000000000000000000000000000000000000000000b",
                ],
                [[], ["0x789"]],
            ],
            enabled: true,
            blockIdentifier: "pending",
        });
    });

    it("should disable read when Multicall contract is not available", () => {
        // Mock useDeployedContractInfo to return undefined for Multicall
        const { useDeployedContractInfo } = require("~~/hooks/scaffold-stark");
        vi.mocked(useDeployedContractInfo).mockImplementation(
            (contractName: string) => {
                if (contractName === "Multicall") {
                    return { data: undefined };
                }
                return {
                    data: {
                        address: "0x123",
                        abi: [
                            {
                                type: "function",
                                name: "symbol",
                                inputs: [],
                                outputs: [],
                            },
                        ],
                    },
                };
            }
        );

        const calls = [createMultiReadCall("Strk", "symbol", [])];

        renderHook(() =>
            useScaffoldMultiReadContract({
                calls,
            })
        );

        expect(mockUseReadContract).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: false,
            })
        );
    });

    it("should disable read when no calls are provided", () => {
        mockUseReadContract.mockReturnValue({
            data: [],
        });

        renderHook(() =>
            useScaffoldMultiReadContract({
                calls: [],
            })
        );

        expect(mockUseReadContract).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: false,
            })
        );
    });

    it("should parse results correctly", () => {
        const mockResults = [["0x123"], ["0x456"]];
        mockUseReadContract.mockReturnValue({
            data: mockResults,
        });

        const calls = [
            createMultiReadCall("Strk", "symbol", []),
            createMultiReadCall("Strk", "balance_of", ["0x789"]),
        ];

        const { result } = renderHook(() =>
            useScaffoldMultiReadContract({
                calls,
            })
        );

        expect(result.current.data).toEqual(mockResults);
    });
});

describe("createMultiReadCall", () => {
    it("should create a multi-read call object", () => {
        const call = createMultiReadCall("Strk", "symbol", []);

        expect(call).toEqual({
            contractName: "Strk",
            functionName: "symbol",
            args: [],
        });
    });

    it("should create a multi-read call object with args", () => {
        const call = createMultiReadCall("Strk", "balance_of", ["0x789"]);

        expect(call).toEqual({
            contractName: "Strk",
            functionName: "balance_of",
            args: ["0x789"],
        });
    });
});
