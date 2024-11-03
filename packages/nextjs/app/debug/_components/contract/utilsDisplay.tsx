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

export const displayTxResult = (
  displayContent: DisplayContent | DisplayContent[],
  asText: boolean,
  functionOutputs: readonly AbiOutput[] = [],
): string | ReactElement | number => {
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

    const type = functionOutputs[0].type;
    const parsedParam = displayContent as any;

    if (typeof parsedParam === "object")
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

    if (Array.isArray(parsedParam)) {
      const mostReadable = (v: DisplayContent) =>
        ["number", "boolean"].includes(typeof v) ? v : displayTxResultAsText(v);
      const displayable = JSON.stringify(
        parsedParam.map(mostReadable),
        replacer,
      );

      return asText ? (
        displayable
      ) : (
        <span style={{ overflowWrap: "break-word", width: "100%" }}>
          {displayable.replaceAll(",", ",\n")}
        </span>
      );
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

const displayTxResultAsText = (displayContent: DisplayContent) =>
  displayTxResult(displayContent, true);
