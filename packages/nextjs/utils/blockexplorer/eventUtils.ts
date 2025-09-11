/**
 * Utility functions for handling events in the block explorer
 */

/**
 * Format display value for event arguments
 */
export const getDisplayValue = (val: any): string => {
  if (typeof val === "bigint") {
    return `0x${val.toString(16)}`;
  }
  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }
  if (typeof val === "string") {
    return val.startsWith("0x") ? val : `"${val}"`;
  }
  return String(val);
};

/**
 * Get the Cairo type from ABI or infer it
 */
export const getCairoType = (
  val: any,
  paramName?: string,
  argTypes?: Record<string, string>,
): string => {
  // First try to get the actual ABI type
  if (argTypes && paramName && argTypes[paramName]) {
    return argTypes[paramName];
  }

  // Fallback to inference
  if (typeof val === "boolean") {
    return "core::bool";
  }
  if (typeof val === "string") {
    if (val.startsWith("0x") && val.length === 66) {
      return "core::starknet::contract_address::ContractAddress";
    }
    if (val.startsWith("0x")) {
      return "core::felt252";
    }
    return "core::byte_array::ByteArray";
  }
  if (typeof val === "bigint") {
    return "core::integer::u256";
  }
  return "core::felt252";
};

/**
 * Get copy value for event arguments
 */
export const getCopyValue = (value: any): string => {
  return typeof value === "bigint" ? `0x${value.toString(16)}` : String(value);
};

/**
 * Check if event has meaningful decoded arguments
 */
export const hasMeaningfulDecodedArgs = (
  parsedArgs: Record<string, any>,
): boolean => {
  return (
    Object.keys(parsedArgs).length > 0 &&
    !Object.keys(parsedArgs).every(
      (key) => key.startsWith("key") || key.startsWith("data"),
    )
  );
};

/**
 * Extract keys from event arguments
 */
export const extractEventKeys = (args: Record<string, any>): any[] => {
  return [
    args.selector,
    ...Object.keys(args)
      .filter((k) => k.startsWith("key"))
      .map((k) => args[k]),
  ];
};

/**
 * Extract data from event arguments
 */
export const extractEventData = (args: Record<string, any>): any[] => {
  return Object.keys(args)
    .filter((k) => k.startsWith("data"))
    .map((k) => args[k]);
};
