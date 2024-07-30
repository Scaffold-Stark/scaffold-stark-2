import type {
  CairoBigInt,
  CairoBool,
  CairoByteArray,
  CairoBytes31,
  CairoClassHash,
  CairoContractAddress,
  CairoEthAddress,
  CairoFelt,
  CairoFunction,
  CairoInt,
  CairoSecp256k1Point,
  CairoTuple,
  CairoU256,
  CairoVoid,
} from "abi-wan-kanabi/dist/kanabi";
import { AbiEnum, AbiStruct } from "./contract";

export const isCairoInt = (type: string): type is CairoInt =>
  /^core::integer::(u|i)(8|16|32)$/.test(type);

export const isCairoBigInt = (type: string): type is CairoBigInt =>
  /^core::integer::(u|i)(64|128)$/.test(type);

export const isCairoU256 = (type: string): type is CairoU256 =>
  type.includes("core::integer::u256");

export const isCairoContractAddress = (
  type: string,
): type is CairoContractAddress =>
  type.includes("core::starknet::contract_address::ContractAddress");

export const isCairoEthAddress = (type: string): type is CairoEthAddress =>
  type.includes("core::starknet::eth_address::EthAddress");

export const isCairoClassHash = (type: string): type is CairoClassHash =>
  type.includes("core::starknet::class_hash::ClassHash");

export const isCairoFunction = (type: string): type is CairoFunction =>
  type.includes("function");

export const isCairoVoid = (type: string): type is CairoVoid =>
  type.includes("()");

export const isCairoBool = (type: string): type is CairoBool =>
  type.includes("core::bool");

export const isCairoBytes31 = (type: string): type is CairoBytes31 =>
  type.includes("core::bytes_31::bytes31");

export const isCairoByteArray = (type: string): type is CairoByteArray =>
  type.includes("core::byte_array::ByteArray");

export const isCairoSecp256k1Point = (
  type: string,
): type is CairoSecp256k1Point =>
  type.includes("core::starknet::secp256k1::Secp256k1Point");

export const isCairoFelt = (type: string): type is CairoFelt =>
  type.includes("core::felt252");

export const isCairoTuple = (type: string): type is CairoTuple =>
  /\(([^)]+)\)/i.test(type);

export const isCairoType = (type: string): boolean => {
  return (
    isCairoInt(type) ||
    isCairoBigInt(type) ||
    isCairoU256(type) ||
    isCairoContractAddress(type) ||
    isCairoEthAddress(type) ||
    isCairoClassHash(type) ||
    isCairoFunction(type) ||
    isCairoVoid(type) ||
    isCairoBool(type) ||
    isCairoBytes31(type) ||
    isCairoByteArray(type) ||
    isCairoSecp256k1Point(type) ||
    isCairoFelt(type) ||
    isCairoTuple(type)
  );
};

export function isStructOrEnum(member: any): member is AbiStruct | AbiEnum {
  return member.type === "struct" || member.type === "enum";
}

export const isCairoArray = (type: string): boolean =>
  type.includes("core::array");

export const isCairoOption = (type: string): boolean =>
  type.includes("core::option");

export const isCairoResult = (type: string): boolean =>
  type.includes("core::result");

export function parseGenericType(typeString: string): string[] | string {
  const match = typeString.match(/<([^>]*(?:<(?:[^<>]*|<[^>]*>)*>[^>]*)*)>/);
  if (!match) return typeString;

  const content = match[1];
  if (content.startsWith("(") && content.endsWith(")")) {
    return content; // Return the tuple as a single string
  }

  const types = content.split(/,(?![^\(\)]*\))/);
  return types.map((type) => type.trim());
}
