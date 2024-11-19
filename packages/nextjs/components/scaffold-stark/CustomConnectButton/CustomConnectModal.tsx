import { Connector, useConnect } from "@starknet-react/core";
import { useRef, useState } from "react";
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

const CustomConnectModal = () => {
  const modalRef = useRef<HTMLInputElement>(null);
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
    <GenericModal
      isOpen={isOpen}
      onClose={closeModal}
      animate={animate}
      className={`mx-auto w-[90vw] border border-border bg-background pb-4 md:max-h-[30rem] md:max-w-[25rem]`}
    >
      <div className="flex w-full p-4 lg:p-0">
        <div className="basis-5/6 lg:col-span-2 lg:py-4 lg:pl-8">
          <h2 className="my-4 text-center text-[1.125em] font-bold text-base-100 lg:text-start">
            Connect a Wallet
          </h2>
        </div>
        <div className="ml-auto self-center text-base-100 lg:col-span-3 lg:py-4 lg:pr-8">
          <button
            onClick={(e) => {
              closeModal(e);
              e.stopPropagation();
            }}
            className="grid h-8 w-8 place-content-center rounded-full text-base-100"
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
      <div className="flex flex-1 flex-col justify-between">
        <div className="px-8 lg:col-span-2 lg:h-full">
          {/*  <h4 className="mb-[1rem] text-base-100 font-semibold">Popular</h4> */}
          <div className="flex flex-col gap-4">
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
        <div className="h-fit pb-[20px] lg:col-span-3 lg:flex lg:h-full lg:flex-col lg:border-none lg:px-8 lg:py-0">
          {isBurnerWallet ? (
            <>
              <div className="font-medium text-base-100">
                <h4>Choose account</h4>
              </div>
              <div className="flex flex-col items-center justify-end gap-3 pb-[20px]">
                <div className="flex h-[300px] w-full flex-col gap-2 overflow-y-auto">
                  {burnerAccounts.map((burnerAcc, ix) => (
                    // eslint-disable-next-line react/jsx-key
                    <div className="flex w-full flex-col">
                      <button
                        key={burnerAcc.publicKey}
                        className="flex rounded-md border-2 border-primary-content py-[4px] pl-[10px] text-base-100 hover:bg-primary-content"
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
            <></>
          )}
        </div>
      </div>
    </GenericModal>
  );
};

export default CustomConnectModal;
