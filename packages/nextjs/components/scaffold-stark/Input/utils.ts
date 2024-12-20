export type CommonInputProps<T = string> = {
  value: T;
  onChange: (newValue: T) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
};

export const SIGNED_NUMBER_REGEX = /^-?\d*\.?\d*$/;
export const UNSIGNED_NUMBER_REGEX = /^\d*\.?\d*$/;

export const isValidInteger = (
  dataType: string,
  value: string | bigint,
): boolean => {
  const isSigned = isSignedType(dataType);
  const bitcount = extractBitCount(dataType, isSigned);

  if (!isValidFormat(value, isSigned)) return false;

  const valueAsBigInt = parseBigInt(value);
  if (valueAsBigInt === null) return false;

  if (isInvalidUnsignedValue(valueAsBigInt, isSigned)) return false;

  return fitsWithinBitCount(valueAsBigInt, bitcount, isSigned);
};

// Helper functions:

const isSignedType = (dataType: string): boolean => {
  return dataType.split("::").pop()!.startsWith("i");
};

const extractBitCount = (dataType: string, isSigned: boolean): number => {
  return Number(dataType.substring(isSigned ? 3 : 4));
};

const isValidFormat = (value: string | bigint, isSigned: boolean): boolean => {
  if (typeof value !== "string") return true;
  if (isSigned) return SIGNED_NUMBER_REGEX.test(value);
  return UNSIGNED_NUMBER_REGEX.test(value);
};

const parseBigInt = (value: string | bigint): bigint | null => {
  try {
    const integerPart = value.toString().split(".")[0];
    return BigInt(integerPart);
  } catch {
    return null;
  }
};

const isInvalidUnsignedValue = (value: bigint, isSigned: boolean): boolean => {
  return !isSigned && value < 0;
};

const fitsWithinBitCount = (
  value: bigint,
  bitcount: number,
  isSigned: boolean,
): boolean => {
  const hexString = value.toString(16);
  const significantHexDigits = hexString.match(/.*x0*(.*)$/)?.[1] ?? "";

  if (significantHexDigits.length * 4 > bitcount) return false;

  // Check if the value is a negative overflow for signed integers.
  if (isSigned && significantHexDigits.length * 4 === bitcount) {
    const mostSignificantDigit = parseInt(
      significantHexDigits.slice(-1)?.[0],
      16,
    );
    if (mostSignificantDigit >= 8) return false;
  }

  return true;
};
// Treat any dot-separated string as a potential ENS name
const ensRegex = /.+\..+/;
export const isENS = (address = "") => ensRegex.test(address);
