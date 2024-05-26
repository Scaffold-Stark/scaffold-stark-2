export type CommonInputProps<T = string> = {
  value: T;
  onChange: (newValue: T) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
};

export const SIGNED_NUMBER_REGEX = /^-?\d*\.?\d*$/;
export const UNSIGNED_NUMBER_REGEX = /^\d*\.?\d*$/;

export const isValidInteger = (dataType: string, value: string | bigint) => {
  const isSigned = dataType.split("::").pop()!.startsWith("i");
  const bitcount = Number(dataType.substring(isSigned ? 3 : 4));

  if (
    typeof value === "string" &&
    !(isSigned
      ? SIGNED_NUMBER_REGEX.test(value)
      : UNSIGNED_NUMBER_REGEX.test(value))
  ) {
    return false;
  }

  let valueAsBigInt;
  try {
    const integerPart = value.toString().split(".")[0];
    valueAsBigInt = BigInt(integerPart);
  } catch (e) {
    return false;
  }

  if (!isSigned && valueAsBigInt < 0) {
    return false;
  }

  const hexString = valueAsBigInt.toString(16);
  const significantHexDigits = hexString.match(/.*x0*(.*)$/)?.[1] ?? "";
  if (significantHexDigits.length * 4 > bitcount) {
    return false;
  }

  if (
    isSigned &&
    significantHexDigits.length * 4 === bitcount &&
    parseInt(significantHexDigits.slice(-1)?.[0], 16) >= 8
  ) {
    return false;
  }

  return true;
};

// Treat any dot-separated string as a potential ENS name
const ensRegex = /.+\..+/;
export const isENS = (address = "") => ensRegex.test(address);
