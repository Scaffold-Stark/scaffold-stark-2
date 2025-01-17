import { getChecksumAddress } from "starknet";

export const parseEventData = (
  args: Record<string, any>,
  types: { name: string; type: string; kind: string }[],
) => {
  const convertToHex = (value: bigint): string => {
    return getChecksumAddress(`0x${value.toString(16)}`);
  };

  const result: Record<string, any> = {};

  Object.keys(args).forEach((paramName: string) => {
    const paramValue = args[paramName];
    const paramType = types.find((t) => t.name === paramName)?.type;
    if (!paramType) {
      result[paramName] = paramValue;
      return;
    }

    if (paramType === "core::starknet::contract_address::ContractAddress") {
      result[paramName] = convertToHex(paramValue);
    } else if (
      paramType ===
      "core::array::Array::<core::starknet::contract_address::ContractAddress>"
    ) {
      result[paramName] = paramValue.map((item: bigint) => convertToHex(item));
    } else if (paramType.startsWith("(") && paramType.endsWith(")")) {
      const innerTypes = paramType.slice(1, -1).split(",");
      const indexesOfAddress = innerTypes
        .map((type, index) =>
          type.trim() === "core::starknet::contract_address::ContractAddress"
            ? index
            : -1,
        )
        .filter((index) => index !== -1);
      const newTuple: Record<number, any> = {};
      Object.keys(paramValue).forEach((key) => {
        newTuple[Number(key)] = paramValue[key];
      });
      for (const index of indexesOfAddress) {
        newTuple[index] = convertToHex(newTuple[index]);
      }
      result[paramName] = newTuple;
    } else {
      result[paramName] = paramValue;
    }
  });

  return result;
};
