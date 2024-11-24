import { getChecksumAddress, Uint256 } from "starknet";
import { replacer } from "~~/utils/scaffold-stark/common";
import { AbiOutput } from "~~/utils/scaffold-stark/contract";
import {
  isCairoArray,
  isCairoOption,
  isCairoResult,
  parseGenericType,
} from "~~/utils/scaffold-stark/types";
import { formatEther } from "ethers";
import { Abi } from "abi-wan-kanabi";

type DisplayContent = Uint256 | string | bigint | boolean | Object | unknown;

// each error will have its own key
export type FormErrorMessageState = Record<string, string>;

export function addError(
  state: FormErrorMessageState,
  key: string,
  message: string,
): FormErrorMessageState {
  return {
    ...state,
    [key]: message,
  };
}

export function clearError(
  state: FormErrorMessageState,
  key: string,
): FormErrorMessageState {
  delete state[key];
  return state;
}

export function isError(state: FormErrorMessageState): boolean {
  return Object.values(state).filter((value) => !!value).length > 0;
}

export function getTopErrorMessage(state: FormErrorMessageState): string {
  if (!isError(state)) return "";
  return Object.values(state).filter((value) => !!value)[0];
}

const baseNumberType = new Set([
  "core::integer::u512",
  "core::integer::u256",
  "core::integer::u128",
  "core::integer::u64",
  "core::integer::u32",
  "core::integer::u16",
  "core::integer::u8",
  "core::integer::i256",
  "core::integer::i128",
  "core::integer::i64",
  "core::integer::i32",
  "core::integer::i16",
  "core::integer::i8",
]);
const baseHexType = new Set(["core::felt252"]);
const baseType = new Set([
  "core::starknet::contract_address::ContractAddress",
  "core::starknet::eth_address::EthAddress",
  "core::starknet::class_hash::ClassHash",
  "core::felt252",
  "core::integer::u512",
  "core::integer::u256",
  "core::integer::u128",
  "core::integer::u64",
  "core::integer::u32",
  "core::integer::u16",
  "core::integer::u8",
  "core::integer::i256",
  "core::integer::i128",
  "core::integer::i64",
  "core::integer::i32",
  "core::integer::i16",
  "core::integer::i8",
  "core::bool",
  "core::bytes_31::bytes31",
  "core::byte_array::ByteArray",
]);

const hexToAscii = (hexString: string): string => {
  if (!hexString) {
    return "";
  }
  if (hexString.length <= 2 || hexString.length % 2 !== 0) {
    return "";
  }
  if (hexString.startsWith("0x")) {
    hexString = hexString.slice(2);
  }
  let asciiString = "";
  for (let i = 0; i < hexString.length; i += 2) {
    const hexCode = hexString.slice(i, i + 2);
    const charCode = parseInt(hexCode, 16);
    asciiString += String.fromCharCode(charCode);
  }
  return asciiString;
};

const getFieldType = (type: string, abi: Abi): any => {
  if (
    type.startsWith("core::array::Array") ||
    /^\([^()]*\)$/.test(type) ||
    baseType.has(type)
  ) {
    return { type };
  }
  return abi.find((item) => item.name === type);
};

const _decodeContractResponseItem = (
  respItem: any,
  abiType: any,
  abi: Abi,
  showAsString?: boolean,
): any => {
  if (respItem === undefined) {
    return "";
  }
  if (abiType.type && baseNumberType.has(abiType.type)) {
    if (typeof respItem === "bigint") {
      if (
        respItem <= BigInt(Number.MAX_SAFE_INTEGER) &&
        respItem >= BigInt(Number.MIN_SAFE_INTEGER)
      ) {
        return Number(respItem);
      } else {
        return "Ξ " + formatEther(respItem);
      }
    }
    return Number(respItem);
  }

  if (
    abiType.type &&
    abiType.type === "core::starknet::contract_address::ContractAddress"
  ) {
    return getChecksumAddress(`0x${respItem.toString(16)}`);
  }

  if (abiType.type && baseHexType.has(abiType.type)) {
    const hexString = `0x${respItem.toString(16)}`;
    if (showAsString) {
      return hexToAscii(hexString) || hexString;
    }
    return hexString;
  }

  if (abiType.type && abiType.type === "core::bool") {
    return respItem;
  }

  if (abiType.type && abiType.type === "core::byte_array::ByteArray") {
    if (showAsString) {
      return hexToAscii(respItem) || respItem;
    }
    return respItem;
  }

  // tuple
  if (abiType.type && /^\([^()]*\)$/.test(abiType.type)) {
    const tupleTypes: any[] = abiType.type
      .match(/\(([^)]+)\)/)[1]
      .split(/\s*,\s*/);
    if (tupleTypes.length !== Object.keys(respItem).length) {
      return "";
    }
    const decodedArr = tupleTypes.map((type, index) => {
      return _decodeContractResponseItem(
        respItem[index],
        getFieldType(type, abi),
        abi,
      );
    });
    return `(${decodedArr})`;
  }

  // array
  if (abiType.type && abiType.type.startsWith("core::array::Array")) {
    const match = abiType.type.match(/<([^>]+)>/);
    const arrItemType = match ? match[1] : null;
    if (!arrItemType || !Array.isArray(respItem)) {
      return [];
    }
    return respItem.map((arrItem) =>
      _decodeContractResponseItem(arrItem, getFieldType(arrItemType, abi), abi),
    );
  }

  // struct
  if (abiType.type === "struct") {
    const members = abiType.members;
    const decoded: Record<string, any> = {};
    for (const [structKey, structValue] of Object.entries(respItem)) {
      const structItemDef = (members || []).find(
        (item: any) => item.name === structKey,
      );
      if (structItemDef && structItemDef.type) {
        decoded[structKey] = _decodeContractResponseItem(
          structValue,
          structItemDef,
          abi,
        );
      }
    }
    return decoded;
  }

  // option and result are enums but we don't want to process them as enums
  // possibly facing name or type that are defined as members of struct or standalone typing
  // we need the fallback so that it does not crash
  if (
    isCairoOption(abiType.name || "") ||
    isCairoOption(abiType.type || "") ||
    isCairoResult(abiType.name || "") ||
    isCairoResult(abiType.type || "")
  ) {
    return respItem;
  }

  if (abiType.type === "enum") {
    const variant = (respItem as any).variant;
    const variants = abiType.variants;
    for (const [enumKey, enumValue] of Object.entries(variant)) {
      if (enumValue === undefined) {
        continue;
      }
      const enumItemDef = (variants || []).find(
        (item: any) => item.name === enumKey,
      );
      if (enumItemDef && enumItemDef.type) {
        return {
          [enumKey]: _decodeContractResponseItem(enumValue, enumItemDef, abi),
        };
      }
    }
  }
  return respItem;
};

export const decodeContractResponse = ({
  resp,
  abi,
  functionOutputs,
  asText,
  showAsString,
}: {
  resp: DisplayContent | DisplayContent[];
  abi: Abi;
  functionOutputs?: readonly AbiOutput[];
  asText?: boolean;
  showAsString?: boolean;
}) => {
  const abiTypes = (functionOutputs || [])
    .map((output) => output.type)
    .map((type) => getFieldType(type, abi));
  let arrResp = [resp];
  if (!abiTypes.length || arrResp.length !== abiTypes.length) {
    return JSON.stringify(resp, replacer, 2);
  }
  const decoded: any[] = [];
  for (let index = 0; index < arrResp.length; index++) {
    decoded.push(
      _decodeContractResponseItem(
        arrResp[index],
        abiTypes[index],
        abi,
        showAsString,
      ),
    );
  }

  const decodedResult = decoded.length === 1 ? decoded[0] : decoded;
  if (asText) {
    return typeof decodedResult === "string"
      ? decodedResult
      : JSON.stringify(decodedResult, replacer);
  }
  return decodedResult;
};

export const displayTuple = (tupleString: string): string => {
  return tupleString.replace(/\w+::/g, "");
};

export const displayType = (type: string) => {
  // render tuples
  if (type.at(0) === "(") {
    return displayTuple(type);
  }

  // arrays and options
  else if (isCairoResult(type) || isCairoArray(type) || isCairoOption(type)) {
    const kindOfArray = type.split("::").at(2);
    const parsed = parseGenericType(type);

    // special handling for result since we need to pop both types
    if (isCairoResult(type)) {
      const type1 = parsed[0].split("::").pop();
      const type2 = parsed[1].split("::").pop();
      return `Result<${type1}, ${type2}>`;
    }

    // others
    const arrayType = Array.isArray(parsed)
      ? parsed[0].split("::").pop()
      : `(${parsed
          .split(",")
          .map((t) => t.split("::").pop())
          .join(",")}`;
    return `${kindOfArray}<${arrayType}>`;
  }

  // result enum
  else if (type.includes("core::result")) {
    const types = type.split("::");
    return `${types.at(-4)}<${types.at(-2)?.split(",").at(0)},${types.at(-1)}`;
  } else if (type.includes("::")) {
    return type.split("::").pop();
  }
  return type;
};
