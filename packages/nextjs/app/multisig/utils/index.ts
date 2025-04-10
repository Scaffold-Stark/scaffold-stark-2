import { hash, number } from "starknet";

// Get the function selector from the function name
export function getFunctionSelector(functionName: string) {
  const selectorHex = hash.getSelectorFromName(functionName);
  const selectorFelt = number.hexToDecimalString(selectorHex);
  return selectorFelt;
}

// Predefined function selectors
export const ADD_SIGNER_SELECTOR = getFunctionSelector("add_signer");
export const REMOVE_SIGNER_SELECTOR = getFunctionSelector("remove_signer");
export const TRANSFER_FUNDS_SELECTOR = getFunctionSelector("transfer_funds");

/**
 * Converts a felt representation to a hex address
 * @param felt The felt string to convert
 * @returns The converted address as a hex string
 */
export const convertFeltToAddress = (felt: string) => {
  if (!felt) return "";

  let hexString;
  if (felt.startsWith("0x")) {
    hexString = felt;
  } else {
    try {
      hexString = "0x" + BigInt(felt).toString(16);
    } catch (e) {
      console.error("Error converting felt to address:", e);
      return felt;
    }
  }

  return hexString;
};

/**
 * Maps a selector to a function name
 * @param text The selector to convert
 * @returns The function name or null if not found
 */
export const convertSelectorToFuncName = (text: string) => {
  switch (text) {
    case ADD_SIGNER_SELECTOR:
      return "add_signer";
    case REMOVE_SIGNER_SELECTOR:
      return "remove_signer";
    case TRANSFER_FUNDS_SELECTOR:
      return "transfer_funds";
    default:
      return null;
  }
};

/**
 * Formats an address for display by shortening it
 * @param address The address to format
 * @returns Shortened address format (e.g., 0x1234...5678)
 */
export const formatAddress = (address: string) => {
  if (!address || address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Formats a token amount with proper decimal places
 * @param amount The amount as a string
 * @param decimals The number of decimals the token has
 * @param displayDecimals The number of decimals to display
 * @returns Formatted token amount
 */
export const formatTokenAmount = (
  amount: string,
  decimals = 18,
  displayDecimals = 4,
) => {
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  const result = `${integerPart}${
    displayDecimals > 0 ? "." + fractionalStr.substring(0, displayDecimals) : ""
  }`;

  return result.replace(/\.?0+$/, "");
};

/**
 * Converts a decimal amount to wei (multiply by 10^18)
 * @param amount The amount as a string
 * @returns The amount in wei as a string
 */
export const convertToWei = (amount: string): string => {
  if (!amount || amount === "0" || amount === ".") return "0";

  const parts = amount.split(".");

  if (parts.length === 1) {
    return parts[0] + "0".repeat(18);
  }

  let whole = parts[0] || "0";
  let fraction = parts[1] || "";

  // Pad or truncate fraction to 18 decimals
  fraction = fraction.padEnd(18, "0").slice(0, 18);

  return (whole + fraction).replace(/^0+(\d)/, "$1");
};
