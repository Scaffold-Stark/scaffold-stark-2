export type CommonInputProps<T = string> = {
  value: T;
  onChange: (newValue: T) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
};

export const SIGNED_NUMBER_REGEX = /^-?\d+\.?\d*$/;
export const UNSIGNED_NUMBER_REGEX = /^\.?\d+\.?\d*$/;

export const isValidInteger = (
  dataType: string,
  value: bigint | string,
  strict = true,
) => {
  const isSigned = dataType.split("::").pop()!.startsWith("i");
  const bitcount = Number(dataType.substring(isSigned ? 3 : 4));

  let valueAsBigInt;
  try {
    valueAsBigInt = BigInt(value);
  } catch (e) {}
  if (typeof valueAsBigInt !== "bigint") {
    if (strict) {
      return false;
    }
    if (!value || typeof value !== "string") {
      return true;
    }
    return isSigned
      ? SIGNED_NUMBER_REGEX.test(value) || value === "-"
      : UNSIGNED_NUMBER_REGEX.test(value);
  } else if (!isSigned && valueAsBigInt < 0) {
    return false;
  }
  const hexString = valueAsBigInt.toString(16);
  const significantHexDigits = hexString.match(/.*x0*(.*)$/)?.[1] ?? "";
  return !(
    significantHexDigits.length * 4 > bitcount ||
    (isSigned &&
      significantHexDigits.length * 4 === bitcount &&
      parseInt(significantHexDigits.slice(-1)?.[0], 16) < 8)
  );
};

// Treat any dot-separated string as a potential ENS name
const ensRegex = /.+\..+/;
export const isENS = (address = "") => ensRegex.test(address);
