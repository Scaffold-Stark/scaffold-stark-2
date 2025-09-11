import {
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/dist/kanabi";
import {
  Abi,
  AbiEntry,
  AbiEnums,
  AbiStructs,
  CallData,
  parseCalldataField,
  createAbiParser,
} from "starknet";
import { ContractAbi, ContractName } from "./contract";
import { feltToHex } from "./common";

const stringToByteArrayFelt = (str: string): string[] => {
  const bytes = new TextEncoder().encode(str);
  const result = [];
  const numFullWords = Math.floor(bytes.length / 31);
  result.push(numFullWords.toString());

  for (let i = 0; i < numFullWords; i++) {
    const chunk = bytes.slice(i * 31, (i + 1) * 31);
    const felt = "0x" + Buffer.from(chunk).toString("hex");
    result.push(felt);
  }

  const remainingBytes = bytes.slice(numFullWords * 31);
  if (remainingBytes.length > 0) {
    const pendingWord = "0x" + Buffer.from(remainingBytes).toString("hex");
    result.push(pendingWord);
  } else {
    result.push("0x0");
  }

  result.push(remainingBytes.length.toString());
  return result;
};

export const serializeEventKey = (
  input: any,
  abiEntry: AbiEntry,
  structs: AbiStructs,
  enums: AbiEnums,
  abi: Abi,
): string[] => {
  if (abiEntry.type === "core::byte_array::ByteArray") {
    return stringToByteArrayFelt(input).map((item) => feltToHex(BigInt(item)));
  }
  const args = [input][Symbol.iterator]();
  const parsed = parseCalldataField({
    argsIterator: args,
    input: abiEntry,
    structs,
    enums,
    parser: createAbiParser(abi),
  });
  if (typeof parsed === "string") {
    return [feltToHex(BigInt(parsed))];
  }
  return parsed.map((item: string) => feltToHex(BigInt(item)));
};

const is2DArray = (arr: any) => {
  return Array.isArray(arr) && arr.every((item) => Array.isArray(item));
};

const isUniformLength = (arr: any[][]) => {
  if (!Array.isArray(arr) || arr.length === 0) return false;

  const firstLength = arr[0].length;
  return arr.every((subArray) => subArray.length === firstLength);
};

const mergeArrays = (arrays: any[][]) => {
  return arrays[0].map((_, index) => arrays.map((array) => array[index][0]));
};

const certainLengthTypeMap: { [key: string]: string[][] } = {
  "core::starknet::contract_address::ContractAddress": [[]],
  "core::starknet::eth_address::EthAddress": [[]], // Kept for backward compatibility
  "core::starknet::class_hash::ClassHash": [[]],
  "core::starknet::storage_access::StorageAddress": [[]],
  "core::bool": [[]],
  "core::integer::u8": [[]],
  "core::integer::u16": [[]],
  "core::integer::u32": [[]],
  "core::integer::u64": [[]],
  "core::integer::u128": [[]],
  "core::integer::u256": [[], []],
  "core::integer::u512": [[], [], [], []],
  "core::bytes_31::bytes31": [[]],
  "core::felt252": [[]],
};

export const composeEventFilterKeys = (
  input: { [key: string]: any },
  event: ExtractAbiEvent<
    ContractAbi<ContractName>,
    ExtractAbiEventNames<ContractAbi<ContractName>>
  >,
  abi: Abi,
): string[][] => {
  if (!("members" in event)) {
    return [];
  }
  const enums = CallData.getAbiEnum(abi);
  const structs = CallData.getAbiStruct(abi);
  const members = event.members as unknown as {
    name: string;
    type: string;
    kind: "key" | "data";
    value: any;
  }[];
  let keys: string[][] = [];
  const keyMembers = members.filter((member) => member.kind === "key");
  const clonedKeyMembers = JSON.parse(JSON.stringify(keyMembers));
  for (const member of clonedKeyMembers) {
    if (member.name in input) {
      member.value = input[member.name];
    }
  }
  for (const member of clonedKeyMembers) {
    if (member.value !== undefined) {
      if (
        !member.type.startsWith("core::array::Array::") &&
        Array.isArray(member.value)
      ) {
        keys = keys.concat(
          mergeArrays(
            member.value.map((matchingItem: any) =>
              serializeEventKey(matchingItem, member, structs, enums, abi).map(
                (item) => [item],
              ),
            ),
          ),
        );
      } else if (
        member.type.startsWith("core::array::Array::") &&
        is2DArray(member.value)
      ) {
        if (!isUniformLength(member.value)) {
          break;
        }
        keys = keys.concat(
          mergeArrays(
            member.value.map((matchingItem: any) =>
              serializeEventKey(matchingItem, member, structs, enums, abi).map(
                (item) => [item],
              ),
            ),
          ),
        );
      } else {
        const serializedKeys = serializeEventKey(
          member.value,
          member,
          structs,
          enums,
          abi,
        ).map((item) => [item]);
        keys = keys.concat(serializedKeys);
      }
    } else {
      if (member.type in certainLengthTypeMap) {
        keys = keys.concat(certainLengthTypeMap[member.type]);
      } else {
        break;
      }
    }
  }
  return keys;
};
