import {
  AbiFunction,
  AbiParameter,
  parseParamWithType,
} from "~~/utils/scaffold-stark/contract";
/**
 * Generates a key based on function metadata
 */
const getFunctionInputKey = (
  functionName: string,
  input: AbiParameter,
  inputIndex: number,
): string => {
  const name = input?.name || `input_${inputIndex}_`;
  return functionName + "_" + name + "_" + input.type;
};

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const getInitialFormState = (abiFunction: AbiFunction) => {
  const initialForm: Record<string, any> = {};
  if (!abiFunction.inputs) return initialForm;
  abiFunction.inputs.forEach((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    initialForm[key] = "";
  });
  return initialForm;
};

const deepParseValues = (
  value: any,
  isRead: boolean,
  keyAndType?: any,
): any => {
  if (keyAndType) {
    return parseParamWithType(keyAndType, value, isRead);
  }
  if (typeof value === "string") {
    if (isJsonString(value)) {
      const parsed = JSON.parse(value);
      return deepParseValues(parsed, isRead);
    } else {
      // It's a string but not a JSON string, return as is
      return value;
    }
  } else if (Array.isArray(value)) {
    // If it's an array, recursively parse each element
    return value.map((element) => deepParseValues(element, isRead));
  } else if (typeof value === "object" && value !== null) {
    // If it's an object, recursively parse each value
    return Object.entries(value).reduce((acc: any, [key, val]) => {
      acc[key] = deepParseValues(val, isRead);
      return acc;
    }, {});
  }

  // Handle boolean values represented as strings
  if (
    value === "true" ||
    value === "1" ||
    value === "0x1" ||
    value === "0x01" ||
    value === "0x0001"
  ) {
    return true;
  } else if (
    value === "false" ||
    value === "0" ||
    value === "0x0" ||
    value === "0x00" ||
    value === "0x0000"
  ) {
    return false;
  }

  return value;
};
/**
 * parses form input with array support
 */
const getParsedContractFunctionArgs = (
  form: Record<string, any>,
  isRead: boolean,
) => {
  return Object.keys(form).map((key) => {
    const valueOfArg = form[key];
    return deepParseValues(valueOfArg, isRead, key);
  });
};

const adjustInput = (input: AbiParameter): AbiParameter => {
  return {
    ...input,
  };
};

const transformAbiFunction = (abiFunction: AbiFunction): AbiFunction => {
  return {
    ...abiFunction,
    inputs: abiFunction.inputs.map((value) =>
      adjustInput(value as AbiParameter),
    ),
  };
};

export {
  getFunctionInputKey,
  isJsonString,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
};
