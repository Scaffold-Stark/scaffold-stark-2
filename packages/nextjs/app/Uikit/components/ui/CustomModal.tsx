import { Wallet } from "ethers";
import React, { PropsWithChildren, useEffect, useState } from "react";
import GenericModal from "~~/components/scaffold-stark/CustomConnectButton/GenericModal";
type Props = {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
};

const ConnectModal = ({
  title,
  isOpen,
  onClose,
  children,
}: PropsWithChildren<Props>) => {
  const [animate, setAnimate] = useState(false);

  const closeModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnimate(false);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  useEffect(() => setAnimate(isOpen), [isOpen]);

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={closeModal}
      animate={animate}
      className={`mx-auto w-[90vw] border border-border bg-background pb-4 md:max-h-[30rem] md:max-w-[30rem]`}
    >
      <div className="flex w-full p-4 lg:grid lg:grid-cols-5 lg:p-0">
        <div
          className="basis-5/6 lg:col-span-2 lg:py-4 lg:pl-8"
          style={{ width: "40rem" }}
        >
          <h2 className="my-4 text-center text-[1.125em] font-bold text-base-100 lg:text-start">
            {title}
          </h2>
        </div>
        <div className="ml-auto text-base-100 lg:col-span-3 lg:py-4 lg:pr-8">
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
      <div className="px-8 pb-3">{children}</div>
    </GenericModal>
  );
};

export default ConnectModal;
