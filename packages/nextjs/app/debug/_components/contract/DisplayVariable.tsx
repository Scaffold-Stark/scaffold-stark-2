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
  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useReadContract({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: [...abi],
    blockIdentifier: "pending" as BlockNumber, // TODO : notify when failed - add error
  });

  const { showAnimation } = useAnimationConfig(result);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // error logging
  useEffect(() => {
    if (error) {
      console.error(error?.message);
      console.error(error.stack);
    }
  }, [error]);

  useEffect(() => {
    refetch();
  }, [refetch, refreshDisplayVariables]);

  return (
    <div className="space-y-1 pb-2">
      <div className="flex items-center">
        <h3
          className={`mb-0 break-all text-lg font-medium ${isDarkMode ? "text-[#4DB4FF]" : "text-[#7800FF]"}`}
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
      <div className="flex flex-col items-start font-medium text-neutral">
        <div>
          <div
            className={`block break-all bg-transparent transition ${
              showAnimation ? "animate-pulse-fast rounded-sm bg-warning" : ""
            }`}
          >
            {decodeContractResponse({
              resp: result,
              abi,
              functionOutputs: abiFunction?.outputs,
              asText: true,
              showAsString: true,
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
