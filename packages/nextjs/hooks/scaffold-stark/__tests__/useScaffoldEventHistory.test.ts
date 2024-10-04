import { renderHook, act, waitFor } from "@testing-library/react";
import { useScaffoldEventHistory } from '../useScaffoldEventHistory';
import { useDeployedContractInfo } from '~~/hooks/scaffold-stark';
import { useTargetNetwork } from '../useTargetNetwork';
import { useProvider } from '@starknet-react/core';
import { RpcProvider } from 'starknet';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mock dependencies
vi.mock('~~/hooks/scaffold-stark', () => ({
  useDeployedContractInfo: vi.fn(),
}));

vi.mock('../useTargetNetwork', () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock('@starknet-react/core', () => ({
  useProvider: vi.fn(),
}));

describe('useScaffoldEventHistory', () => {
  const mockContractName: "Eth" | "Strk" = "Strk";
  const mockEventName: "openzeppelin::token::erc20_v070::erc20::ERC20::Transfer" | "openzeppelin::token::erc20_v070::erc20::ERC20::Event"
 = "openzeppelin::token::erc20_v070::erc20::ERC20::Event";
  const mockDeployedContractData = {
    abi: [
      {
        type: 'event',
        name: mockEventName,
        members: [
          { name: 'arg1', type: 'felt', kind: 'key' },
          { name: 'arg2', type: 'felt', kind: 'data' },
        ],
      },
    ],
    address: '0x1234567890abcdef',
  };
  const mockTargetNetwork = {
    id: 'testnet',
    rpcUrls: {
      public: {
        http: ['https://mock-rpc-url'],
      },
    },
  };
  const mockEvents = [
    {
      log: {
        keys: ['0x1'],
        data: ['0x2'],
      },
      block_hash: '0xabc',
      transaction_hash: '0xdef',
    },
  ];

  beforeEach(() => {
    (useDeployedContractInfo as vi.Mock).mockReturnValue({
      data: mockDeployedContractData,
      isLoading: false,
    });

    (useTargetNetwork as vi.Mock).mockReturnValue({
      targetNetwork: mockTargetNetwork,
    });

    (useProvider as vi.Mock).mockReturnValue({
      provider: new RpcProvider({
        nodeUrl: mockTargetNetwork.rpcUrls.public.http[0],
      }),
    });

    // Mock RpcProvider methods
    RpcProvider.prototype.getBlockLatestAccepted = vi.fn().mockResolvedValue({
      block_number: 1000,
    });

    RpcProvider.prototype.getEvents = vi.fn().mockResolvedValue({
      events: mockEvents,
    });

    RpcProvider.prototype.getBlockWithTxHashes = vi.fn().mockResolvedValue({
      block_hash: '0xabc',
    });

    RpcProvider.prototype.getTransactionByHash = vi.fn().mockResolvedValue({
      transaction_hash: '0xdef',
    });

    RpcProvider.prototype.getTransactionReceipt = vi.fn().mockResolvedValue({
      transaction_hash: '0xdef',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return events from the contract', async () => {
    const { result } = renderHook(() =>
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

    // Wait for the hook to update
    await waitFor(() => {
      // Wait until isLoading becomes true
      expect(result.current.isLoading).toBe(true);
    });

    // Check that loading is true and events are fetched
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([
        {
             "args":{
               "arg1": "0x1",
               "arg2": "0x2",
             },
             "block":{
               "block_hash": "0xabc",
             },
             "log":{
               "block_hash": "0xabc",
               "log": {
                 "data": [
                   "0x2",
                 ],
                 "keys": [
                   "0x1",
                 ],
               },
               "transaction_hash": "0xdef",
             },
             "receipt":{
               "transaction_hash": "0xdef",
             },
             "transaction": {
               "transaction_hash": "0xdef",
             },
           },
        
    ]);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle errors when fetching events', async () => {
    // Mock an error in the getEvents method
    RpcProvider.prototype.getEvents = vi.fn().mockRejectedValue(new Error('Failed to fetch events'));

    const { result } = renderHook(() =>
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

    // Wait for the hook to update
    await waitFor(() => {
      // Wait until isLoading becomes false
      expect(result.current.isLoading).toBe(false);
    });

    // Check that an error occurred
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  
  });

  it('should reset the internal state when fromBlock or network changes', async () => {
    const { result, rerender } = renderHook(
      ({ fromBlock }) =>
        useScaffoldEventHistory({
          contractName: mockContractName,
          eventName: mockEventName,
          fromBlock,
          filters: {},
          blockData: true,
          transactionData: true,
          receiptData: true,
          watch: false,
          enabled: true,
        }),
      {
        initialProps: {
          fromBlock: BigInt(1),
        },
      }
    );

    await waitFor(() => {
      // Wait until isLoading becomes true
      expect(result.current.isLoading).toBe(true);
    }); // Wait for the first update

    // Simulate changing the fromBlock and rerender the hook
    rerender({ fromBlock: BigInt(100) });

    expect(result.current.data).toEqual([]); // Events should be reset
    expect(result.current.error).toBeUndefined();
  });
});
