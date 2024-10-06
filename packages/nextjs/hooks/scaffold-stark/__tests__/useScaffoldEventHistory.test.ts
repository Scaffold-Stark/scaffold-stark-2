import { renderHook, act } from "@testing-library/react";
import { useScaffoldEventHistory } from "../useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "../useTargetNetwork";
import { useProvider } from "@starknet-react/core";
import { RpcProvider } from "starknet";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";

// Mock dependencies
vi.mock("~~/hooks/scaffold-stark", () => ({
    useDeployedContractInfo: vi.fn(),
}));

vi.mock("../useTargetNetwork", () => ({
    useTargetNetwork: vi.fn(),
}));

vi.mock("@starknet-react/core", () => ({
    useProvider: vi.fn(),
}));

describe("useScaffoldEventHistory", () => {
    const mockContractName = "Strk";
    const mockEventName =
        "openzeppelin::token::erc20_v070::erc20::ERC20::Event";
    const mockDeployedContractData = {
        abi: [
            {
                type: "event",
                name: mockEventName,
                members: [
                    { name: "from_", type: "felt", kind: "key" },
                    { name: "to", type: "felt", kind: "key" },
                    { name: "value", type: "felt", kind: "data" },
                ],
            },
        ],
        address: "0x1234567890abcdef",
    };
    const mockTargetNetwork = {
        id: "testnet",
        rpcUrls: {
            public: {
                http: ["https://mock-rpc-url"],
            },
        },
    };
    const mockEvents = [
        {
            block_hash: "0xabc",
            block_number: 1000,
            transaction_hash: "0xdef",
            from_address: "0x1111",
            keys: ["0x111111", "0x222222"],
            data: ["0x1000"],
        },
    ];

    beforeEach(() => {
        (useDeployedContractInfo as Mock).mockReturnValue({
            data: mockDeployedContractData,
            isLoading: false,
        });

        (useTargetNetwork as Mock).mockReturnValue({
            targetNetwork: mockTargetNetwork,
        });

        (useProvider as Mock).mockReturnValue({
            provider: new RpcProvider({
                nodeUrl: mockTargetNetwork.rpcUrls.public.http[0],
            }),
        });

        // Mock RpcProvider methods
        RpcProvider.prototype.getBlockLatestAccepted = vi
            .fn()
            .mockResolvedValue({
                block_number: 1000,
            });

        RpcProvider.prototype.getEvents = vi.fn().mockResolvedValue({
            events: mockEvents,
        });

        RpcProvider.prototype.getBlockWithTxHashes = vi.fn().mockResolvedValue({
            block_hash: "0xabc",
        });

        RpcProvider.prototype.getTransactionByHash = vi.fn().mockResolvedValue({
            transaction_hash: "0xdef",
        });

        RpcProvider.prototype.getTransactionReceipt = vi
            .fn()
            .mockResolvedValue({
                transaction_hash: "0xdef",
            });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch and return events from the contract after mimicking a transaction", async () => {
        const { result, rerender } = renderHook(() =>
            useScaffoldEventHistory({
                contractName: mockContractName,
                eventName: mockEventName,
                fromBlock: BigInt(1),
                filters: {},
                blockData: true,
                transactionData: true,
                receiptData: true,
                watch: false,
                enabled: true,
            })
        );

        // Initially, data should be loading
        expect(result.current.isLoading).toBe(true);

        // Manually trigger a re-render to simulate the async update
        await act(async () => {
            rerender();
        });

        // Wait for the loading to complete and data to be populated
        await vi.waitFor(
            () => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.data).toBeDefined();
            },
            { timeout: 5000 }
        );

        // Check that events are fetched correctly
        expect(result.current.data).toEqual([
            {
                block: { block_hash: "0xabc" },
                transaction: { transaction_hash: "0xdef" },
                receipt: { transaction_hash: "0xdef" },
                args: {
                    from_: "0x222222",
                    to: "0x222222",
                    value: "0x1000",
                },
                log: mockEvents[0],
            },
        ]);
        expect(result.current.error).toBeUndefined();
    });
});
