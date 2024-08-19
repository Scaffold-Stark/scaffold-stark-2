"use client";

import { useEffect, useMemo, useState } from "react";
import { Address as AddressType, devnet } from "@starknet-react/chains";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import {
  Address,
  AddressInput,
  Balance,
  EtherInput,
} from "~~/components/scaffold-stark";
import { useNetwork } from "@starknet-react/core";
import { mintEth } from "~~/services/web3/faucet";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { RpcProvider } from "starknet";
import { notification } from "~~/utils/scaffold-stark";

/**
 * Faucet modal which lets you send ETH to any address.
 */
export const Faucet = () => {
  const [loading, setLoading] = useState(false);
  const [inputAddress, setInputAddress] = useState<AddressType>();
  const [faucetAddress] = useState<AddressType>(
    "0x78662e7352d062084b0010068b99288486c2d8b914f6e2a55ce945f8792c8b1",
  );
  const [sendValue, setSendValue] = useState("");

  const { chain: ConnectedChain } = useNetwork();
  const { targetNetwork } = useTargetNetwork();

  const publicNodeUrl = targetNetwork.rpcUrls.public.http[0];

  // Use useMemo to memoize the publicClient object
  const publicClient = useMemo(() => {
    return new RpcProvider({
      nodeUrl: publicNodeUrl,
    });
  }, [publicNodeUrl]);

  useEffect(() => {
    const checkChain = async () => {
      try {
        const providerInfo = await publicClient.getBlock();
      } catch (error) {
        console.error("⚡️ ~ file: Faucet.tsx:checkChain ~ error", error);
        notification.error(
          <>
            <p className="font-bold mt-0 mb-1">
              Cannot connect to local provider
            </p>
            <p className="m-0">
              - Did you forget to run{" "}
              <code className="italic bg-base-300 text-base font-bold">
                yarn chain
              </code>{" "}
              ?
            </p>
            <p className="mt-1 break-normal">
              - Or you can change{" "}
              <code className="italic bg-base-300 text-base font-bold">
                targetNetwork
              </code>{" "}
              in{" "}
              <code className="italic bg-base-300 text-base font-bold">
                scaffold.config.ts
              </code>
            </p>
          </>,
          {
            duration: 5000,
          },
        );
      }
    };
    checkChain().then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendETH = async () => {
    if (!faucetAddress || !inputAddress) {
      return;
    }

    const res = await mintEth(inputAddress, sendValue);
    if (!res.new_balance) {
      setLoading(false);
      notification.error(`${res}`);
      return;
    }
    setLoading(false);
    setInputAddress(undefined);
    setSendValue("");
    notification.success("ETH sent successfully!");
  };

  // Render only on local chain
  if (ConnectedChain?.id !== devnet.id) {
    return null;
  }

  return (
    <div>
      <label
        htmlFor="faucet-modal"
        className="btn btn-sm font-normal gap-1 border border-[#32BAC4] shadow-none"
      >
        <BanknotesIcon className="h-4 w-4 text-[#32BAC4]" />
        <span>Faucet</span>
      </label>
      <input type="checkbox" id="faucet-modal" className="modal-toggle" />
      <label htmlFor="faucet-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">Local Faucet</h3>
          <label
            htmlFor="faucet-modal"
            className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
          >
            ✕
          </label>
          <div className="space-y-3 mt-6">
            <div className="flex flex-col space-y-3">
              <AddressInput
                placeholder="Destination Address"
                value={inputAddress ?? ""}
                onChange={(value) => setInputAddress(value as AddressType)}
              />
              <EtherInput
                placeholder="Amount to send"
                value={sendValue}
                onChange={(value) => setSendValue(value)}
              />
              <button
                className="h-10 btn btn-primary btn-sm px-2 rounded-full"
                onClick={sendETH}
                disabled={loading}
              >
                {!loading ? (
                  <BanknotesIcon className="h-6 w-6" />
                ) : (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
