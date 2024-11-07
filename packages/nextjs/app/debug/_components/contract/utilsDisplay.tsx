import { ReactElement } from "react";
import { CairoCustomEnum, getChecksumAddress, Uint256 } from "starknet";
import { Address } from "~~/components/scaffold-stark";
import { replacer } from "~~/utils/scaffold-stark/common";
import { AbiOutput } from "~~/utils/scaffold-stark/contract";
import {
  isCairoByteArray,
  isCairoContractAddress,
  isCairoTuple,
  parseGenericType,
} from "~~/utils/scaffold-stark/types";
import { formatEther } from "ethers";

type DisplayContent =
  | Uint256
  | string
  | bigint
  | boolean
  | Object
  | DisplayContent[]
  | unknown;

// each error will have its own key
export type FormErrorMessageState = Record<string, string>;

export function addError(
  state: FormErrorMessageState,
  key: string,
  message: string,
): FormErrorMessageState {
  return {
    ...state,
    [key]: message,
  };
}

export function clearError(
  state: FormErrorMessageState,
  key: string,
): FormErrorMessageState {
  delete state[key];
  return state;
}

export function isError(state: FormErrorMessageState): boolean {
  return Object.values(state).filter((value) => !!value).length > 0;
}

export function getTopErrorMessage(state: FormErrorMessageState): string {
  if (!isError(state)) return "";
  return Object.values(state).filter((value) => !!value)[0];
}

export const displayTxResult = ({
  displayContent,
  asText,
  functionOutputs = [],
  contentType,
}: {
  displayContent: DisplayContent | DisplayContent[];
  asText: boolean;
  functionOutputs?: readonly AbiOutput[];

  // for recursive parsing such as arrays and objects
  contentType?: string;
}): string | ReactElement | number => {
  if (displayContent == null) {
    return "";
  }

  if (functionOutputs !== null && functionOutputs.length !== 0) {
    if (displayContent instanceof CairoCustomEnum) {
      return JSON.stringify(
        { [displayContent.activeVariant()]: displayContent.unwrap() },
        replacer,
      );
    }

    const type = contentType ?? functionOutputs[0].type;
    const parsedParam = displayContent as any;

    if (Array.isArray(parsedParam)) {
      // handle contract address
      const arrayGenericType = parseGenericType(type)[0];

      // not clean, workaround just to get contract addresses displayed properly
      if (isCairoContractAddress(arrayGenericType)) {
        return JSON.stringify(
          parsedParam.map((addressInBigInt) =>
            getChecksumAddress(`0x${addressInBigInt.toString(16)}`),
          ),
        );
      }

      const displayable = JSON.stringify(
        parsedParam.map((v) => {
          const txResult = displayTxResultAsText(v, arrayGenericType);
          if (typeof txResult === "string")
            return txResult.replaceAll('"', "").replaceAll("\n", "");
          return txResult;
        }),
        replacer,
      );

      return asText ? (
        displayable
      ) : (
        <span style={{ overflowWrap: "break-word", width: "100%" }}>
          {displayable}
        </span>
      );
    }

    if (typeof parsedParam === "object" && !Array.isArray(parsedParam))
      return JSON.stringify(parsedParam, replacer);

    if (isCairoContractAddress(type)) {
      return asText ? (
        // BigNumberish here if you look at the code, the tostring method does not work properly
        getChecksumAddress(`0x${parsedParam.toString(16)}`)
      ) : (
        <Address address={`0x${parsedParam.toString(16)}` as `0x${string}`} />
      );
    }

    if (typeof parsedParam === "bigint") {
      if (
        parsedParam <= BigInt(Number.MAX_SAFE_INTEGER) &&
        parsedParam >= BigInt(Number.MIN_SAFE_INTEGER)
      ) {
        return Number(parsedParam);
      } else {
        return "Ξ " + formatEther(parsedParam);
      }
    }

    if (isCairoTuple(type)) {
      return parsedParam;
    }

    // use quotation for byte arrays to prevent confusion
    if (isCairoByteArray(type)) {
      return `"${parsedParam.toString()}"`;
    }

    return parsedParam.toString();
  }

  return JSON.stringify(displayContent, replacer, 2);
};

export const displayTuple = (tupleString: string): string => {
  return tupleString.replace(/\w+::/g, "");
};

export const displayType = (type: string) => {
  // render tuples
  if (type.at(0) === "(") {
    return displayTuple(type);
  }

  // arrays and options
  else if (type.includes("core::array") || type.includes("core::option")) {
    const kindOfArray = type.split("::").at(2);
    const parsed = parseGenericType(type);
    const arrayType = Array.isArray(parsed)
      ? parsed[0].split("::").pop()
      : `(${parsed
          .split(",")
          .map((t) => t.split("::").pop())
          .join(",")}`;
    return `${kindOfArray}<${arrayType}>`;
  }

  // result enum
  else if (type.includes("core::result")) {
    const types = type.split("::");
    return `${types.at(-4)}<${types.at(-2)?.split(",").at(0)},${types.at(-1)}`;
  } else if (type.includes("::")) {
    return type.split("::").pop();
  }
  return type;
};

const displayTxResultAsText = (
  displayContent: DisplayContent,
  contentType?: string,
) => displayTxResult({ displayContent, asText: true, contentType });
