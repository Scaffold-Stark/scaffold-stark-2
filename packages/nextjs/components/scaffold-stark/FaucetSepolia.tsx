"use client";

import { useEffect, useMemo, useState } from "react";
import { Address as AddressType, sepolia } from "@starknet-react/chains";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useNetwork } from "@starknet-react/core";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { RpcProvider } from "starknet";
import { notification } from "~~/utils/scaffold-stark";
import Image from "next/image";

/**
 * Faucet modal which displays external websites that lets you send small amounts of L2 Sepolia ETH/STRK to an account address on Starknet Sepolia..
 */
export const FaucetSepolia = () => {
  const { chain: ConnectedChain } = useNetwork();
  const { targetNetwork } = useTargetNetwork();

  const sepoliaFaucets = [
    {
      name: "Starknet Foundation",
      img: "/sn-symbol-gradient.png",
      link: "https://starknet-faucet.vercel.app/",
    },
    {
      name: "Alchemy",
      img: "/logo_alchemy.png",
      link: "https://www.alchemy.com/faucets/starknet-sepolia",
    },
    {
      name: "Blast",
      img: "/blast-icon-color.svg",
      link: "https://blastapi.io/faucets/starknet-sepolia-eth",
    },
  ];

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

  // Render only on sepolia chain
  if (ConnectedChain?.id !== sepolia.id) {
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
          <h3 className="text-xl font-bold mb-3">Sepolia Faucets</h3>
          <p className="text-xs mb-6">
            <span className="font-medium underline">Disclaimer:</span>
            <br /> Please note that these external websites are provided for
            your convenience. We do not have control over the content and
            availability of these sites. Use at your own risk.
          </p>
          <label
            htmlFor="faucet-modal"
            className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
          >
            ✕
          </label>
          <div className="mb-4">
            <div className="flex flex-col space-y-3">
              {sepoliaFaucets.length &&
                sepoliaFaucets.map((faucet, id) => (
                  <a
                    href={faucet.link}
                    target="_blank"
                    className="h-12 btn btn-primary flex justify-start btn-sm px-6 gap-4 rounded-full"
                    key={id}
                  >
                    <div className="flex relative w-6 h-6">
                      <Image
                        alt="Starknet Developers Hub"
                        className="cursor-pointer"
                        fill
                        src={faucet.img}
                      />
                    </div>
                    <p className="text-sm m-0">{faucet.name}</p>
                  </a>
                ))}
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
