import { ReactElement } from "react";
import { ByteArray, byteArray } from "starknet-dev";
import {
  Uint256,
  validateAndParseAddress,
  validateChecksumAddress,
} from "starknet";
import { Address } from "~~/components/scaffold-stark";
import { feltToHex, replacer } from "~~/utils/scaffold-stark/common";
import { AbiOutput } from "~~/utils/scaffold-stark/contract";

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
    if (
      functionOutputs[0].type ===
      "core::starknet::contract_address::ContractAddress"
    ) {
      const address = validateAndParseAddress(displayContent as string);
      return asText ? address : <Address address={address as `0x${string}`} />;
    } else if (functionOutputs[0].type === "core::byte_array::ByteArray") {
      return byteArray.stringFromByteArray(displayContent as ByteArray);
    } else if (functionOutputs[0].type === "core::felt252") {
      return feltToHex(displayContent as bigint);
    }
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

  return JSON.stringify(displayContent, replacer, 2);
};

export const displayType = (type: string) => {
  if (!type.includes("::")) {
    return type;
  }
  return type.split("::").pop();
};
const displayTxResultAsText = (displayContent: DisplayContent) =>
  displayTxResult(displayContent, true);
