import { useConnect } from "@starknet-start/react";
import type { UseConnectResult } from "@starknet-start/react";
type WalletConnector = UseConnectResult["connectors"][number];
import { useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import GenericModal from "./GenericModal";
import Wallet from "~~/components/scaffold-stark/CustomConnectButton/Wallet";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";

const loader = ({ src }: { src: string }) => src;

const ConnectModal = () => {
  const modalRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const { connectors, connect } = useConnect();
  const [, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
  );
  const [, setLastConnectionTime] = useLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
    0,
  );
  const [, setWasDisconnectedManually] = useLocalStorage<boolean>(
    "wasDisconnectedManually",
    false,
  );

  const handleCloseModal = () => {
    if (modalRef.current) modalRef.current.checked = false;
  };

  function handleConnectWallet(
    e: React.MouseEvent<HTMLButtonElement>,
    connector: WalletConnector,
  ) {
    setWasDisconnectedManually(false);
    connect({ connector });
    setLastConnector({ id: connector.name });
    setLastConnectionTime(Date.now());
    handleCloseModal();
  }

  return (
    <div>
      <label
        htmlFor="connect-modal"
        className="rounded-[18px] btn-sm  font-bold px-8 bg-btn-wallet py-3 cursor-pointer"
      >
        <span>Connect</span>
      </label>
      <input
        ref={modalRef}
        type="checkbox"
        id="connect-modal"
        className="modal-toggle"
      />
      <GenericModal modalId="connect-modal">
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Connect a Wallet</h3>
            <label
              htmlFor="connect-modal"
              className="btn btn-ghost btn-sm btn-circle cursor-pointer"
            >
              ✕
            </label>
          </div>
          <div className="flex flex-col flex-1 lg:grid">
            <div className="flex flex-col gap-4 w-full px-8 py-10">
              {connectors.map((connector, index) => (
                <Wallet
                  key={connector.name || index}
                  connector={connector}
                  loader={loader}
                  handleConnectWallet={handleConnectWallet}
                />
              ))}
            </div>
          </div>
        </>
      </GenericModal>
    </div>
  );
};

export default ConnectModal;
