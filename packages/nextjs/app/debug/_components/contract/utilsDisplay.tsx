import { ReactElement } from "react";
import { CairoCustomEnum, Uint256, validateChecksumAddress } from "starknet";
import { Address } from "~~/components/scaffold-stark";
import { replacer } from "~~/utils/scaffold-stark/common";
import {
  AbiOutput,
  parseParamWithType,
} from "~~/utils/scaffold-stark/contract";
import {
  isCairoContractAddress,
  isCairoTuple,
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
  if (functionOutputs != null && functionOutputs.length != 0) {
    if (displayContent instanceof CairoCustomEnum) {
      return JSON.stringify({[displayContent.activeVariant()]: displayContent.unwrap()}, replacer);
    }

    const type = functionOutputs[0].type;
    const parsedParam = parseParamWithType(type, displayContent, true);

    if (typeof parsedParam === "object") return JSON.stringify(parsedParam, replacer);

    if (typeof parsedParam === "bigint") {
      const asNumber = Number(parsedParam);
      if (
        !isNaN(asNumber) &&
        asNumber <= Number.MAX_SAFE_INTEGER &&
        asNumber >= Number.MIN_SAFE_INTEGER
      ) {
        return asNumber;
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

    return isCairoContractAddress(type) &&
      validateChecksumAddress(parsedParam) &&
      !asText ? (
      <Address address={parsedParam as `0x${string}`} />
    ) : (
      parsedParam.toString()
    );
  }

  return JSON.stringify(displayContent, replacer, 2);
};

export const displayType = (type: string) =>
  type.includes("::") ? type.split("::").pop() : type;
const displayTxResultAsText = (displayContent: DisplayContent) =>
  displayTxResult(displayContent, true);
