"use client";
import { Connector, useConnect } from "@starknet-react/core";
import { useRef, useState } from "react";
import Wallet from "~~/components/scaffold-stark/CustomConnectButton/Wallet";
import { useLocalStorage } from "usehooks-ts";
import { burnerAccounts } from "~~/utils/devnetAccounts";
import { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";
import { useTheme } from "next-themes";
import { BlockieAvatar } from "../scaffold-stark/BlockieAvatar";
const loader = ({ src }: { src: string }) => {
  return src;
};

function ConnectWallets() {
  const modalRef = useRef<HTMLInputElement>(null);
  const [isBurnerWallet, setIsBurnerWallet] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const { connectors, connect, error, status, ...props } = useConnect();

  const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
    {
      initializeWithValue: false,
    },
  );

  const handleCloseModal = () => {
    if (modalRef.current) {
      modalRef.current.checked = false;
    }
  };

  function handleConnectWallet(
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector,
  ): void {
    if (connector.id === "burner-wallet") {
      setIsBurnerWallet(true);
      return;
    }
    connect({ connector });
    setLastConnector({ id: connector.id });
    handleCloseModal();
  }

  function handleConnectBurner(
    e: React.MouseEvent<HTMLButtonElement>,
    ix: number,
  ) {
    const connector = connectors.find(
      (it) => it.id == "burner-wallet",
    ) as BurnerConnector;
    if (connector) {
      connector.burnerAccount = burnerAccounts[ix];
      connect({ connector });
      setLastConnector({ id: connector.id, ix });
      handleCloseModal();
    }
  }
  return (
    <div>
      <div className="flex flex-1 flex-col lg:grid">
        <div className="flex w-full flex-col gap-4 px-8 py-10">
          {!isBurnerWallet ? (
            connectors.map((connector, index) => (
              <Wallet
                key={connector.id || index}
                connector={connector}
                loader={loader}
                handleConnectWallet={handleConnectWallet}
              />
            ))
          ) : (
            <div className="flex flex-col justify-end gap-3 pb-[20px]">
              <div className="flex h-[300px] w-full flex-col gap-2 overflow-y-auto">
                {burnerAccounts.map((burnerAcc, ix) => (
                  <div
                    key={burnerAcc.publicKey}
                    className="flex w-full flex-col"
                  >
                    <button
                      className={`hover:bg-gradient-modal flex items-center gap-4 rounded-md border py-[8px] pl-[10px] pr-16 text-neutral ${isDarkMode ? "border-[#385183]" : ""}`}
                      onClick={(e) => handleConnectBurner(e, ix)}
                    >
                      <BlockieAvatar
                        address={burnerAcc.accountAddress}
                        size={35}
                      />
                      {`${burnerAcc.accountAddress.slice(0, 6)}...${burnerAcc.accountAddress.slice(-4)}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectWallets;
