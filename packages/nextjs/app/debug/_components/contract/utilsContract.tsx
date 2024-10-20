import {
  AbiEnum,
  AbiFunction,
  AbiParameter,
  AbiStruct,
  deepParseValues,
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

const getInitialTupleFormState = (abiParameter: AbiStruct | AbiEnum) => {
  const initialForm: Record<string, any> = {};

  if (abiParameter.type === "struct") {
    abiParameter.members.forEach((member, memberIndex) => {
      const key = getFunctionInputKey(abiParameter.name, member, memberIndex);
      initialForm[key] = "";
    });
  } else {
    abiParameter.variants.forEach((variant, variantIndex) => {
      const key = getFunctionInputKey(abiParameter.name, variant, variantIndex);
      initialForm[key] = "";
    });
  }
  return initialForm;
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

/**
 * parses form input with array support
 */
const getParsedContractFunctionArgs = (
  form: Record<string, any>,
  isRead: boolean,
  isReadArgsParsing?: boolean,
) => {
  return Object.keys(form).map((key) => {
    const valueOfArg = form[key];
    return deepParseValues(valueOfArg, isRead, key, isReadArgsParsing);
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
  getInitialFormState,
  getInitialTupleFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
};
