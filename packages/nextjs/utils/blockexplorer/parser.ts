import { num, hash, encode } from "starknet";
import configExternalContracts from "~~/contracts/configExternalContracts";
import deployedContracts from "~~/contracts/deployedContracts";
import predeployedContracts from "~~/contracts/predeployedContracts";
import { deepMergeContracts } from "../scaffold-stark/contract";

export const convertCalldataToReadable = (
  calldata: string[],
): { to: string; selector: string; args: string[] }[] => {
  const calls: { to: string; selector: string; args: string[] }[] = [];
  let currentPointer = 1;
  while (currentPointer < calldata.length) {
    const to = calldata[currentPointer];
    const selector = calldata[currentPointer + 1];
    const argsLength = parseInt(calldata[currentPointer + 2], 16);
    const args = calldata.slice(
      currentPointer + 3,
      currentPointer + 3 + argsLength,
    );
    calls.push({ to, selector, args });
    currentPointer += 3 + argsLength;
  }
  return calls;
};

/**
 * Get merged contracts for ABI-based parsing
 */
export const getMergedContracts = (targetNetwork: any) => {
  try {
    const allMerged = deepMergeContracts(
      deepMergeContracts(deployedContracts, predeployedContracts),
      configExternalContracts,
    );
    const networkKey = targetNetwork.network as keyof typeof allMerged;
    const merged = allMerged[networkKey] || {};
    return merged;
  } catch (error) {
    console.warn("Error merging contracts:", error);
    return {};
  }
};

/**
 * Find function definition from ABI using selector
 */
export const findFunctionDefinition = (
  selector: string,
  mergedContracts: any,
  contractAddress?: string,
) => {
  try {
    for (const contractName in mergedContracts) {
      const contract = mergedContracts[contractName];

      // If we have a specific contract address, try to match it first
      if (
        contractAddress &&
        contract.address &&
        contract.address.toLowerCase() !== contractAddress.toLowerCase()
      ) {
        continue;
      }

      if (contract && contract.abi) {
        // Find interface entries in the ABI
        for (const abiEntry of contract.abi) {
          if (abiEntry.type === "interface" && abiEntry.items) {
            // Find function in interface items
            for (const item of abiEntry.items) {
              if (item.type === "function" && item.name) {
                const functionSelector = num.toHex(
                  hash.starknetKeccak(item.name),
                );
                if (functionSelector === selector) {
                  return {
                    functionDef: item,
                    contractName,
                    functionName: item.name,
                  };
                }
              }
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.warn("Error finding function definition:", error);
    return null;
  }
};

/**
 * Decode function arguments using ABI definition
 */
export const decodeFunctionArguments = (
  functionDefinition: any,
  args: string[],
) => {
  try {
    const decodedArgs: Record<string, any> = {};
    const argTypes: Record<string, string> = {};

    if (
      !functionDefinition.inputs ||
      !Array.isArray(functionDefinition.inputs)
    ) {
      return { decodedArgs, argTypes };
    }

    let dataIndex = 0;

    for (const input of functionDefinition.inputs) {
      const { name, type } = input;

      if (dataIndex >= args.length) break;

      argTypes[name] = type;

      try {
        // Handle different Cairo types
        if (type === "core::integer::u256") {
          // u256 takes two felt252 values (low, high)
          if (dataIndex + 1 < args.length) {
            const low = BigInt(args[dataIndex]);
            const high = BigInt(args[dataIndex + 1]);
            decodedArgs[name] = low + (high << 128n);
            dataIndex += 2;
          } else {
            decodedArgs[name] = BigInt(args[dataIndex]);
            dataIndex += 1;
          }
        } else if (type === "core::byte_array::ByteArray") {
          // ByteArray decoding - simplified version
          const numFullWords = parseInt(args[dataIndex], 16);
          const startIdx = dataIndex + 1;
          const endIdx = startIdx + numFullWords + 2; // +2 for pending_word and pending_word_len

          try {
            let decoded = "";
            // Decode full words
            for (let i = startIdx; i < startIdx + numFullWords; i++) {
              if (i < args.length) {
                const hex = args[i].slice(2); // Remove 0x
                decoded += Buffer.from(hex, "hex").toString("utf8");
              }
            }
            // Handle pending word if needed
            if (startIdx + numFullWords < args.length) {
              const pendingWord = args[startIdx + numFullWords];
              const pendingLen = parseInt(
                args[startIdx + numFullWords + 1],
                16,
              );
              if (pendingLen > 0) {
                const hex = pendingWord.slice(2).slice(0, pendingLen * 2);
                decoded += Buffer.from(hex, "hex").toString("utf8");
              }
            }
            decodedArgs[name] = decoded || args[dataIndex];
            dataIndex = Math.min(endIdx, args.length);
          } catch (error) {
            decodedArgs[name] = args[dataIndex];
            dataIndex += 1;
          }
        } else if (
          type === "core::starknet::contract_address::ContractAddress"
        ) {
          decodedArgs[name] = args[dataIndex];
          dataIndex += 1;
        } else if (type === "core::bool") {
          decodedArgs[name] =
            args[dataIndex] === "0x1" || args[dataIndex] === "1";
          dataIndex += 1;
        } else {
          // Default: treat as felt252 or similar
          const value = args[dataIndex];
          if (value.startsWith("0x")) {
            const bigIntValue = BigInt(value);
            // If it's a reasonable number, convert to BigInt, otherwise keep as string
            if (bigIntValue < 2n ** 64n) {
              decodedArgs[name] = bigIntValue;
            } else {
              decodedArgs[name] = value;
            }
          } else {
            decodedArgs[name] = value;
          }
          dataIndex += 1;
        }
      } catch (error) {
        // Fallback: store raw value
        decodedArgs[name] = args[dataIndex];
        dataIndex += 1;
      }
    }

    return { decodedArgs, argTypes };
  } catch (error) {
    console.warn("Error decoding function arguments:", error);
    return { decodedArgs: {}, argTypes: {} };
  }
};

export const checkSanitizedEquals = (a: string, b: string) => {
  return (
    encode.sanitizeHex(a || "").toLowerCase() ===
    encode.sanitizeHex(b || "").toLowerCase()
  );
};
