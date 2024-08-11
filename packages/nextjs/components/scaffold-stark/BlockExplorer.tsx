"use client";

import { Address as AddressType, mainnet } from "@starknet-react/chains";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNetwork } from "@starknet-react/core";
import Image from "next/image";

export const BlockExplorer = () => {
  const { chain: ConnectedChain } = useNetwork();

  const blockExplorers = [
    {
      name: "Starkscan",
      img: "/sn-symbol-gradient.png",
      link: "https://starkscan.co/",
    },
    {
      name: "Voyager",
      img: "/voyager-icon.svg",
      link: "https://voyager.online/",
    },
    {
      name: "Stark Compass",
      img: "/starkcompass-icon.svg",
      link: "https://starkcompass.com/",
    },
  ];

  // Render only on mainnet chain
  if (ConnectedChain?.id !== mainnet.id) {
    return null;
  }

  return (
    <div>
      <label
        htmlFor="blockexplorer-modal"
        className="btn btn-sm font-normal gap-1 border border-[#32BAC4] shadow-none"
      >
        <MagnifyingGlassIcon className="h-4 w-4 text-[#32BAC4]" />
        <span>Block Explorer</span>
      </label>
      <input
        type="checkbox"
        id="blockexplorer-modal"
        className="modal-toggle"
      />
      <label htmlFor="blockexplorer-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">Mainnet Block Explorers</h3>
          <label
            htmlFor="blockexplorer-modal"
            className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
          >
            ✕
          </label>
          <div className="mb-4 mt-6">
            <div className="flex flex-col space-y-3">
              {blockExplorers.length &&
                blockExplorers.map((blockexplorer, id) => (
                  <a
                    href={blockexplorer.link}
                    target="_blank"
                    className="h-12 btn btn-primary flex justify-start btn-sm px-6 gap-4 rounded-full"
                    key={id}
                  >
                    <div className="flex relative w-6 h-6">
                      <Image
                        alt="Starknet Developers Hub"
                        className="cursor-pointer"
                        fill
                        src={blockexplorer.img}
                      />
                    </div>
                    <p className="text-sm m-0">{blockexplorer.name}</p>
                  </a>
                ))}
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
