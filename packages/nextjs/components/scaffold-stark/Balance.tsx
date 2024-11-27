"use client";

import { useState } from "react";
import { Address } from "@starknet-react/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import useScaffoldEthBalance from "~~/hooks/scaffold-stark/useScaffoldEthBalance";
import { useGlobalState } from "~~/services/store/store";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";

type BalanceProps = {
  address?: Address;
  className?: string;
  usdMode?: boolean;
};

/**
 * Display (ETH & USD) balance of an ETH address.
 */
export const Balance = ({ address, className = "", usdMode }: BalanceProps) => {
  const price = useGlobalState((state) => state.nativeCurrencyPrice);
  const strkPrice = useGlobalState((state) => state.strkCurrencyPrice);
  const { targetNetwork } = useTargetNetwork();
  const { formatted, isLoading, isError } = useScaffoldEthBalance({
    address,
  });
  const {
    formatted: strkFormatted,
    isLoading: strkIsLoading,
    isError: strkIsError,
    symbol: strkSymbol,
  } = useScaffoldStrkBalance({
    address,
  });
  const [displayUsdMode, setDisplayUsdMode] = useState(
    price > 0 ? Boolean(usdMode) : false,
  );

  const toggleBalanceMode = () => {
    if (price > 0 || strkPrice > 0) {
      setDisplayUsdMode((prevMode) => !prevMode);
    }
  };

  if (
    !address ||
    isLoading ||
    formatted === null ||
    strkIsLoading ||
    strkFormatted === null
  ) {
    return (
      <div className="flex animate-pulse space-x-4">
        <div className="h-6 w-6 rounded-md bg-slate-300"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 rounded bg-slate-300"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`flex max-w-fit cursor-pointer flex-col items-center rounded-md border-2 border-gray-400 px-2`}
      >
        <div className="text-warning">Error</div>
      </div>
    );
  }

  // Calculate the total balance in USD
  const ethBalanceInUsd = parseFloat(formatted) * price;
  const strkBalanceInUsd = parseFloat(strkFormatted) * strkPrice;
  const totalBalanceInUsd = ethBalanceInUsd + strkBalanceInUsd;

  return (
    <>
      <button
        className={`btn btn-ghost btn-sm flex flex-col items-center font-normal hover:bg-transparent ${className}`}
        onClick={toggleBalanceMode}
      >
        <div className="flex w-full items-center justify-center">
          {displayUsdMode ? (
            <div className="flex">
              <span className="mr-1 text-[0.8em] font-bold">$</span>
              <span>
                {totalBalanceInUsd.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <div className="flex">
                  <span>{parseFloat(formatted).toFixed(4)}</span>
                  <span className="ml-1 text-[0.8em] font-bold">
                    {targetNetwork.nativeCurrency.symbol}
                  </span>
                </div>

                {/*  <div className="flex">
                  <span>{parseFloat(strkFormatted).toFixed(4)}</span>
                  <span className="ml-1 text-[0.8em] font-bold">
                    {strkSymbol}
                  </span>
                </div> */}
              </div>
            </>
          )}
        </div>
      </button>
    </>
  );
};
