// To be used in JSON.stringify when a field might be bigint
// https://wagmi.sh/react/faq#bigint-serialization
import { Address } from "@starknet-react/chains";
import { validateAndParseAddress } from "starknet";

export const replacer = (_key: string, value: unknown) => {
  if (
    value != undefined &&
    (typeof value !== "object" || typeof value === null) &&
    value.toString().length >= 76
  ) {
    return validateAndParseAddress(value.toString());
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
