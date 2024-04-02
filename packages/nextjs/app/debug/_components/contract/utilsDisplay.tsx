import { ReactElement } from "react";
import {
  Uint256,
  validateAndParseAddress,
  validateChecksumAddress,
} from "starknet";
import { Address } from "~~/components/scaffold-stark";
import { replacer } from "~~/utils/scaffold-stark/common";

type DisplayContent =
  | Uint256
  | string
  | bigint
  | boolean
  | `0x${string}`
  | DisplayContent[]
  | unknown;

export const displayTxResult = (
  displayContent: DisplayContent | DisplayContent[],
  asText = false
): string | ReactElement | number => {
  if (displayContent == null) {
    return "";
  }

  if (typeof displayContent === "bigint") {
    try {
      const asNumber = Number(displayContent);
      if (
        asNumber <= Number.MAX_SAFE_INTEGER &&
        asNumber >= Number.MIN_SAFE_INTEGER
      ) {
        return asNumber;
      } else {
        // return "Ξ" + formatEther(displayContent); // TODO fix this
      }
    } catch (e) {
      //   return "Ξ" + formatEther(displayContent);
    }
  }

  if (
    typeof displayContent === "string" &&
    displayContent.startsWith("0x") &&
    validateChecksumAddress(displayContent)
  ) {
    return asText ? (
      displayContent
    ) : (
      <Address address={displayContent as `0x${string}`} />
    );
  }

  if (Array.isArray(displayContent)) {
    const mostReadable = (v: DisplayContent) =>
      ["number", "boolean"].includes(typeof v) ? v : displayTxResultAsText(v);
    const displayable = JSON.stringify(
      displayContent.map(mostReadable),
      replacer
    );

    return asText ? (
      displayable
    ) : (
      <span style={{ overflowWrap: "break-word", width: "100%" }}>
        {displayable.replaceAll(",", ",\n")}
      </span>
    );
  }

  return JSON.stringify(displayContent, replacer, 2);
};

const displayTxResultAsText = (displayContent: DisplayContent) =>
  displayTxResult(displayContent, true);
