// To be used in JSON.stringify when a field might be bigint
// https://wagmi.sh/react/faq#bigint-serialization
import { Address } from "@starknet-react/chains";
import { getChecksumAddress, validateAndParseAddress } from "starknet";

export const replacer = (_key: string, value: unknown) => {
  if (
    value != undefined &&
    (typeof value !== "object" || typeof value === null) &&
    value.toString().length >= 76
  ) {
    return getChecksumAddress(`0x${BigInt(value.toString()).toString(16)}`);
  } else if (typeof value === "bigint") {
    return value.toString();
  }
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
