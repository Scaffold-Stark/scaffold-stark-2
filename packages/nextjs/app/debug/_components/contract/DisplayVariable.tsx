"use client";

import { useEffect } from "react";
// import { InheritanceTooltip } from "./InheritanceTooltip";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAnimationConfig } from "~~/hooks/scaffold-stark";
import { AbiFunction } from "~~/utils/scaffold-stark/contract";
import { Abi } from "abi-wan-kanabi";
import { Address } from "@starknet-react/chains";
import { useContractRead } from "@starknet-react/core";
import { BlockNumber } from "starknet";
import { displayTxResult } from "./utilsDisplay";

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
  } = useContractRead({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: [...abi],
    blockIdentifier: "pending" as BlockNumber, // TODO : notify when failed - add error
  });

  const { showAnimation } = useAnimationConfig(result);

  useEffect(() => {
    refetch();
  }, [refetch, refreshDisplayVariables]);

  return (
    <div className="space-y-1 pb-2">
      <div className="flex items-center">
        <h3 className="font-medium text-lg mb-0 break-all">
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
      <div className="text-gray-500 font-medium flex flex-col items-start">
        <div>
          <div
            className={`break-all block transition bg-transparent ${
              showAnimation ? "bg-warning rounded-sm animate-pulse-fast" : ""
            }`}
          >
            {displayTxResult(result, false, abiFunction?.outputs)}
          </div>
        </div>
      </div>
    </div>
  );
};
