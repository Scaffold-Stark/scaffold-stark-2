"use client";

import { useEffect } from "react";
// import { InheritanceTooltip } from "./InheritanceTooltip";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAnimationConfig } from "~~/hooks/scaffold-stark";
import { AbiFunction } from "~~/utils/scaffold-stark/contract";
import { Abi } from "abi-wan-kanabi";
import { Address } from "@starknet-react/chains";
import { useReadContract } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { decodeContractResponse } from "./utilsDisplay";
import { useTheme } from "next-themes";

const ETH_ADDRESS =
  "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const STRK_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

const TOKEN_INFO: Record<string, { name: string; symbol: string }> = {
  [ETH_ADDRESS]: {
    name: "Ether",
    symbol: "ETH",
  },
  [STRK_ADDRESS]: {
    name: "Stark Token",
    symbol: "STRK",
  },
};

type DisplayVariableProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  refreshDisplayVariables: boolean;
  //   inheritedFrom?: string;
  abi: Abi;
};

export const DisplayVariable = ({
  contractAddress,
  abiFunction,
  refreshDisplayVariables,
  abi, //   inheritedFrom,
}: DisplayVariableProps) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const isPredeployedTokenNameOrSymbol =
    (contractAddress.toLowerCase() === ETH_ADDRESS.toLowerCase() ||
      contractAddress.toLowerCase() === STRK_ADDRESS.toLowerCase()) &&
    (abiFunction.name === "name" || abiFunction.name === "symbol");

  if (isPredeployedTokenNameOrSymbol) {
    const tokenInfo =
      TOKEN_INFO[
        ETH_ADDRESS.toLowerCase() === contractAddress.toLowerCase()
          ? ETH_ADDRESS
          : STRK_ADDRESS
      ];
    const value =
      abiFunction.name === "name" ? tokenInfo.name : tokenInfo.symbol;

    return (
      <div className="space-y-1 pb-2">
        <div className="flex items-center">
          <h3
            className={`font-medium text-lg mb-0 break-all ${
              isDarkMode ? "text-[#4DB4FF]" : "text-[#7800FF]"
            }`}
          >
            {abiFunction.name}
          </h3>
          <button className="btn btn-ghost btn-xs">
            <ArrowPathIcon
              className="h-3 w-3 cursor-pointer"
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="text-neutral font-medium flex flex-col items-start">
          <div>
            <div className="break-all block transition bg-transparent">
              {value}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
    error,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: [...abi],
    blockIdentifier: "pending" as BlockNumber, // TODO : notify when failed - add error
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { showAnimation } = useAnimationConfig(result);

  // error logging
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (error) {
      console.error(error?.message);
      console.error(error.stack);
    }
  }, [error]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    refetch();
  }, [refetch, refreshDisplayVariables]);

  return (
    <div className="space-y-1 pb-2">
      <div className="flex items-center">
        <h3
          className={`font-medium text-lg mb-0 break-all ${
            isDarkMode ? "text-[#4DB4FF]" : "text-[#7800FF]"
          }`}
        >
          {abiFunction.name}
        </h3>
        <button
          className="btn btn-ghost btn-xs"
          onClick={async () => await refetch()}
        >
          {!isLoading && isFetching ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <ArrowPathIcon
              className="h-3 w-3 cursor-pointer"
              aria-hidden="true"
            />
          )}
        </button>
        {/* <InheritanceTooltip inheritedFrom={inheritedFrom} /> */}
      </div>
      <div className="text-neutral font-medium flex flex-col items-start">
        <div>
          <div
            className={`break-all block transition bg-transparent ${
              showAnimation ? "bg-warning rounded-xs animate-pulse-fast" : ""
            }`}
          >
            {decodeContractResponse({
              resp: result,
              abi,
              functionOutputs: abiFunction?.outputs,
              asText: true,
              showAsString: false,
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
