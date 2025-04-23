"use client";

import { useState } from "react";
import { Address } from "@starknet-react/chains";
import { useGlobalState } from "~~/services/store/store";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";

type BalanceProps = {
  address?: Address;
  className?: string;
  usdMode?: boolean;
};

/**
 * Display (STRK & USD) balance of an address.
 */
export const Balance = ({ address, className = "", usdMode }: BalanceProps) => {
  const strkPrice = useGlobalState((state) => state.nativeCurrencyPrice);
  const {
    formatted: strkFormatted,
    isLoading: strkIsLoading,
    isError: strkIsError,
    symbol: strkSymbol,
  } = useScaffoldStrkBalance({
    address,
  });
  const [displayUsdMode, setDisplayUsdMode] = useState(
    strkPrice > 0 ? Boolean(usdMode) : false,
  );

  const toggleBalanceMode = () => {
    if (strkPrice > 0) {
      setDisplayUsdMode((prevMode) => !prevMode);
    }
  };

  if (!address || strkIsLoading || strkFormatted === null) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (strkIsError) {
    return (
      <div
        className={`border-2 border-gray-400 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer`}
      >
        <div className="text-warning">Error</div>
      </div>
    );
  }

  // Calculate the balance in USD
  const strkBalanceInUsd = parseFloat(strkFormatted) * strkPrice;

  return (
    <>
      <button
        className={` btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}
        onClick={toggleBalanceMode}
      >
        <div className="w-full flex items-center justify-center">
          {displayUsdMode ? (
            <div className="flex">
              <span className="text-[0.8em] font-bold mr-1">$</span>
              <span>
                {strkBalanceInUsd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ) : (
            <div className="flex">
              <span>{parseFloat(strkFormatted).toFixed(4)}</span>
              <span className="text-[0.8em] font-bold ml-1">{strkSymbol}</span>
            </div>
          )}
        </div>
      </button>
    </>
  );
};
