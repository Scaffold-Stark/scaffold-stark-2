import React from "react";
import { Connector } from "@starknet-react/core";
import Image from "next/image";

const Wallet = ({
  handleConnectWallet,
  connector,
  loader,
}: {
  connector: Connector;
  loader: ({ src }: { src: string }) => string;
  handleConnectWallet: (
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector,
  ) => void;
}) => {
  const isSvg = connector.icon.light?.startsWith("<svg");

  return (
    <button
      className="flex gap-4 items-center text-start p-[.2rem] hover:bg-outline-grey hover:rounded-[10px] transition-all cursor-pointer"
      onClick={(e) => handleConnectWallet(e, connector)}
    >
      <div className="h-[2.2rem] w-[2.2rem] rounded-[5px]">
        {isSvg ? (
          <div
            className="h-full w-full object-cover rounded-[5px]"
            dangerouslySetInnerHTML={{
              __html: connector.icon.light ?? "",
            }}
          />
        ) : (
          <Image
            alt={connector.name}
            loader={loader}
            src={connector.icon.light!}
            width={70}
            height={70}
            className="h-full w-full object-cover rounded-[5px]"
          />
        )}
      </div>
      <p className="flex-1">{connector.name}</p>
    </button>
  );
};

export default Wallet;
