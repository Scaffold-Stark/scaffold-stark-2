import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { useDeployedContractInfo } from "../useDeployedContractInfo";
import { useTargetNetwork } from "../useTargetNetwork";
import { useIsMounted } from "usehooks-ts";
import { useProvider } from "@starknet-react/core";
import { RpcProvider } from "starknet";

const mockGetClassHashAt = vi
  .fn()
  .mockImplementation(async (): Promise<string | undefined> => "0x1234567");

// Mock the dependencies
vi.mock("../useTargetNetwork", () => ({
  useTargetNetwork: vi.fn(),
}));

vi.mock("usehooks-ts", () => ({
  useIsMounted: vi.fn(),
}));

vi.mock("starknet", () => ({
  RpcProvider: vi.fn().mockImplementation(() => ({
    getClassHashAt: mockGetClassHashAt,
  })),
}));

vi.mock("@starknet-react/core");

vi.mock("~~/utils/scaffold-stark/contract", () => ({
  // these are hoisted to the top, so the variable has to re-declared into the test suite
  contracts: {
    someNetwork: {
      YourContract: {
        address:
          "0x6e0d97cfd6ad07cea15de51b1761b70cc648948fd183ce03cac9e3a1f8c7f26",
        abi: [
          {
            type: "impl",
            name: "YourContractImpl",
            interface_name: "contracts::YourContract::IYourContract",
          },
          {
            type: "struct",
            name: "core::byte_array::ByteArray",
            members: [
              {
                name: "data",
                type: "core::array::Array::<core::bytes_31::bytes31>",
              },
              {
                name: "pending_word",
                type: "core::felt252",
              },
              {
                name: "pending_word_len",
                type: "core::integer::u32",
              },
            ],
          },
          {
            type: "struct",
            name: "core::integer::u256",
            members: [
              {
                name: "low",
                type: "core::integer::u128",
              },
              {
                name: "high",
                type: "core::integer::u128",
              },
            ],
          },
          {
            type: "enum",
            name: "core::bool",
            variants: [
              {
                name: "False",
                type: "()",
              },
              {
                name: "True",
                type: "()",
              },
            ],
          },
          {
            type: "interface",
            name: "contracts::YourContract::IYourContract",
            items: [
              {
                type: "function",
                name: "greeting",
                inputs: [],
                outputs: [
                  {
                    type: "core::byte_array::ByteArray",
                  },
                ],
                state_mutability: "view",
              },
              {
                type: "function",
                name: "set_greeting",
                inputs: [
                  {
                    name: "new_greeting",
                    type: "core::byte_array::ByteArray",
                  },
                  {
                    name: "amount_eth",
                    type: "core::integer::u256",
                  },
                ],
                outputs: [],
                state_mutability: "external",
              },
              {
                type: "function",
                name: "withdraw",
                inputs: [],
                outputs: [],
                state_mutability: "external",
              },
              {
                type: "function",
                name: "premium",
                inputs: [],
                outputs: [
                  {
                    type: "core::bool",
                  },
                ],
                state_mutability: "view",
              },
            ],
          },
          {
            type: "impl",
            name: "OwnableImpl",
            interface_name: "openzeppelin_access::ownable::interface::IOwnable",
          },
          {
            type: "interface",
            name: "openzeppelin_access::ownable::interface::IOwnable",
            items: [
              {
                type: "function",
                name: "owner",
                inputs: [],
                outputs: [
                  {
                    type: "core::starknet::contract_address::ContractAddress",
                  },
                ],
                state_mutability: "view",
              },
              {
                type: "function",
                name: "transfer_ownership",
                inputs: [
                  {
                    name: "new_owner",
                    type: "core::starknet::contract_address::ContractAddress",
                  },
                ],
                outputs: [],
                state_mutability: "external",
              },
              {
                type: "function",
                name: "renounce_ownership",
                inputs: [],
                outputs: [],
                state_mutability: "external",
              },
            ],
          },
          {
            type: "constructor",
            name: "constructor",
            inputs: [
              {
                name: "owner",
                type: "core::starknet::contract_address::ContractAddress",
              },
            ],
          },
          {
            type: "event",
            name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
            kind: "struct",
            members: [
              {
                name: "previous_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              {
                name: "new_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
            ],
          },
          {
            type: "event",
            name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
            kind: "struct",
            members: [
              {
                name: "previous_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              {
                name: "new_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
            ],
          },
          {
            type: "event",
            name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
            kind: "enum",
            variants: [
              {
                name: "OwnershipTransferred",
                type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
                kind: "nested",
              },
              {
                name: "OwnershipTransferStarted",
                type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
                kind: "nested",
              },
            ],
          },
          {
            type: "event",
            name: "contracts::YourContract::YourContract::GreetingChanged",
            kind: "struct",
            members: [
              {
                name: "greeting_setter",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              {
                name: "new_greeting",
                type: "core::byte_array::ByteArray",
                kind: "key",
              },
              {
                name: "premium",
                type: "core::bool",
                kind: "data",
              },
              {
                name: "value",
                type: "core::integer::u256",
                kind: "data",
              },
            ],
          },
          {
            type: "event",
            name: "contracts::YourContract::YourContract::Event",
            kind: "enum",
            variants: [
              {
                name: "OwnableEvent",
                type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
                kind: "flat",
              },
              {
                name: "GreetingChanged",
                type: "contracts::YourContract::YourContract::GreetingChanged",
                kind: "nested",
              },
            ],
          },
        ],
        classHash:
          "0x15981f4687739d007cf4d6ec112dc72f2e46026c1d1e031ec698fb282d43399",
      },
    },
  },
  ContractCodeStatus: {
    LOADING: "loading",
    DEPLOYED: "deployed",
    NOT_FOUND: "not_found",
  },
}));

describe("useDeployedContractInfo", () => {
  const mockContracts = {
    someNetwork: {
      YourContract: {
        address:
          "0x6e0d97cfd6ad07cea15de51b1761b70cc648948fd183ce03cac9e3a1f8c7f26",
        abi: [
          {
            type: "impl",
            name: "YourContractImpl",
            interface_name: "contracts::YourContract::IYourContract",
          },
          {
            type: "struct",
            name: "core::byte_array::ByteArray",
            members: [
              {
                name: "data",
                type: "core::array::Array::<core::bytes_31::bytes31>",
              },
              {
                name: "pending_word",
                type: "core::felt252",
              },
              {
                name: "pending_word_len",
                type: "core::integer::u32",
              },
            ],
          },
          {
            type: "struct",
            name: "core::integer::u256",
            members: [
              {
                name: "low",
                type: "core::integer::u128",
              },
              {
                name: "high",
                type: "core::integer::u128",
              },
            ],
          },
          {
            type: "enum",
            name: "core::bool",
            variants: [
              {
                name: "False",
                type: "()",
              },
              {
                name: "True",
                type: "()",
              },
            ],
          },
          {
            type: "interface",
            name: "contracts::YourContract::IYourContract",
            items: [
              {
                type: "function",
                name: "greeting",
                inputs: [],
                outputs: [
                  {
                    type: "core::byte_array::ByteArray",
                  },
                ],
                state_mutability: "view",
              },
              {
                type: "function",
                name: "set_greeting",
                inputs: [
                  {
                    name: "new_greeting",
                    type: "core::byte_array::ByteArray",
                  },
                  {
                    name: "amount_eth",
                    type: "core::integer::u256",
                  },
                ],
                outputs: [],
                state_mutability: "external",
              },
              {
                type: "function",
                name: "withdraw",
                inputs: [],
                outputs: [],
                state_mutability: "external",
              },
              {
                type: "function",
                name: "premium",
                inputs: [],
                outputs: [
                  {
                    type: "core::bool",
                  },
                ],
                state_mutability: "view",
              },
            ],
          },
          {
            type: "impl",
            name: "OwnableImpl",
            interface_name: "openzeppelin_access::ownable::interface::IOwnable",
          },
          {
            type: "interface",
            name: "openzeppelin_access::ownable::interface::IOwnable",
            items: [
              {
                type: "function",
                name: "owner",
                inputs: [],
                outputs: [
                  {
                    type: "core::starknet::contract_address::ContractAddress",
                  },
                ],
                state_mutability: "view",
              },
              {
                type: "function",
                name: "transfer_ownership",
                inputs: [
                  {
                    name: "new_owner",
                    type: "core::starknet::contract_address::ContractAddress",
                  },
                ],
                outputs: [],
                state_mutability: "external",
              },
              {
                type: "function",
                name: "renounce_ownership",
                inputs: [],
                outputs: [],
                state_mutability: "external",
              },
            ],
          },
          {
            type: "constructor",
            name: "constructor",
            inputs: [
              {
                name: "owner",
                type: "core::starknet::contract_address::ContractAddress",
              },
            ],
          },
          {
            type: "event",
            name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
            kind: "struct",
            members: [
              {
                name: "previous_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              {
                name: "new_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
            ],
          },
          {
            type: "event",
            name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
            kind: "struct",
            members: [
              {
                name: "previous_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              {
                name: "new_owner",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
            ],
          },
          {
            type: "event",
            name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
            kind: "enum",
            variants: [
              {
                name: "OwnershipTransferred",
                type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
                kind: "nested",
              },
              {
                name: "OwnershipTransferStarted",
                type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
                kind: "nested",
              },
            ],
          },
          {
            type: "event",
            name: "contracts::YourContract::YourContract::GreetingChanged",
            kind: "struct",
            members: [
              {
                name: "greeting_setter",
                type: "core::starknet::contract_address::ContractAddress",
                kind: "key",
              },
              {
                name: "new_greeting",
                type: "core::byte_array::ByteArray",
                kind: "key",
              },
              {
                name: "premium",
                type: "core::bool",
                kind: "data",
              },
              {
                name: "value",
                type: "core::integer::u256",
                kind: "data",
              },
            ],
          },
          {
            type: "event",
            name: "contracts::YourContract::YourContract::Event",
            kind: "enum",
            variants: [
              {
                name: "OwnableEvent",
                type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
                kind: "flat",
              },
              {
                name: "GreetingChanged",
                type: "contracts::YourContract::YourContract::GreetingChanged",
                kind: "nested",
              },
            ],
          },
        ],
        classHash:
          "0x15981f4687739d007cf4d6ec112dc72f2e46026c1d1e031ec698fb282d43399",
      },
    },
  };

  const mockIsMounted = vi.fn();
  const mockUseTargetNetwork = {
    targetNetwork: {
      network: "someNetwork",
      rpcUrls: {
        public: {
          http: ["http://public-node-url"],
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTargetNetwork as Mock).mockReturnValue(mockUseTargetNetwork);
    (useIsMounted as Mock).mockReturnValue(mockIsMounted);
    (useProvider as Mock).mockReturnValue({
      provider: new RpcProvider({
        nodeUrl: "https://mock-rpc-url",
      }),
    });
  });

  it("should initially set the status to LOADING", () => {
    const { result } = renderHook(() =>
      //@ts-ignore using ts ignore so wont error in other devices
      useDeployedContractInfo("YourContract"),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should set the status to NOT_FOUND if no deployed contract is found", async () => {
    mockGetClassHashAt.mockImplementationOnce(async () => undefined);
    mockIsMounted.mockReturnValue(true);

    const { result } = renderHook(() =>
      //@ts-ignore using ts ignore so wont error in other devices
      useDeployedContractInfo("SomeContract"),
    );

    // Wait for the hook to update
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  it("should set the status to DEPLOYED if the contract is found", async () => {
    mockIsMounted.mockReturnValue(true);

    const { result } = renderHook(() =>
      //@ts-ignore using ts ignore so wont error in other devices
      useDeployedContractInfo("YourContract"),
    );

    // Wait for the hook to update
    act(async () => {
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data?.address).toEqual(
          mockContracts.someNetwork.YourContract.address,
        );
      });
    });
  });

  it("should not update status if component is unmounted", async () => {
    mockIsMounted.mockReturnValue(false); // Simulate unmount

    const { result } = renderHook(() =>
      //@ts-ignore using ts ignore so wont error in other devices
      useDeployedContractInfo("YourContract"),
    );

    // Wait for the hook to update
    act(async () => {
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined(); // Should not update the data
      });
    });
  });
});
