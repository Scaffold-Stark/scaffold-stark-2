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
      className={`w-[90vw] mx-auto md:max-h-[30rem] md:max-w-[45rem] bg-[#141438]`}
    >
      <div className="flex p-4 w-full lg:p-0 lg:grid lg:grid-cols-5">
        <div
          className="basis-5/6 lg:col-span-2 lg:py-4 lg:pl-8"
          style={{ width: "40rem" }}
        >
          <h2 className="text-center my-4 lg:text-start font-bold text-base-100 text-[1.125em]">
            {title}
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
      <div style={{ padding: "2rem" }}>{children}</div>
    </GenericModal>
  );
};

export default ConnectModal;
