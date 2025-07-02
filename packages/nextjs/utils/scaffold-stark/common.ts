// To be used in JSON.stringify when a field might be bigint
// https://wagmi.sh/react/faq#bigint-serialization
import { Address } from "@starknet-react/chains";
import { getChecksumAddress } from "starknet";

export const replacer = (_key: string, value: unknown) => {
  if (typeof value === "bigint") return value.toString();
  return value;
};

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export function isAddress(address: string): address is Address {
  return addressRegex.test(address);
}

export function feltToHex(feltBigInt: bigint) {
  return `0x${feltBigInt.toString(16)}`;
}

export function isJsonString(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function isValidContractArgs(
  args: unknown,
  expectedLength: number,
): boolean {
  return (
    Array.isArray(args) &&
    args.length === expectedLength &&
    args.every((arg) => arg !== undefined && arg !== null && arg !== "")
  );
}
