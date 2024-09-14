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
  UseContractReadProps,
  UseContractWriteProps,
} from "@starknet-react/core";
import { Address } from "@starknet-react/chains";
import {
  CairoOption,
  CairoOptionVariant,
  CairoResult,
  CairoResultVariant,
  uint256,
  validateAndParseAddress,
} from "starknet";
import { byteArray } from "starknet";
import type { MergeDeepRecord } from "type-fest/source/merge-deep";
import { feltToHex } from "~~/utils/scaffold-stark/common";
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
    if (!external[key]) {
      result[key] = local[key];
      continue;
    }
    const amendedExternal = Object.fromEntries(
      Object.entries(external[key] as Record<string, Record<string, unknown>>),
    );
    result[key] = { ...local[key], ...amendedExternal };
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

export const contracts = contractsData as GenericContractsDeclaration | null;

export type UseScaffoldWriteConfig<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>,
    "external"
  >,
> = {
  contractName: TContractName;
} & IsContractDeclarationMissing<
  Partial<UseContractWriteProps> & {
    functionName: string;
    args: any[];
  },
  {
    functionName: TFunctionName;
  } & Omit<
    UseContractWriteProps,
    "chainId" | "abi" | "address" | "functionName" | "mode"
  > &
    UseScaffoldArgsParam<TContractName, TFunctionName>
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

export type UseScaffoldArgsParam<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>
  >,
> =
  TFunctionName extends ExtractAbiFunctionNamesWithInputsScaffold<
    ContractAbi<TContractName>
  >
    ? {
        args: OptionalTupple<
          UnionToIntersection<
            ExtractArgs<
              ContractAbi<TContractName>,
              ExtractAbiFunctionScaffold<
                ContractAbi<TContractName>,
                TFunctionName
              >
            >
          >
        >;
      }
    : {
        args?: never;
      };

export type UseScaffoldReadConfig<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNamesScaffold<
    ContractAbi<TContractName>
  >,
> = {
  contractName: TContractName;
} & IsContractDeclarationMissing<
  Partial<UseContractReadProps>,
  {
    functionName: TFunctionName;
  } & UseScaffoldArgsParam<TContractName, TFunctionName> &
    Omit<UseContractReadProps, "chainId" | "abi" | "address" | "functionName">
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

export type UseScaffoldEventHistoryConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
> = {
  contractName: TContractName;
  eventName: IsContractDeclarationMissing<string, TEventName>;
  fromBlock: bigint;
  filters?: any;
  blockData?: TBlockData;
  transactionData?: TTransactionData;
  receiptData?: TReceiptData;
  watch?: boolean;
  enabled?: boolean;
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

// TODO: in the future when param decoding is standarized in wallets argent and braavos we can return the object
// TODO : starknet react makes an input validation so we need to return objects for function reads
function tryParsingParamReturnValues(fn: (x: any) => {}, param: any) {
  try {
    const objectValue = fn(param);
    if (typeof objectValue === "object" && objectValue !== null) {
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

//@ts-ignore
export function parseParamWithType(
  paramType: string,
  param: any,
  isRead: boolean,
) {
  if (isRead) {
    if (isCairoTuple(paramType)) {
      return objectToCairoTuple(param, paramType);
    } else if (isCairoArray(paramType)) {
      return tryParsingParamReturnObject((param) => {
        const genericType = parseGenericType(paramType)[0];
        return genericType
          ? //@ts-ignore
            param.map((item) => parseParamWithType(genericType, item, isRead))
          : param;
      }, param);
    } else if (isCairoOption(paramType)) {
      //@ts-ignore
      return tryParsingParamReturnObject((x) => {
        const option = x as CairoOption<any>;
        return option.isNone()
          ? "None"
          : `Some(${parseParamWithType(paramType.split("<").pop()!, option.unwrap(), isRead)})`;
      }, param);
    } else if (isCairoResult(paramType)) {
      //@ts-ignore
      return tryParsingParamReturnObject((x) => {
        const result = x as CairoResult<any, any>;
        const [ok, error] = parseGenericType(paramType);
        return result.isOk()
          ? `Ok(${parseParamWithType(ok, result.unwrap(), isRead)})`
          : `Err(${parseParamWithType(error, result.unwrap(), isRead)})`;
      }, param);
    } else if (isCairoU256(paramType)) {
      return tryParsingParamReturnObject(uint256.uint256ToBN, param);
    } else if (isCairoByteArray(paramType)) {
      return tryParsingParamReturnObject(byteArray.stringFromByteArray, param);
    } else if (isCairoContractAddress(paramType)) {
      return tryParsingParamReturnObject(validateAndParseAddress, param);
    } else if (isCairoFelt(paramType)) {
      return feltToHex(param);
    } else if (isCairoBool(paramType)) {
      return typeof param === "boolean"
        ? param
        : (param as string).startsWith("0x0")
          ? "false"
          : "true";
    } else if (isCairoBytes31(paramType)) {
      return tryParsingParamReturnObject(
        (x: bigint) => `0x${x.toString(16)}`,
        param,
      );
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
  } else {
    if (isCairoTuple(paramType)) {
      return tryParsingParamReturnValues(
        (x) => stringToObjectTuple(x, paramType),
        param,
      );
    } else if (isCairoArray(paramType)) {
      const genericType = parseGenericType(paramType)[0];

      // if we have to process string
      if (typeof param === "string") {
        const tokens = param.split(",");
        if (genericType) {
          //@ts-ignore
          return [
            tokens.length,
            ...tokens
              //@ts-ignore
              .map((item) =>
                parseParamWithType(genericType, item.trim(), isRead),
              ),
          ];
        } else {
          return param;
        }
      }

      // if we have to process array
      else if (Array.isArray(param)) {
        if (genericType) {
          //@ts-ignore
          return [
            param.length,
            ...param
              //@ts-ignore
              .map((item) => parseParamWithType(genericType, item, isRead)),
          ];
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
      //@ts-ignore
      const parsedValue = parseParamWithType(
        type as string,
        parsedParam,
        isRead,
      );
      return new CairoOption(CairoOptionVariant.Some, parsedValue);
    } else if (isCairoU256(paramType)) {
      return tryParsingParamReturnValues(uint256.bnToUint256, param);
    } else if (isCairoFelt(paramType)) {
      return param;
    } else if (isCairoByteArray(paramType)) {
      return tryParsingParamReturnValues(byteArray.byteArrayFromString, param);
    } else if (isCairoContractAddress(paramType)) {
      return tryParsingParamReturnValues(validateAndParseAddress, param);
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
        const valueType: any = isCairoU256(variantType.type)
          ? uint256.bnToUint256(variantValue)
          : isCairoByteArray(variantType.type)
            ? byteArray.byteArrayFromString(variantValue)
            : parseParamWithType(variantType.type, variantValue, false);

        return new CairoResult(resultVariant, valueType);
      }
    } else {
      try {
        if (typeof param.variant == "object" && param.variant !== null) {
          const parsedVariant = Object.keys(param.variant).reduce(
            (acc, key) => {
              if (
                param.variant[key].value === "" ||
                param.variant[key].value === undefined
              ) {
                acc[key] = undefined;
                return acc;
              }

              acc[key] = parseParamWithType(
                param.variant[key].type,
                param.variant[key].value,
                false,
              );
              return acc;
            },
            {} as Record<string, any>,
          );

          const isDevnet =
            scaffoldConfig.targetNetworks[0].network.toString() === "devnet";

          const encodedCustomEnum =
            encodeCustomEnumWithParsedVariants(parsedVariant);

          return Object.values(parsedVariant).length > 0
            ? isDevnet
              ? encodedCustomEnum
              : [[encodedCustomEnum]]
            : undefined;
        } else {
          return Object.keys(param).reduce((acc, key) => {
            const parsed = parseParamWithType(
              param[key].type,
              param[key].value,
              false,
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
      } catch (err) {
        //console.log(err);
        return param;
      }
    }
  }
}

export function parseFunctionParams(
  abiFunction: AbiFunction,
  inputs: any[],
  isRead: boolean,
) {
  let parsedInputs: any[] = [];

  //check inputs length
  if (abiFunction.inputs.length !== inputs.length) {
    return inputs;
  }

  inputs.forEach((input, idx) => {
    const paramType = abiFunction.inputs[idx].type;
    parsedInputs.push(parseParamWithType(paramType, input, isRead));
  });
  return parsedInputs;
}

function parseTuple(value: string): string[] {
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
      return parseParamWithType(valueType, value, true);
    })
    .join(",");

  return `(${values})`;
}

function stringToObjectTuple(
  tupleString: string,
  paramType: string,
): { [key: number]: any } {
  const values = parseTuple(tupleString);
  const types = parseTuple(paramType);

  const obj: { [key: number]: any } = {};
  values.forEach((value, index) => {
    obj[index] = parseParamWithType(types[index], value, false);
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
