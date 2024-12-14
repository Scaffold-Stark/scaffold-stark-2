import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deepMergeContracts, getFunctionsByStateMutability, contracts, parseParamWithType, } from '../scaffold-stark/contract'; // Adjust import based on your structure

vi.mock('../contract', () => {
    return {
        ...vi.importActual('../scaffold-stark/contract'),
        encodeParamsWithType: vi.fn(),
        decodeParamsWithType: vi.fn(),
    };
});


describe('deepMergeContracts', () => {
    it('should merge two contract objects correctly', () => {
        const local = { contractA: { value: 1 } };
        const external = { contractA: { value: 2 }, contractB: { value: 3 } };
        const result = deepMergeContracts(local, external);
        expect(result).toEqual({
            contractA: { value: 2 },
            contractB: { value: 3 }
        });
    });

    it('should handle nested objects correctly', () => {
        const local = { contractA: { settings: { enabled: true } } };
        const external = { contractA: { settings: { enabled: false, version: '1.0' } } };
        const result = deepMergeContracts(local, external);
        expect(result).toEqual({
            contractA: {
                settings: { enabled: false, version: '1.0' }
            }
        });
    });

    it('should return local object if external is empty', () => {
        const local = { contractA: { value: 1 } };
        const external = {};
        const result = deepMergeContracts(local, external);
        expect(result).toEqual(local);
    });

    it('should return external object when local is empty', () => {
        const local = {};
        const external = { contractA: { value: 5 } };
        const result = deepMergeContracts(local, external);
        expect(result).toEqual(external);
    });
});

describe('getFunctionsByStateMutability', () => {
  it('should return only functions with the specified state mutability', () => {
      const abi = [
          { type: "function", name: "func1", state_mutability: "view" },
          { type: "function", name: "func2", state_mutability: "external" },
          { type: "function", name: "func3", state_mutability: "view" }
      ];
      
      const result = getFunctionsByStateMutability(abi, "view");
      expect(result).toEqual([
          { type: "function", name: "func1", state_mutability: "view" },
          { type: "function", name: "func3", state_mutability: "view" }
      ]);
  });

  it('should return an empty array if no functions match the state mutability', () => {
      const abi = [
          { type: "function", name: "func1", state_mutability: "external" }
      ];
      
      const result = getFunctionsByStateMutability(abi, "view");
      expect(result).toEqual([]);
  });
});

describe('Contract Declarations', () => {
  it('should check if contract declarations are missing', () => {
      // Assuming contractsData is defined somewhere in the context
      expect(contracts).toBeDefined();
      
  });
});