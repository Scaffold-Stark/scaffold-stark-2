import {
  cairo,
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CairoResult,
  CairoResultVariant,
  num,
  BigNumberish,
} from "starknet";
import {
  isCairoArray,
  isCairoBigInt,
  isCairoBool,
  isCairoFelt,
  isCairoInt,
  isCairoOption,
  isCairoResult,
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
export const getArgsAsStringInputFromForm = (form: Record<string, any>) => {
  const _encodeValueFromKey = (key: string = "", value: any): any => {
    // array
    if (isCairoArray(key)) {
      const genericType = parseGenericType(key)[0];
      return value.map((arrayValue: any) =>
        _encodeValueFromKey(genericType, arrayValue),
      );
    }

    // enum & struct
    if (!key.includes("core::") || isCairoResult(key) || isCairoOption(key)) {
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

        // check for option
        if (
          enumVariants.includes("Some") &&
          enumVariants.includes("None") &&
          isCairoOption(key)
        ) {
          // for some value we return with the corresponding value

          if ((enumObject.Some as FormStructValue).value !== undefined)
            return new CairoOption(
              CairoOptionVariant.Some,
              _encodeValueFromKey(
                (enumObject.Some as FormStructValue).type,
                (enumObject.Some as FormStructValue).value,
              ),
            );

          // set to none as default
          return new CairoOption(CairoOptionVariant.None);
        }

        // check for result
        if (
          enumVariants.includes("Ok") &&
          enumVariants.includes("Err") &&
          isCairoResult(key)
        ) {
          // for some value we return with the corresponding value
          if ((enumObject.Ok as FormStructValue).value !== undefined)
            return new CairoResult(
              CairoResultVariant.Ok,
              _encodeValueFromKey(
                (enumObject.Ok as FormStructValue).type,
                (enumObject.Ok as FormStructValue).value,
              ),
            );
          else if (
            typeof (enumObject.Err as FormStructValue).value !== undefined
          ) {
            return new CairoResult(
              CairoResultVariant.Err,
              _encodeValueFromKey(
                (enumObject.Err as FormStructValue).type,
                (enumObject.Err as FormStructValue).value,
              ),
            );
          }
        }

        const activeVariant = enumVariants.find((variant) => {
          const v = enumObject[variant];
          return v && (v.value !== undefined || v.value === "");
        });

        const restructuredEnum = activeVariant
          ? {
              [activeVariant]:
                enumObject[activeVariant].value !== undefined
                  ? _encodeValueFromKey(
                      enumObject[activeVariant].type,
                      enumObject[activeVariant].value,
                    )
                  : undefined,
            }
          : {};

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
      (isCairoBigInt(key) ||
        isCairoInt(key) ||
        isCairoFelt(key) ||
        isCairoU256(key))
    ) {
      return num.toBigInt(value);
    }

    if (
      isValidNumber(value) &&
      (isCairoBigInt(key) ||
        isCairoInt(key) ||
        isCairoFelt(key) ||
        isCairoU256(key))
    ) {
      return num.toBigInt(value);
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
