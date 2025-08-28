"use client";

import {
  Address as AddressType,
  devnet,
  sepolia,
} from "@starknet-react/chains";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNetwork } from "@starknet-react/core";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const GenericModal = dynamic(
  () => import("./CustomConnectButton/GenericModal"),
  { ssr: false },
);
import { useTheme } from "next-themes";

export const BlockExplorerDevnet = () => {
  const router = useRouter();
  const { chain: ConnectedChain } = useNetwork();

  // Render only on devnet chain
  if (ConnectedChain?.id !== devnet.id) {
    return null;
  }

  return (
    <div onClick={() => router.push("/blockexplorer")}>
      <label
        htmlFor="sepolia-blockexplorer-modal"
        className="btn btn-sm font-normal gap-1 border border-[#32BAC4] shadow-none"
      >
        <MagnifyingGlassIcon className="h-4 w-4 text-[#32BAC4]" />
        <span>Block Explorer</span>
      </label>
    </div>
  );
};
