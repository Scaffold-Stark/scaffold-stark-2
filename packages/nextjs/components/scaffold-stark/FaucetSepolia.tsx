"use client";

import { useEffect } from "react";
import { sepolia } from "@starknet-react/chains";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useNetwork, useProvider } from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";
import Image from "next/image";
import GenericModal from "./CustomConnectButton/GenericModal";
import { useTheme } from "next-themes";

/**
 * Faucet modal which displays external websites that lets you send small amounts of L2 Sepolia ETH/STRK to an account address on Starknet Sepolia..
 */
export const FaucetSepolia = () => {
  const { chain: ConnectedChain } = useNetwork();

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

  const { provider: publicClient } = useProvider();
  useEffect(() => {
    const checkChain = async () => {
      try {
        const providerInfo = await publicClient.getBlock();
      } catch (error) {
        console.error("⚡️ ~ file: Faucet.tsx:checkChain ~ error", error);
        notification.error(
          <>
            <p className="mb-1 mt-0 font-bold">
              Cannot connect to local provider
            </p>
            <p className="m-0">
              - Did you forget to run{" "}
              <code className="bg-base-300 text-base font-bold italic">
                yarn chain
              </code>{" "}
              ?
            </p>
            <p className="mt-1 break-normal">
              - Or you can change{" "}
              <code className="bg-base-300 text-base font-bold italic">
                targetNetwork
              </code>{" "}
              in{" "}
              <code className="bg-base-300 text-base font-bold italic">
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

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // Render only on sepolia chain
  if (ConnectedChain?.id !== sepolia.id) {
    return null;
  }

  return (
    <div>
      <label
        htmlFor="faucet-modal"
        className="btn btn-sm gap-1 border border-[#32BAC4] font-normal shadow-none"
      >
        <BanknotesIcon className="h-4 w-4 text-[#32BAC4]" />
        <span>Faucet</span>
      </label>
      <input type="checkbox" id="faucet-modal" className="modal-toggle" />
      <GenericModal modalId="faucet-modal">
        <>
          <div className="flex items-center justify-between">
            <h3 className="mb-3 text-xl font-bold">Sepolia Faucets</h3>
            <label
              htmlFor="faucet-modal"
              className="btn btn-circle btn-ghost btn-sm"
            >
              ✕
            </label>
          </div>
          <p className="mb-6 text-xs">
            <span className="font-medium underline">Disclaimer:</span>
            <br /> Please note that these external websites are provided for
            your convenience. We do not have control over the content and
            availability of these sites. Use at your own risk.
          </p>
          <div className="mb-4">
            <div className="flex flex-col space-y-3">
              {sepoliaFaucets.length &&
                sepoliaFaucets.map((faucet, id) => (
                  <a
                    href={faucet.link}
                    target="_blank"
                    className={`modal-border btn-sm flex h-12 items-center gap-4 rounded-[4px] px-6 transition-all ${
                      isDarkMode ? "hover:bg-[#385183]" : "hover:bg-slate-200"
                    } border`}
                    key={id}
                  >
                    <div className="relative flex h-6 w-6">
                      <Image
                        alt="Starknet Developers Hub"
                        className="cursor-pointer"
                        fill
                        sizes="1.5rem"
                        src={faucet.img}
                      />
                    </div>
                    <span className="m-0 text-sm">{faucet.name}</span>
                  </a>
                ))}
            </div>
          </div>
        </>
      </GenericModal>
    </div>
  );
};
