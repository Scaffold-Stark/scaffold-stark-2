import {
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from "abi-wan-kanabi/dist/kanabi";
import { AbiEntry, AbiEnums, AbiStructs, parseCalldataField } from "starknet";
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

export const composeEventFilterKeys = (
  input: { [key: string]: any },
  event: ExtractAbiEvent<
    ContractAbi<ContractName>,
    ExtractAbiEventNames<ContractAbi<ContractName>>
  >,
  structs: AbiStructs,
  enums: AbiEnums,
): string[] => {
  if (!("members" in event)) {
    return [];
  }
  let keys: string[] = [];
  for (const member of event.members) {
    if (member.kind === "key" && member.name in input) {
      keys = keys.concat(
        serializeEventKey(input[member.name], member, structs, enums),
      );
    }
  }
  return keys;
};
