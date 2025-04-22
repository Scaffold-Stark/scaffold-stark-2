"use client";

import { useState } from "react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { mintStrk } from "~~/services/web3/faucet";
import { Address, devnet } from "@starknet-react/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";
import { useAccount } from "~~/hooks/useAccount";

// Number of STRK faucet sends to an address
const NUM_OF_STRK = "1";

/**
 * FaucetButton button which lets you grab strk.
 */
export const FaucetButton = () => {
  const { address } = useAccount();
  const { value } = useScaffoldStrkBalance({ address });

  const { targetNetwork } = useTargetNetwork();

  const [loading, setLoading] = useState(false);

  const sendSTRK = async () => {
    if (!address) {
      return;
    }

    try {
      setLoading(true);
      await mintStrk(address as Address, NUM_OF_STRK);
      setLoading(false);
    } catch (error) {
      console.error("⚡️ ~ file: FaucetButton.tsx:sendSTRK ~ error", error);
      setLoading(false);
    }
  };

  // Render only on local chain
  if (targetNetwork.id !== devnet.id || address == undefined) {
    return null;
  }

  const isBalanceZero = value && value === 0n;

  return (
    <div
      className={
        !isBalanceZero
          ? "ml-1"
          : "ml-1 tooltip tooltip-bottom tooltip-secondary tooltip-open font-bold before:left-auto before:transform-none before:content-[attr(data-tip)] before:right-0"
      }
      data-tip="Grab funds from faucet"
    >
      <button
        className="btn btn-secondary btn-sm px-2 rounded-full"
        onClick={sendSTRK}
        disabled={loading}
      >
        {!loading ? (
          <BanknotesIcon className="h-4 w-4" />
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};
