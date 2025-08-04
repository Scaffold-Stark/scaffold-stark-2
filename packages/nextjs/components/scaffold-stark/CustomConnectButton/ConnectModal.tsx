import { Connector, useConnect } from "@starknet-react/core";
import { useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { BurnerConnector, burnerAccounts } from "@scaffold-stark/stark-burner";
import { useTheme } from "next-themes";
import { BlockieAvatar } from "../BlockieAvatar";
import GenericModal from "./GenericModal";
import Wallet from "~~/components/scaffold-stark/CustomConnectButton/Wallet";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";

const loader = ({ src }: { src: string }) => src;

const ConnectModal = () => {
  const modalRef = useRef<HTMLInputElement>(null);
  const [isBurnerWallet, setIsBurnerWallet] = useState(false);
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
  const { targetNetwork } = useTargetNetwork();
  const [showOtherOptions, setShowOtherOptions] = useState(false);

  // Identify devnet by network name
  const isDevnet = targetNetwork.network === "devnet";

  // Split connectors into main and other options for devnet
  let mainConnectors = connectors;
  let otherConnectors: typeof connectors = [];
  if (isDevnet) {
    mainConnectors = connectors.filter((c) => c.id === "burner-wallet");
    otherConnectors = connectors.filter((c) => c.id !== "burner-wallet");
  }

  const handleCloseModal = () => {
    if (modalRef.current) modalRef.current.checked = false;
  };

  function handleConnectWallet(
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector,
  ) {
    if (connector.id === "burner-wallet") {
      setIsBurnerWallet(true);
      return;
    }
    setWasDisconnectedManually(false);
    connect({ connector });
    setLastConnector({ id: connector.id });
    setLastConnectionTime(Date.now());
    handleCloseModal();
  }

  function handleConnectBurner(
    e: React.MouseEvent<HTMLButtonElement>,
    ix: number,
  ) {
    const connector = connectors.find((it) => it.id == "burner-wallet");
    if (connector && connector instanceof BurnerConnector) {
      connector.burnerAccount = burnerAccounts[ix];
      setWasDisconnectedManually(false);
      connect({ connector });
      setLastConnector({ id: connector.id, ix });
      setLastConnectionTime(Date.now());
      handleCloseModal();
    }
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
            <h3 className="text-xl font-bold">
              {isBurnerWallet
                ? "Choose account"
                : showOtherOptions
                  ? "Other Wallet Options"
                  : "Connect a Wallet"}
            </h3>
            <label
              onClick={() => {
                setIsBurnerWallet(false);
                setShowOtherOptions(false);
              }}
              htmlFor="connect-modal"
              className="btn btn-ghost btn-sm btn-circle cursor-pointer"
            >
              ✕
            </label>
          </div>
          <div className="flex flex-col flex-1 lg:grid">
            <div className="flex flex-col gap-4 w-full px-8 py-10">
              {!isBurnerWallet ? (
                !showOtherOptions ? (
                  <>
                    {mainConnectors.map((connector, index) => (
                      <Wallet
                        key={connector.id || index}
                        connector={connector}
                        loader={loader}
                        handleConnectWallet={handleConnectWallet}
                      />
                    ))}
                    {isDevnet && otherConnectors.length > 0 && (
                      <button
                        className="btn btn-ghost rounded-md mt-4 font-normal text-base"
                        onClick={() => setShowOtherOptions(true)}
                      >
                        Other Options
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {otherConnectors.map((connector, index) => (
                      <Wallet
                        key={connector.id || index}
                        connector={connector}
                        loader={loader}
                        handleConnectWallet={handleConnectWallet}
                      />
                    ))}
                    <button
                      className="btn btn-ghost font-normal text-base mt-4 rounded-md"
                      onClick={() => setShowOtherOptions(false)}
                    >
                      Back
                    </button>
                  </>
                )
              ) : (
                <div className="flex flex-col pb-[20px] justify-end gap-3">
                  <div className="h-[300px] overflow-y-auto flex w-full flex-col gap-2">
                    {burnerAccounts.map((burnerAcc, ix) => (
                      <div
                        key={burnerAcc.publicKey}
                        className="w-full flex flex-col"
                      >
                        <button
                          className={`hover:bg-gradient-modal border rounded-md text-neutral py-[8px] pl-[10px] pr-16 flex items-center gap-4 ${isDarkMode ? "border-[#385183]" : ""}`}
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
        </>
      </GenericModal>
    </div>
  );
};

export default ConnectModal;
