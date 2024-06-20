// To be used in JSON.stringify when a field might be bigint
// https://wagmi.sh/react/faq#bigint-serialization
import { Address } from "@starknet-react/chains";

export const replacer = (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value;

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export function isAddress(address: string): address is Address {
  return addressRegex.test(address);
}

export function feltToHex(feltBigInt: bigint) {
  return `0x${feltBigInt.toString(16)}`;
}

export function parseBitcoinPriceToNumber(price: string) {
  return Math.floor(Number(price) / 100000000);
}

// Convert u64 timestamp to a human readable date
export function formatDate(timestamp: string): string {
  const timestampNumber = Number(timestamp) * 1000;

  const date = new Date(timestampNumber);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = monthNames[date.getUTCMonth()];
  const day = date.getUTCDate();

  return `${month} ${day}`;
}
