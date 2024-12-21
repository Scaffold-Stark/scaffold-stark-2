import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  deepMergeContracts,
  getFunctionsByStateMutability,
  contracts,
  parseParamWithType,
  parseTuple,
} from "../contract";
import { Abi } from "abi-wan-kanabi";

describe("deepMergeContracts", () => {
  it("should merge two contract objects correctly", () => {
    const local = { contractA: { value: 1 } };
    const external = { contractA: { value: 2 }, contractB: { value: 3 } };
    const result = deepMergeContracts(local, external);
    expect(result).toEqual({
      contractA: { value: 2 },
      contractB: { value: 3 },
    });
  });

  it("should handle nested objects correctly", () => {
    const local = { contractA: { settings: { enabled: true } } };
    const external = {
      contractA: { settings: { enabled: false, version: "1.0" } },
    };
    const result = deepMergeContracts(local, external);
    expect(result).toEqual({
      contractA: {
        settings: { enabled: false, version: "1.0" },
      },
    });
  });

  it("should handle complex nested merging scenarios", () => {
    const local = {
      networkA: {
        contractA: {
          address: "0x123",
          config: { enabled: true, version: "1.0" },
        },
      },
    };
    const external = {
      networkA: {
        contractA: {
          abi: ["someAbi"],
          config: { version: "2.0", newSetting: true },
        },
        contractB: { name: "New Contract" },
      },
    };

    const result = deepMergeContracts(local, external);
    expect(result).toEqual({
      networkA: {
        contractA: {
          address: "0x123",
          abi: ["someAbi"],
          config: { enabled: true, version: "2.0", newSetting: true },
        },
        contractB: { name: "New Contract" },
      },
    });
  });

  it("should handle multiple network configurations", () => {
    const local = {
      networkA: { contractA: { value: 1 } },
      networkB: { contractB: { value: 2 } },
    };
    const external = {
      networkA: { contractA: { newValue: 10 } },
      networkC: { contractC: { value: 3 } },
    };

    const result = deepMergeContracts(local, external);
    expect(result).toEqual({
      networkA: { contractA: { value: 1, newValue: 10 } },
      networkB: { contractB: { value: 2 } },
      networkC: { contractC: { value: 3 } },
    });
  });

  it("should preserve local keys when external is empty", () => {
    const local = { networkA: { contractA: { value: 1 } } };
    const external = {};

    const result = deepMergeContracts(local, external);
    expect(result).toEqual(local);
  });

  it("should completely replace local keys when external is provided", () => {
    const local = { networkA: { contractA: { value: 1 } } };
    const external = { networkA: { contractA: { newValue: 2 } } };

    const result = deepMergeContracts(local, external);
    expect(result).toEqual({
      networkA: {
        contractA: {
          value: 1,
          newValue: 2,
        },
      },
    });
  });

  it("should return local object if external is empty", () => {
    const local = { contractA: { value: 1 } };
    const external = {};
    const result = deepMergeContracts(local, external);
    expect(result).toEqual(local);
  });

  it("should return external object when local is empty", () => {
    const local = {};
    const external = { contractA: { value: 5 } };
    const result = deepMergeContracts(local, external);
    expect(result).toEqual(external);
  });
});

describe("getFunctionsByStateMutability", () => {
  it("should return only functions with the specified state mutability", () => {
    const abi: Abi = [
      {
        type: "function",
        name: "func1",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
      {
        type: "function",
        name: "func2",
        state_mutability: "external",
        inputs: [],
        outputs: [],
      },
      {
        type: "function",
        name: "func3",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
    ];

    const result = getFunctionsByStateMutability(abi, "view");
    expect(result).toEqual([
      {
        type: "function",
        name: "func1",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
      {
        type: "function",
        name: "func3",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
    ]);
  });
  it("should return an empty array if no functions match the state mutability", () => {
    const abi: Abi = [
      {
        type: "function",
        name: "func1",
        state_mutability: "external",
        inputs: [],
        outputs: [],
      },
    ];

    const result = getFunctionsByStateMutability(abi, "view");
    expect(result).toEqual([]);
  });

  it("should handle mixed ABI types", () => {
    const abi: Abi = [
      {
        type: "function",
        name: "func1",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
      {
        type: "function",
        name: "func2",
        state_mutability: "external",
        inputs: [],
        outputs: [],
      },
      {
        type: "function",
        name: "func3",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
    ];

    const result = getFunctionsByStateMutability(abi, "view");
    expect(result).toEqual([
      {
        type: "function",
        name: "func1",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
      {
        type: "function",
        name: "func3",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
    ]);
  });

  it("should handle empty or invalid ABI", () => {
    const emptyAbi: any[] = [];
    const invalidAbi: Abi = [
      {
        type: "function",
        name: "func1",
        state_mutability: "external",
        inputs: [],
        outputs: [],
      },
    ];

    expect(getFunctionsByStateMutability(emptyAbi, "view")).toEqual([]);
    expect(getFunctionsByStateMutability(invalidAbi, "view")).toEqual([]);
  });
});

describe("Contract Declarations", () => {
  it("should check if contract declarations are missing", () => {
    // Assuming contractsData is defined somewhere in the context
    expect(contracts).toBeDefined();
  });

  it("should have a valid contract structure", () => {
    expect(contracts).toBeDefined();
    if (contracts) {
      Object.keys(contracts!).forEach((network) => {
        expect(typeof network).toBe("string");
        const networkContracts = contracts![network];

        Object.keys(networkContracts).forEach((contractName) => {
          const contract = networkContracts[contractName];
          expect(contract).toHaveProperty("address");
          expect(contract).toHaveProperty("abi");
          expect(contract).toHaveProperty("classHash");
        });
      });
    }
  });

  it("should collect only function items from ABI", () => {
    const abi: Abi = [
      {
        type: "interface",
        name: "MyInterface",
        items: [
          {
            type: "function",
            name: "func1",
            state_mutability: "view",
            inputs: [],
            outputs: [],
          },
          {
            type: "function",
            name: "func2",
            state_mutability: "external",
            inputs: [],
            outputs: [],
          },
        ],
      },
    ];

    const result = getFunctionsByStateMutability(abi, "view");
    expect(result).toEqual([
      {
        type: "function",
        name: "func1",
        state_mutability: "view",
        inputs: [],
        outputs: [],
      },
    ]);
  });
});

describe("parseTuple", () => {
  it("should parse a simple tuple", () => {
    const input = "(1, 2, 3)";
    const result = parseTuple(input);
    expect(result).toEqual(["1", "2", "3"]);
  });

  it("should parse a nested tuple", () => {
    const input = "(1, (2, 3), 4)";
    const result = parseTuple(input);
    expect(result).toEqual(["1", "(2, 3)", "4"]);
  });

  it("should handle spaces around elements", () => {
    const input = "( 1 ,  2 ,  3 )";
    const result = parseTuple(input);
    expect(result).toEqual(["1", "2", "3"]);
  });
});
