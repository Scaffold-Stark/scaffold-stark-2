import { hash } from "starknet";
import deployedContracts from "~~/contracts/deployedContracts";
import preDeployedContracts from "~~/contracts/predeployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { deepMergeContracts } from "./contract";
import configExternalContracts from "~~/contracts/configExternalContracts";

/**
 * Interface for ABI function items
 */
interface AbiFunction {
  type: string;
  name: string;
  inputs?: any[];
  outputs?: any[];
  state_mutability?: string;
}

/**
 * Interface for ABI interface items
 */
interface AbiInterface {
  type: string;
  name: string;
  items?: AbiFunction[];
}

/**
 * Cache for selector to function name mappings to avoid recomputation
 */
const selectorCache = new Map<string, string>();

const mergedPredeployedContracts = deepMergeContracts(
  preDeployedContracts,
  configExternalContracts,
);

const contractAbis = deepMergeContracts(
  deployedContracts,
  mergedPredeployedContracts,
);

/**
 * Get all function names from deployed contracts ABI
 * @param targetNetworkName - The target network name (e.g., 'devnet', 'sepolia')
 * @returns Array of function names from all deployed contracts
 */
export function getAllFunctionNamesFromABI(
  targetNetworkName: string,
): string[] {
  const functionNames: string[] = [];

  const networkContracts = (contractAbis as any)[targetNetworkName];
  if (!networkContracts) {
    return functionNames;
  }

  // Iterate through all contracts in the network
  Object.values(networkContracts).forEach((contract: any) => {
    if (contract?.abi) {
      // Find interface entries in the ABI
      contract.abi.forEach((abiEntry: AbiInterface) => {
        if (abiEntry.type === "interface" && abiEntry.items) {
          // Extract function names from interface items
          abiEntry.items.forEach((item: AbiFunction) => {
            if (item.type === "function" && item.name) {
              functionNames.push(item.name);
            }
          });
        }
      });
    }
  });

  // Remove duplicates
  return [...new Set(functionNames)];
}

/**
 * Get function name from selector by matching with deployed contracts ABI
 * @param selector - The function selector (hex string)
 * @param targetNetworkName - The target network name (e.g., 'devnet', 'sepolia')
 * @returns Function name if found, otherwise the selector with fallback message
 */
export function getFunctionNameFromSelector(
  selector: string,
  targetNetworkName: string,
): string {
  // Check cache first
  const cacheKey = `${selector}_${targetNetworkName}`;
  if (selectorCache.has(cacheKey)) {
    return selectorCache.get(cacheKey)!;
  }

  // Normalize selector (ensure it starts with 0x)
  const normalizedSelector = selector.startsWith("0x")
    ? selector
    : `0x${selector}`;

  try {
    // Get all function names from deployed contracts
    const functionNames = getAllFunctionNamesFromABI(targetNetworkName);

    // Try to find a match by computing starknetKeccak for each function name
    for (const functionName of functionNames) {
      try {
        const computedSelector = `0x${hash.starknetKeccak(functionName).toString(16)}`;

        if (
          computedSelector.toLowerCase() === normalizedSelector.toLowerCase()
        ) {
          selectorCache.set(cacheKey, functionName);
          return functionName;
        }
      } catch (error) {
        // Continue to next function name if hash computation fails
        console.warn(
          `Failed to compute hash for function ${functionName}:`,
          error,
        );
      }
    }

    // Fallback: return selector with descriptive text
    const fallback = `Unknown Function (${normalizedSelector})`;
    selectorCache.set(cacheKey, fallback);
    return fallback;
  } catch (error) {
    console.error("Error resolving function name from selector:", error);
    const fallback = `Error Resolving (${normalizedSelector})`;
    selectorCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Hook to get function name from selector for the current target network
 * @param selector - The function selector (hex string)
 * @returns Function name if found, otherwise the selector with fallback message
 */
export function useFunctionNameFromSelector(selector: string): string {
  const { targetNetwork } = useTargetNetwork();
  return getFunctionNameFromSelector(selector, targetNetwork.network);
}

/**
 * Clear the selector cache (useful for testing or when contracts are updated)
 */
export function clearSelectorCache(): void {
  selectorCache.clear();
}
