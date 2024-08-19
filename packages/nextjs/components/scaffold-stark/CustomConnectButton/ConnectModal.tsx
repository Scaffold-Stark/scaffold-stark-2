import Image from "next/image";
import GenericModal from "./GenericModal";
import { Connector, useConnect } from "@starknet-react/core";
import React, { useEffect, useState } from "react";
import Wallet from "~~/components/scaffold-stark/CustomConnectButton/Wallet";
import { useLocalStorage } from "usehooks-ts";
import { burnerAccounts } from "~~/utils/devnetAccounts";
import { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";
import { useTheme } from "next-themes";
import { BlockieAvatar } from "../BlockieAvatar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const loader = ({ src }: { src: string }) => {
  return src;
};

const ConnectModal = ({ isOpen, onClose }: Props) => {
  const [animate, setAnimate] = useState(false);
  const [isBurnerWallet, setIsBurnerWallet] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const closeModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnimate(false);
    setTimeout(() => {
      onClose();
    }, 400);
    setIsBurnerWallet(false);
  };

  useEffect(() => setAnimate(isOpen), [isOpen]);

  const { connectors, connect } = useConnect();

  const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
    {
      initializeWithValue: false,
    }
  );

  function handleConnectWallet(
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector
  ): void {
    if (connector.id === "burner-wallet") {
      setIsBurnerWallet(true);
      return;
    }

    connect({ connector });
    setLastConnector({ id: connector.id });
    closeModal(e);
  }

  function handleConnectBurner(
    e: React.MouseEvent<HTMLButtonElement>,
    ix: number
  ) {
    const connector = connectors.find(
      (it) => it.id == "burner-wallet"
    ) as BurnerConnector;
    if (connector) {
      connector.burnerAccount = burnerAccounts[ix];
      connect({ connector });
      setLastConnector({ id: connector.id, ix });
      closeModal(e);
    }
  }

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={closeModal}
      animate={animate}
      className={`w-[90vw] mx-auto md:max-h-[30rem] md:max-w-[25rem] bg-background border border-border pb-4`}
    >
      <div className="flex p-4 w-full lg:p-0 ">
        <div className="basis-5/6 lg:col-span-2   lg:py-4 lg:pl-8">
          <h2 className="text-center my-4 lg:text-start font-bold text-base-100 text-[1.125em]">
            Connect a Wallet
          </h2>
        </div>
        <div className="ml-auto lg:col-span-3 lg:py-4 lg:pr-8 text-base-100 self-center">
          <button
            onClick={(e) => {
              closeModal(e);
              e.stopPropagation();
            }}
            className="w-8 h-8 grid place-content-center rounded-full text-neutral"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 justify-between  ">
        <div className="px-8 lg:h-full lg:col-span-2  ">
          {/*  <h4 className="mb-[1rem] text-base-100 font-semibold">Popular</h4> */}
          <div className="flex flex-col gap-4 ">
            {connectors.map((connector, index) => (
              <Wallet
                key={connector.id || index}
                connector={connector}
                loader={loader}
                handleConnectWallet={handleConnectWallet}
              />
            ))}
          </div>
        </div>
      </div>
    </GenericModal>
  );
};

export default ConnectModal;
