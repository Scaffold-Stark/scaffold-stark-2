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

export function parseTokenPriceToNumber(price: string) {
  return Math.floor(Number(price) / 100000000);
}

export function parseStarkPriceToNumber(price: string) {
  return Number(price) / 100000000;
}

// Convert u64 timestamp to a human readable date
export function formatDate(timestamp: string): string {
  const timestampNumber = Number(timestamp);

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

export function isDatePassed(dateU64: bigint): boolean {
  const dateInMillis = Number(dateU64);
  const date = new Date(dateInMillis);
  const now = new Date();

  return date < now;
}

export function calculatePercentage(amount: bigint, total: bigint): number {
  if (total === 0n) {
    return 0;
  }

  const percentage = (Number(amount) / Number(total)) * 100;
  return percentage;
}

export function isJsonString(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
