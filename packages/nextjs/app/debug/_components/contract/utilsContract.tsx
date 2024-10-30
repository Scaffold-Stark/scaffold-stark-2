import { cairo, CairoCustomEnum } from "starknet";
import {
  isCairoArray,
  isCairoBigInt,
  isCairoBool,
  isCairoFelt,
  isCairoInt,
  isCairoTuple,
  isCairoU256,
  parseGenericType,
} from "~~/utils/scaffold-stark";
import {
  AbiEnum,
  AbiFunction,
  AbiParameter,
  AbiStruct,
  parseTuple,
} from "~~/utils/scaffold-stark/contract";
/**
 * Generates a key based on function metadata
 */
export const getFunctionInputKey = (
  functionName: string,
  input: AbiParameter,
  inputIndex: number,
): string => {
  const name = input?.name || `input_${inputIndex}_`;
  return functionName + "_" + name + "_" + input.type;
};

export const getInitialTupleFormState = (abiParameter: AbiStruct | AbiEnum) => {
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

export const getInitialFormState = (abiFunction: AbiFunction) => {
  const initialForm: Record<string, any> = {};
  if (!abiFunction.inputs) return initialForm;
  abiFunction.inputs.forEach((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    initialForm[key] = "";
  });
  return initialForm;
};

const convertStringInputToBool = (input: string) => {
  if (new Set(["true", "1", "0x1", "0x01, 0x001"]).has(input)) {
    return true;
  } else if (new Set(["false", "0", "0x0", "0x00", "0x000"]).has(input)) {
    return false;
  }

  return true;
};

function isValidNumber(input?: string): boolean {
  // Check for empty string
  if ((input || "").length === 0) return false;

  // Check if it's a valid hex number (starts with '0x' or '0X')
  if (/^0x[0-9a-fA-F]+$/i.test(input || "")) {
    return true;
  }

  // Check for a valid decimal number (including scientific notation and floating points)
  const decimalNumberRegex = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
  return decimalNumberRegex.test(input || "");
}

function isValidHexNumber(input?: string): boolean {
  // Check for empty string
  if ((input || "").length === 0) return false;

  // Check if it's a valid hex number (starts with '0x' or '0X')
  return /^0x[0-9a-fA-F]+$/i.test(input || "");
}


/**
 * parses form input with array support
 */
export const getArgsAsStringInputFromForm = (
  form: Record<string, any>,
  isRead: boolean,
  isReadArgsParsing?: boolean,
) => {
  const _encodeValueFromKey = (key: string = "", value: any): any => {
    // array
    if (isCairoArray(key)) {
      const genericType = parseGenericType(key)[0];
      return value.map((arrayValue: any) =>
        _encodeValueFromKey(genericType, arrayValue),
      );
    }

    // enum & struct
    if (key.includes("contracts::")) {
      type FormStructValue = {
        type: string;
        value: any;
      };

      // alias it so that we have better name
      const structObject = value;

      // this indicates enum
      if (Object.keys(structObject).includes("variant")) {
        // construct empty enums
        const enumObject = structObject.variant as any;
        const enumVariants = Object.keys(enumObject);
        const restructuredEnum = Object.fromEntries(
          enumVariants.map((variant) => [
            variant,
            (enumObject[variant].value || "").trim().length > 0
              ? _encodeValueFromKey(
                  (enumObject[variant] as FormStructValue).type,
                  (enumObject[variant] as FormStructValue).value,
                )
              : undefined,
          ]),
        );

        return new CairoCustomEnum(restructuredEnum);
      }

      // map out values
      const remappedEntries = Object.entries(structObject).map(
        ([structObjectKey, structObjectValue]) => {
          return [
            structObjectKey,
            _encodeValueFromKey(
              (structObjectValue as FormStructValue).type,
              (structObjectValue as FormStructValue).value,
            ),
          ];
        },
      );
      return Object.fromEntries(remappedEntries);
    }

    // encode tuple input
    if (isCairoTuple(key)) {
      console.log({ key });
      const tupleKeys = parseTuple(key.replace(/^.*\(/, "("));
      const tupleValues = parseTuple(value);
      return cairo.tuple(
        ...tupleValues.map((tupleValue, index) =>
          _encodeValueFromKey(tupleKeys[index], tupleValue),
        ),
      );
    }

    // translate boolean input
    if (isCairoBool(key)) return convertStringInputToBool(value);

    if (
      isValidHexNumber(value) &&
      (isCairoBigInt(key) || isCairoInt(key) || isCairoFelt(key) || isCairoU256(key))
    ) {
      return parseInt(value, 16);
    }

    if (
      isValidNumber(value) &&
      (isCairoBigInt(key) || isCairoInt(key) || isCairoFelt(key) || isCairoU256(key))
    ) {
      return parseInt(value, 10);
    }


    return value;
  };

  return Object.keys(form).map((key) => _encodeValueFromKey(key, form[key]));
};

const adjustInput = (input: AbiParameter): AbiParameter => {
  return {
    ...input,
  };
};

export const transformAbiFunction = (abiFunction: AbiFunction): AbiFunction => {
  return {
    ...abiFunction,
    inputs: abiFunction.inputs.map((value) =>
      adjustInput(value as AbiParameter),
    ),
  };
};
