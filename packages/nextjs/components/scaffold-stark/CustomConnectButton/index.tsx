"use client";
import { useMemo } from "react";
import { useNetwork } from "@starknet-start/react";
import { Address } from "@starknet-start/chains";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import ConnectModal from "./ConnectModal";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { useAutoConnect, useNetworkColor } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useAccount } from "~~/hooks/useAccount";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-stark";
import { useReadLocalStorage } from "usehooks-ts";

export const CustomConnectButton = () => {
  useAutoConnect();
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const { chain } = useNetwork();
  const { status, address: accountAddress, chainId: accountChainId } = useAccount();
  const wasDisconnectedManually = useReadLocalStorage<boolean>(
    "wasDisconnectedManually",
  );

  const blockExplorerAddressLink = useMemo(() => {
    return accountAddress
      ? getBlockExplorerAddressLink(targetNetwork, accountAddress)
      : "";
  }, [accountAddress, targetNetwork]);

  if (status === "disconnected" || wasDisconnectedManually) {
    return <ConnectModal />;
  }

  const isLoading =
    status === "connected" &&
    (!accountAddress || !chain?.name || !accountChainId);

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="w-36 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
      >
        &nbsp;
      </button>
    );
  }

  // Skip wrong network check for devnet-like networks (devnet and mainnetFork)
  // since the RPC may return a different chain ID than the configured one
  const isDevnetLike = targetNetwork.network === "devnet";
  if (!isDevnetLike && accountChainId !== targetNetwork.id) {
    return <WrongNetworkDropdown />;
  }

  return (
    <>
      <div className="flex flex-col items-center max-sm:mt-2">
        <Balance
          address={accountAddress as Address}
          className="min-h-0 h-auto"
        />
        <span className="text-xs ml-1" style={{ color: networkColor }}>
          {chain.name}
        </span>
      </div>
      <AddressInfoDropdown
        address={accountAddress as Address}
        displayName=""
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal
        address={accountAddress as Address}
        modalId="qrcode-modal"
      />
    </>
  );
};
