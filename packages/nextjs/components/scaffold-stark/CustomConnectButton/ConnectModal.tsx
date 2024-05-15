import Image from "next/image";
import GenericModal from "./GenericModal";
import { Connector, useConnect } from "@starknet-react/core";
import React, { useEffect, useState } from "react";
import Wallet from "~~/components/scaffold-stark/CustomConnectButton/Wallet";
import { useLocalStorage } from "usehooks-ts";
import { burnerAccounts } from "~~/utils/devnetAccounts";
import { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";

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
    },
  );

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
    closeModal(e);
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
      closeModal(e);
    }
  }

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={closeModal}
      animate={animate}
      className={`w-[90vw] mx-auto md:max-h-[30rem] md:max-w-[45rem]`}
    >
      <div className="flex p-4 w-full lg:p-0 lg:grid lg:grid-cols-5">
        <div className="basis-5/6 lg:col-span-2   lg:py-4 lg:pl-8">
          <h2 className="text-center my-4 lg:text-start font-bold text-base-100 text-[1.125em]">
            Connect a Wallet
          </h2>
        </div>
        <div className="ml-auto lg:col-span-3 lg:py-4 lg:pr-8 text-base-100">
          <button
            onClick={(e) => {
              closeModal(e);
              e.stopPropagation();
            }}
            className="w-8 h-8  grid place-content-center rounded-full  text-base-100"
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
      <div className="flex flex-col flex-1 justify-between lg:grid lg:grid-cols-5 ">
        <div className="px-8 lg:h-full lg:col-span-2  ">
          <h4 className="mb-[1rem] text-base-100 font-semibold">Popular</h4>
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
        <div className=" h-fit lg:h-full lg:border-none lg:col-span-3 lg:px-8 lg:py-0 lg:flex lg:flex-col pb-[20px]">
          {isBurnerWallet ? (
            <>
              <div className="text-base-100 font-medium">
                <h4>Choose account</h4>
              </div>
              <div className="flex flex-col pb-[20px] items-center justify-end gap-3">
                <div className="h-[300px] overflow-y-auto flex w-full flex-col gap-2">
                  {burnerAccounts.map((burnerAcc, ix) => (
                    // eslint-disable-next-line react/jsx-key
                    <div className="w-full flex flex-col">
                      <button
                        key={burnerAcc.publicKey}
                        className=" border-2 border-primary-content rounded-md text-base-100 hover:bg-primary-content py-[4px] pl-[10px] flex"
                        onClick={(e) => handleConnectBurner(e, ix)}
                      >
                        {`${burnerAcc.accountAddress.slice(0, 6)}...${burnerAcc.accountAddress.slice(-4)}`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="lg:text-center lg:mb-[3rem] lg:text-[1.125em] text-base-100 font-bold">
                What is a wallet?
              </h2>
              <article className="hidden lg:flex  flex-col gap-8 place-content-center text-[0.875em] justify-self-center self-center ">
                <div className="grid grid-cols-10 items-center  gap-4">
                  <div className="col-span-2 border-solid border-[2px] border-base-100 rounded-[10px] h-[3rem] w-[3rem]">
                    <Image
                      alt="text"
                      loader={loader}
                      src={
                        "https://media.istockphoto.com/id/1084096262/vector/concept-of-mobile-payments-wallet-connected-with-mobile-phone.jpg?s=612x612&w=0&k=20&c=noILf6rTUyxN41JnmeFhUmqQWiCWoXlg0zCLtcrabD4="
                      }
                      width={100}
                      height={100}
                      className="h-full w-full object-cover rounded-[10px]"
                    />
                  </div>
                  <div className="col-span-8 flex flex-col gap-2 ">
                    <h4 className="text-[1.14em] font-bold text-base-100">
                      A home for your digital assets
                    </h4>
                    <p className="text-base-100">
                      Wallets are used to send, receive, store, and display
                      digital assets like Ethereum and NFTs.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-10 items-center  gap-4">
                  <div className="col-span-2 border-solid border-[2px] border-base-100 rounded-[10px] h-[3rem] w-[3rem]">
                    <Image
                      alt="text"
                      loader={loader}
                      src={
                        "https://media.licdn.com/dms/image/D4E12AQFyWdLwXcJu3Q/article-cover_image-shrink_720_1280/0/1687854784940?e=2147483647&v=beta&t=nNDH-9XEcVYcb1PAc3S78ndQze0126KPOSZmnmMERNg"
                      }
                      width={100}
                      height={100}
                      className="h-full w-full object-cover rounded-[10px]"
                    />
                  </div>
                  <div className="col-span-8 flex flex-col gap-2 ">
                    <h4 className="text-[1.14em] font-bold text-base-100">
                      A new way to sign-in
                    </h4>
                    <p className="text-base-100 pb-2">
                      Instead of creating new accounts and passwords on every
                      website, just connect your wallet.
                    </p>
                  </div>
                </div>
              </article>
            </>
          )}
        </div>
      </div>
    </GenericModal>
  );
};

export default ConnectModal;
