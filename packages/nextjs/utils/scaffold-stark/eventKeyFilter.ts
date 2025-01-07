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
} from "starknet";
import { ContractAbi, ContractName } from "./contract";

const stringToHexString = (numStr: string) => {
  const bigIntValue = BigInt(numStr);
  const hexString = bigIntValue.toString(16);
  return `0x${hexString}`;
};

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
): string[] => {
  if (abiEntry.type === "core::byte_array::ByteArray") {
    return stringToByteArrayFelt(input).map((item) => stringToHexString(item));
  }
  const args = [input][Symbol.iterator]();
  const parsed = parseCalldataField(args, abiEntry, structs, enums);
  if (typeof parsed === "string") {
    return [stringToHexString(parsed)];
  }
  return parsed.map((item: string) => stringToHexString(item));
};

const certainLengthTypeMap: { [key: string]: string[][] } = {
  "core::starknet::contract_address::ContractAddress": [[]],
  "core::starknet::eth_address::EthAddress": [[]],
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
  let keys: string[][] = [];
  const keyMembers = event.members.filter(
    (member) => member.kind === "key",
  ) as { name: string; type: string; kind: "key" | "data"; value: any }[];
  const clonedKeyMembers = JSON.parse(JSON.stringify(keyMembers));
  for (const member of clonedKeyMembers) {
    if (member.name in input) {
      member.value = input[member.name];
    }
  }
  for (const member of clonedKeyMembers) {
    if (member.value !== undefined) {
      keys = keys.concat(
        serializeEventKey(member.value, member, structs, enums).map((item) => [
          item,
        ]),
      );
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
