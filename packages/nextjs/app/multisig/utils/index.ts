import { hash, number } from "starknet";

export function getFunctionSelector(functionName: string) {
  const selectorHex = hash.getSelectorFromName(functionName);

  const selectorFelt = number.hexToDecimalString(selectorHex);

  return selectorFelt;
}

export const ADD_SIGNER_SELECTOR = getFunctionSelector("add_signer");
export const REMOVE_SIGNER_SELECTOR = getFunctionSelector("remove_signer");
export const TRANSFER_FUNDS_SELECTOR = getFunctionSelector("transfer_funds");

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

export const formatAddress = (address: string) => {
  if (!address || address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

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
