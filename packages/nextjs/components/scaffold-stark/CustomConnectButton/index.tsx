"use client";
import { useEffect, useMemo, useState } from "react";
import { useConnect, useNetwork } from "@starknet-react/core";
import { Address } from "@starknet-react/chains";
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
  const { connector } = useConnect();
  const { targetNetwork } = useTargetNetwork();
  const { chain } = useNetwork();
  const { account, status, address: accountAddress } = useAccount();
  const wasDisconnectedManually = useReadLocalStorage<boolean>(
    "wasDisconnectedManually",
  );
  const [accountChainId, setAccountChainId] = useState<bigint>(0n);

  const blockExplorerAddressLink = useMemo(() => {
    return accountAddress
      ? getBlockExplorerAddressLink(targetNetwork, accountAddress)
      : "";
  }, [accountAddress, targetNetwork]);

  // effect to get chain id and address from account
  useEffect(() => {
    const getChainId = async () => {
      try {
        if (account?.channel?.getChainId) {
          const chainId = await account.channel.getChainId();
          setAccountChainId(BigInt(chainId));
        } else if (chain?.id) {
          setAccountChainId(BigInt(chain.id));
        }
      } catch (err) {
        console.error("Failed to get chainId:", err);
      }
    };

    getChainId();
  }, [account, status, chain?.id]);

  useEffect(() => {
    const handleChainChange = (event: { chainId?: bigint }) => {
      const { chainId } = event;
      if (chainId && chainId !== accountChainId) {
        setAccountChainId(chainId);
      }
    };
    connector?.on("change", handleChainChange);
    return () => {
      connector?.off("change", handleChainChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  if (status === "disconnected" || wasDisconnectedManually) {
    return <ConnectModal />;
  }

  const isLoading =
    status === "connected" &&
    (!accountAddress || !chain?.name || accountChainId === 0n);

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

  if (accountChainId !== targetNetwork.id) {
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
        ensAvatar=""
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal
        address={accountAddress as Address}
        modalId="qrcode-modal"
      />
    </>
  );
};
