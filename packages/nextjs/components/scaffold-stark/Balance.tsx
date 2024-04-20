"use client";

import { useEffect, useState } from "react";
import { Address } from "@starknet-react/chains";
import { useContractRead } from "@starknet-react/core";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import ethAbi from "~~/utils/ethAbi";
import { BlockNumber } from "starknet";

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
  const { targetNetwork } = useTargetNetwork();
  const [balance, setBalance] = useState("0");
  const [displayUsdMode, setDisplayUsdMode] = useState(
    price > 0 ? Boolean(usdMode) : false,
  );

  const { data, isLoading, isError } = useContractRead({
    address:
      "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7",
    watch: true,
    abi: ethAbi,
    functionName: "balanceOf",
    args: [address as string],
    blockIdentifier: "pending" as BlockNumber,
  });

  useEffect(() => {
    // @ts-ignore
    if (data && data.balance.low !== undefined) {
      // @ts-ignore
      const lowValueStr = data.balance.low.toString(); // Convert bigint to string
      const len = lowValueStr.length;

      let formattedValue;
      if (len > 18) {
        // More than 18 digits, so decimal point is not at the start
        formattedValue =
          lowValueStr.slice(0, len - 18) + "." + lowValueStr.slice(len - 18);
      } else {
        // Less than or equal to 18 digits, need to pad with zeros
        formattedValue = "0." + "0".repeat(18 - len) + lowValueStr;
      }

      // Round the string number to 4 decimal places after moving the decimal point
      const roundedValue = parseFloat(formattedValue).toFixed(4);
      setBalance(roundedValue); // Update state with formatted value
    }
  }, [data]);

  const toggleBalanceMode = () => {
    if (price > 0) {
      setDisplayUsdMode((prevMode) => !prevMode);
    }
  };

  if (!address || isLoading || balance === null) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`border-2 border-gray-400 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer`}
      >
        <div className="text-warning">Error</div>
      </div>
    );
  }

  //const formattedBalance = balance ? Number(balance.formatted) : 0;

  return (
    <button
      className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}
      onClick={toggleBalanceMode}
    >
      <div className="w-full flex items-center justify-center">
        {displayUsdMode ? (
          <>
            <span className="text-[0.8em] font-bold mr-1">$</span>
            <span>
              {(parseInt(balance) * price).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </>
        ) : (
          <>
            <span>{balance}</span>
            <span className="text-[0.8em] font-bold ml-1">
              {targetNetwork.nativeCurrency.symbol}
            </span>
          </>
        )}
      </div>
    </button>
  );
};
