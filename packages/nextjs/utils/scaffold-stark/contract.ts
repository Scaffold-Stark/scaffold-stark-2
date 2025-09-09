import scaffoldConfig from "~~/scaffold.config";
import deployedContractsData from "~~/contracts/deployedContracts";
import predeployedContracts from "~~/contracts/predeployedContracts";
import configExternalContracts from "~~/contracts/configExternalContracts";
import type {
  Abi,
  ExtractAbiEventNames,
  ExtractAbiInterfaces,
  ExtractArgs,
} from "abi-wan-kanabi/dist/kanabi";
import {
  UseReadContractProps,
  UseSendTransactionProps,
} from "@starknet-react/core";
import { Address } from "@starknet-react/chains";
import {
  CairoCustomEnum,
  CairoOption,
  CairoOptionVariant,
  CairoResult,
  CairoResultVariant,
  getChecksumAddress,
  uint256,
  validateAndParseAddress,
} from "starknet";
import { byteArray } from "starknet";
import type { MergeDeepRecord } from "type-fest/source/merge-deep";
import { feltToHex, isJsonString } from "~~/utils/scaffold-stark/common";
import {
  isCairoArray,
  isCairoBigInt,
  isCairoBool,
  isCairoByteArray,
  isCairoBytes31,
  isCairoContractAddress,
  isCairoFelt,
  isCairoInt,
  isCairoOption,
  isCairoResult,
  isCairoTuple,
  isCairoType,
  isCairoU256,
  parseGenericType,
} from "~~/utils/scaffold-stark/types";

type AddExternalFlag<T> = {
  [network in keyof T]: {
    [ContractName in keyof T[network]]: T[network][ContractName];
  };
};

type ConfiguredChainId =
  (typeof scaffoldConfig)["targetNetworks"][0]["network"];
export type InheritedFunctions = { readonly [key: string]: string };

type Contracts = ContractsDeclaration[ConfiguredChainId];
export type ContractName = keyof Contracts;
export type Contract<TContractName extends ContractName> =
  Contracts[TContractName];

export enum ContractCodeStatus {
  "LOADING",
  "DEPLOYED",
  "NOT_FOUND",
}

export type GenericContract = {
  address: Address;
  abi: Abi;
  classHash: String;
};

export type GenericContractsDeclaration = {
  [network: string]: {
    [contractName: string]: GenericContract;
  };
};

export const deepMergeContracts = <
  L extends Record<PropertyKey, any>,
  E extends Record<PropertyKey, any>,
>(
  local: L,
  external: E,
) => {
  const result: Record<PropertyKey, any> = {};
  const allKeys = Array.from(
    new Set([...Object.keys(local), ...Object.keys(external)]),
  );
  for (const key of allKeys) {
    const localValue = local[key];
    const externalValue = external[key];
    if (
      typeof localValue === "object" &&
      typeof externalValue === "object" &&
      localValue !== null &&
      externalValue !== null
    ) {
      // Recursively merge nested objects
      result[key] = deepMergeContracts(localValue, externalValue);
    } else {
      // Use external value if available, otherwise fallback to local
      result[key] = externalValue !== undefined ? externalValue : localValue;
    }
  }

  return result as MergeDeepRecord<
    AddExternalFlag<L>,
    AddExternalFlag<E>,
    { arrayMergeMode: "spread" }
  >;
};

const mergedPredeployedContracts = deepMergeContracts(
  predeployedContracts,
  configExternalContracts,
);

const contractsData = deepMergeContracts(
  deployedContractsData,
  mergedPredeployedContracts,
);

type IsContractDeclarationMissing<TYes, TNo> = typeof contractsData extends {
  [key in ConfiguredChainId]: any;
}
  ? TNo
  : TYes;

type ContractsDeclaration = IsContractDeclarationMissing<
  GenericContractsDeclaration,
  typeof contractsData
>;

/**
 * Abi types copied from abi-wan-kanabi as they are not exported
 */
export type AbiParameter = {
  name: string;
  type: string;
};
export type AbiOutput = {
  type: string;
};
type AbiStateMutability = "view" | "external";
type AbiImpl = {
  type: "impl";
  name: string;
  interface_name: string;
};
type AbiInterface = {
  type: "interface";
  name: string;
  items: readonly AbiFunction[];
};
type AbiConstructor = {
  type: "constructor";
  name: "constructor";
  inputs: readonly AbiParameter[];
};
export type AbiFunction = {
  type: "function";
  name: string;
  inputs: readonly AbiParameter[];
  outputs: readonly AbiOutput[];
  state_mutability: AbiStateMutability;
};
export type AbiStruct = {
  type: "struct";
  name: string;
  members: readonly AbiParameter[];
};
export type AbiEnum = {
  type: "enum";
  name: string;
  variants: readonly AbiParameter[];
};

// TODO: resolve type properly
export const contracts =
  contractsData as unknown as GenericContractsDeclaration | null;

export type UseScaffoldWriteConfig<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >,
> = {
  contractName: TContractName;
} & IsContractDeclarationMissing<
  Partial<UseSendTransactionProps> & {
    functionName: string;
    args: any[];
  },
  {
    functionName: TFunctionName;
  } & Omit<
    UseSendTransactionProps,
    "chainId" | "abi" | "address" | "functionName" | "mode"
  > &
    UseScaffoldArgsParam<TAbi, TContractName, TFunctionName>
>;

type InferContractAbi<TContract> = TContract extends { abi: infer TAbi }
  ? TAbi
  : never;

export type ContractAbi<TContractName extends ContractName = ContractName> =
  InferContractAbi<Contract<TContractName>>;

export type FunctionNamesWithInputs<TContractName extends ContractName> =
  Exclude<
    Extract<
      Extract<
        ContractAbi<TContractName>[number],
        { type: "interface" }
      >["items"][number],
      {
        type: "function";
      }
    >,
    {
      inputs: readonly [];
    }
  >["name"];

type OptionalTupple<T> = T extends readonly [infer H, ...infer R]
  ? readonly [H | undefined, ...OptionalTupple<R>]
  : T;
type UnionToIntersection<U> = Expand<
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never
>;
type Expand<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T;

// helper function will only take from interfaces : //TODO: see if we can make it more generic
export type ExtractAbiFunctionNamesScaffold<
  TAbi extends Abi,
  TAbiStateMutability extends AbiStateMutability = AbiStateMutability,
> = ExtractAbiFunctionsScaffold<TAbi, TAbiStateMutability>["name"];

// helper function will only take from interfaces : //TODO: see if we can make it more generic
export type ExtractAbiFunctionsScaffold<
  TAbi extends Abi,
  TAbiStateMutability extends AbiStateMutability = AbiStateMutability,
> = Extract<
  ExtractAbiInterfaces<TAbi>["items"][number],
  {
    type: "function";
    state_mutability: TAbiStateMutability;
  }
>;

// helper function will only take from interfaces : //TODO: see if we can make it more generic
export type ExtractAbiFunctionNamesWithInputsScaffold<
  TAbi extends Abi,
  TAbiStateMutibility extends AbiStateMutability = AbiStateMutability,
> = Exclude<
  Extract<
    ExtractAbiInterfaces<TAbi>["items"][number],
    {
      type: "function";
      state_mutability: TAbiStateMutibility;
    }
  >,
  {
    inputs: readonly [];
  }
>["name"];

export type ExtractAbiFunctionScaffold<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<TAbi>,
> = Extract<
  ExtractAbiFunctionsScaffold<TAbi>,
  {
    name: TFunctionName;
  }
>;

// let emerson = singleFunction extends listOfFunctions ? true : false;

export type UseScaffoldArgsParam<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<TAbi>,
> =
  TFunctionName extends ExtractAbiFunctionNamesWithInputsScaffold<
    ContractAbi<ContractName>
  >
    ? {
        args: OptionalTupple<
          UnionToIntersection<
            ExtractArgs<
              TAbi,
              ExtractAbiFunctionScaffold<
                ContractAbi<TContractName>,
                TFunctionName
              >
            >
          >
        >;
      }
    : { args?: any[] };

export type UseScaffoldReadConfig<
  TAbi extends Abi,
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "view"
  >,
> = {
  contractName: TContractName;
} & IsContractDeclarationMissing<
  Partial<UseReadContractProps<TAbi, TFunctionName>>,
  {
    functionName: TFunctionName;
  } & Omit<
    UseReadContractProps<TAbi, TFunctionName>,
    "chainId" | "abi" | "address" | "functionName" | "args"
  > &
    UseScaffoldArgsParam<TAbi, TContractName, TFunctionName>
>;

export type AbiFunctionOutputs<
  TAbi extends Abi,
  TFunctionName extends string,
> = ExtractAbiFunctionScaffold<TAbi, TFunctionName>["outputs"];

/*export type AbiEventInputs<TAbi extends Abi, TEventName extends ExtractAbiEventNames<TAbi>> = ExtractAbiEvent<
  TAbi,
  TEventName
>["inputs"];

type IndexedEventInputs<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = Extract<AbiEventInputs<ContractAbi<TContractName>, TEventName>[number], { indexed: true }>;

export type EventFilters<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = IsContractDeclarationMissing<
  any,
  IndexedEventInputs<TContractName, TEventName> extends never
    ? never
    : {
      [Key in IsContractDeclarationMissing<
        any,
        IndexedEventInputs<TContractName, TEventName>["name"]
      >]?: AbiParameterToPrimitiveType<Extract<IndexedEventInputs<TContractName, TEventName>, { name: Key }>>;
    }
>;*/

type BaseName<S extends string> = S extends `${infer _Prefix}::${infer Rest}`
  ? BaseName<Rest>
  : S;

export type UseScaffoldEventHistoryConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
> = {
  contractName: TContractName;
  eventName: // | IsContractDeclarationMissing<string, TEventName>
  BaseName<IsContractDeclarationMissing<string, TEventName>>;
  fromBlock: bigint;
  filters?: { [key: string]: any };
  blockData?: TBlockData;
  transactionData?: TTransactionData;
  receiptData?: TReceiptData;
  watch?: boolean;
  format?: boolean;
  enabled?: boolean;
};

export type UseScaffoldWatchContractEventConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = {
  contractName: TContractName;
  eventName: BaseName<IsContractDeclarationMissing<string, TEventName>>;
  onLogs: (log: any) => void;
};

/// export all the types from kanabi

export function getFunctionsByStateMutability(
  abi: Abi,
  stateMutability: AbiStateMutability,
): AbiFunction[] {
  return abi
    .reduce((acc, part) => {
      if (part.type === "function") {
        acc.push(part);
      } else if (part.type === "interface" && Array.isArray(part.items)) {
        part.items.forEach((item) => {
          if (item.type === "function") {
            acc.push(item);
          }
        });
      }
      return acc;
    }, [] as AbiFunction[])
    .filter((fn) => {
      return fn.state_mutability == stateMutability;
    });
}

// TODO: in the future when param decoding is standardized in wallets ready and braavos we can return the object
// new starknet react hooks (v3) doesn't use raw parse
function tryParsingParamReturnValues(
  fn: (x: any) => {},
  param: any,
  isReadArgsParsing: boolean,
) {
  try {
    const objectValue = fn(param);
    if (
      typeof objectValue === "object" &&
      objectValue !== null &&
      !isReadArgsParsing
    ) {
      // handle empty array
      return Object.values(objectValue).map((value) => {
        if (Array.isArray(value) && value.length === 0) return "0x0";
        return value;
      });
    } else {
      return objectValue;
    }
  } catch (e) {
    return param;
  }
}

function tryParsingParamReturnObject(fn: (x: any) => {}, param: any) {
  try {
    return fn(param);
  } catch (e) {
    return param;
  }
}

const decodeParamsWithType = (paramType: string, param: any): unknown => {
  const isRead = true;
  if (isCairoTuple(paramType)) {
    return objectToCairoTuple(param, paramType);
  } else if (isCairoArray(paramType)) {
    return tryParsingParamReturnObject((param) => {
      const genericType = parseGenericType(paramType)[0];
      return genericType
        ? // @ts-expect-error item type is unknown
          param.map((item) => parseParamWithType(genericType, item, isRead))
        : param;
    }, param);
  } else if (isCairoOption(paramType)) {
    return tryParsingParamReturnObject((x) => {
      const option = x as CairoOption<any>;
      return option.isNone()
        ? "None"
        : `Some(${parseParamWithType(
            (paramType as string).split("<").pop()!,
            option.unwrap(),
            isRead,
          )})`;
    }, param);
  } else if (isCairoResult(paramType)) {
    return tryParsingParamReturnObject((x) => {
      const result = x as CairoResult<any, any>;
      const [ok, error] = parseGenericType(paramType);
      return result.isOk()
        ? `Ok(${parseParamWithType(ok, result.unwrap(), isRead)})`
        : `Err(${parseParamWithType(error, result.unwrap(), isRead)})`;
    }, param);
  } else if (isCairoContractAddress(paramType)) {
    return tryParsingParamReturnObject(validateAndParseAddress, param);
  } else if (isCairoU256(paramType)) {
    return tryParsingParamReturnObject(uint256.uint256ToBN, param);
  } else if (isCairoByteArray(paramType)) {
    return tryParsingParamReturnObject(byteArray.stringFromByteArray, param);
  } else if (isCairoFelt(paramType)) {
    return feltToHex(param);
  } else if (isCairoBool(paramType)) {
    return typeof param === "boolean"
      ? param
      : (param as string).startsWith("0x0")
        ? "false"
        : "true";
  } else if (isCairoBytes31(paramType)) {
    return tryParsingParamReturnObject((x: bigint) => feltToHex(x), param);
  } else if (isCairoInt(paramType)) {
    return tryParsingParamReturnObject(
      (x) => (typeof x === "bigint" ? Number(x) : parseInt(x, 16)),
      param,
    );
  } else if (isCairoBigInt(paramType)) {
    return tryParsingParamReturnObject((x) => BigInt(x), param);
  } else {
    return tryParsingParamReturnObject((x) => x, param);
  }
};

const encodeParamsWithType = (
  paramType: string = "",
  param: any,
  isReadArgsParsing: boolean,
): unknown => {
  if (isCairoTuple(paramType)) {
    return tryParsingParamReturnValues(
      (x) => stringToObjectTuple(x, paramType, isReadArgsParsing),
      param,
      isReadArgsParsing,
    );
  } else if (isCairoArray(paramType)) {
    const genericType = parseGenericType(paramType)[0];

    // if we have to process string
    if (typeof param === "string") {
      const tokens = param.split(",");
      const encodedArray = [];
      if (genericType) {
        if (!isReadArgsParsing) encodedArray.push(tokens.length);

        encodedArray.push(
          ...tokens.map((item) =>
            encodeParamsWithType(
              genericType,
              typeof item === "string" ? item.trim() : item,
              isReadArgsParsing,
            ),
          ),
        );

        return encodedArray;
      } else {
        return param;
      }
    }

    // if we have to process array
    else if (Array.isArray(param)) {
      if (genericType) {
        const encodedArray = [];
        if (!isReadArgsParsing) encodedArray.push(param.length);

        encodedArray.push(
          ...param.map((item) =>
            encodeParamsWithType(
              genericType,
              typeof item === "string" ? item.trim() : item,
              isReadArgsParsing,
            ),
          ),
        );

        return encodedArray;
      } else {
        return param;
      }
    }

    // fallback
    else {
      return param;
    }
  } else if (isCairoOption(paramType)) {
    if (param === "None") {
      return new CairoOption(CairoOptionVariant.None);
    }
    const type = parseGenericType(paramType);
    const parsedParam = param.slice(5, param.length - 1);
    const parsedValue = encodeParamsWithType(
      type as string,
      parsedParam,
      isReadArgsParsing,
    );
    return new CairoOption(CairoOptionVariant.Some, parsedValue);
  } else if (isCairoU256(paramType)) {
    return tryParsingParamReturnValues(
      uint256.bnToUint256,
      param,
      isReadArgsParsing,
    );
  } else if (isCairoFelt(paramType)) {
    return param;
  } else if (isCairoByteArray(paramType)) {
    // starknet react next version only needs raw strings
    if (isReadArgsParsing) return param;

    return tryParsingParamReturnValues(
      byteArray.byteArrayFromString,
      param,
      isReadArgsParsing,
    );
  } else if (isCairoContractAddress(paramType)) {
    return tryParsingParamReturnValues(
      validateAndParseAddress,
      param,
      isReadArgsParsing,
    );
  } else if (isCairoBool(paramType)) {
    return param == "false" ? "0x0" : "0x1";
  } else if (isCairoResult(paramType)) {
    if (param) {
      const variantType =
        param.variant.Ok && param.variant.Ok.value
          ? param.variant.Ok
          : param.variant.Err;
      const variantValue = variantType.value;

      const resultVariant =
        variantType === param.variant.Ok && param.variant.Ok.value
          ? CairoResultVariant.Ok
          : CairoResultVariant.Err;
      const valueType: any = encodeParamsWithType(
        variantType.type,
        variantValue,
        isReadArgsParsing,
      );

      return new CairoResult(resultVariant, valueType);
    }
  } else {
    try {
      // custom enum encoding
      if (param?.variant && typeof param.variant == "object") {
        const parsedVariant = Object.keys(param.variant).reduce(
          (acc, key) => {
            if (
              param.variant[key].value === "" ||
              param.variant[key].value === undefined
            ) {
              acc[key] = undefined;
              return acc;
            }

            acc[key] = encodeParamsWithType(
              param.variant[key].type,
              param.variant[key].value,
              isReadArgsParsing,
            );
            return acc;
          },
          {} as Record<string, any>,
        );

        const isDevnet =
          scaffoldConfig.targetNetworks[0].network.toString() === "devnet";

        if (isReadArgsParsing) return new CairoCustomEnum(parsedVariant);

        const encodedCustomEnum =
          encodeCustomEnumWithParsedVariants(parsedVariant);

        return Object.values(parsedVariant).length > 0
          ? isDevnet
            ? encodedCustomEnum
            : [[encodedCustomEnum]]
          : undefined;
      }

      // encode to object (v3)
      else if (!!isReadArgsParsing) {
        return Object.keys(param).reduce(
          (acc, key) => {
            const parsed = encodeParamsWithType(
              param[key].type,
              param[key].value,
              isReadArgsParsing,
            );

            if (parsed !== undefined && parsed !== "") {
              acc[key] = parsed;
            }
            return acc;
          },
          {} as Record<string, any>,
        );
      }

      // encode to rawargs
      else {
        return Object.keys(param).reduce((acc, key) => {
          const parsed = encodeParamsWithType(
            param[key].type,
            param[key].value,
            isReadArgsParsing,
          );

          if (parsed !== undefined && parsed !== "") {
            if (Array.isArray(parsed)) {
              acc.push(...parsed);
            } else {
              acc.push(parsed);
            }
          }
          return acc;
        }, [] as any[]);
      }
    } catch (err: any) {
      console.error(err.stack);
      return param;
    }
  }
};

export function parseParamWithType(
  paramType: string,
  param: any,
  isRead: boolean,
  isReadArgsParsing?: boolean,
): any {
  if (isRead) return decodeParamsWithType(paramType, param);
  return encodeParamsWithType(paramType, param, !!isReadArgsParsing);
}

export function parseTuple(value: string): string[] {
  const values: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of value) {
    if (char === "(") {
      if (depth > 0) {
        current += char;
      }
      depth++;
    } else if (char === ")") {
      depth--;
      if (depth > 0) {
        current += char;
      } else {
        values.push(current.trim());
        current = "";
      }
    } else if (char === "," && depth === 1) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  return values;
}

function objectToCairoTuple(obj: { [key: number]: any }, type: string): string {
  const types = parseTuple(type);
  const values = Object.keys(obj)
    .map((key) => {
      const index = parseInt(key, 10);
      const value = obj[index];
      const valueType = types[index];
      return decodeParamsWithType(valueType, value);
    })
    .join(",");

  return `(${values})`;
}

function stringToObjectTuple(
  tupleString: string,
  paramType: string,
  isReadArgsParsing?: boolean,
): { [key: number]: any } {
  const values = parseTuple(tupleString);
  const types = parseTuple(paramType);

  const obj: { [key: number]: any } = {};
  values.forEach((value, index) => {
    obj[index] = encodeParamsWithType(types[index], value, !!isReadArgsParsing);
  });

  return obj;
}

// function to manually encode enums
// NOTE: positions based on starknetjs compile function
// NOTE: this assumes that the active variant is the only one without undefined
function encodeCustomEnumWithParsedVariants(
  parsedVariants: Record<string, any>,
) {
  const values = Object.values(parsedVariants);

  // check for correct active variant count
  const nonUndefinedCount = values.filter((value) => !!value).length;
  if (nonUndefinedCount > 1) {
    throw Error("Custom Enum has > 1 active variant");
  }

  // find non undefined
  const numActiveVariant = values.findIndex((value) => !!value);
  const parsedParameter = values[numActiveVariant];

  // arrange in array
  if (Array.isArray(values[parsedParameter])) {
    return [numActiveVariant.toString(), ...parsedParameter];
  }
  return [numActiveVariant.toString(), parsedParameter];
}
