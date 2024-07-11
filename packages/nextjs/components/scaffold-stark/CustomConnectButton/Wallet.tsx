import React, { useState } from "react";
import { Connector } from "@starknet-react/core";
import Image from "next/image";
import { useTheme } from "next-themes";

const Wallet = ({
  handleConnectWallet,
  connector,
  loader,
}: {
  connector: Connector;
  loader: ({ src }: { src: string }) => string;
  handleConnectWallet: (
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector
  ) => void;
}) => {
  const [clicked, setClicked] = useState(false);
  const { resolvedTheme } = useTheme();

  // connector has two : dark and light icon
  const icon =
    typeof connector.icon === "object"
      ? resolvedTheme === "dark"
        ? (connector.icon.dark as string)
        : (connector.icon.light as string)
      : (connector.icon as string);
  return (
    <button
      className={`flex gap-4 items-center text-base-100 p-[.2rem] hover:bg-outline-grey rounded-[10px] transition-all cursor-pointer hover:bg-primary-content border-2 border-primary-content pl-3 ${clicked ? "bg-primary-content" : ""}`}
      onClick={(e) => {
        setClicked(true);
        handleConnectWallet(e, connector);
      }}
    >
      <div className="h-[2.2rem] w-[2.2rem] rounded-[5px]">
        <Image
          alt={connector.name}
          loader={loader}
          src={icon}
          width={70}
          height={70}
          className="h-full w-full object-cover rounded-[5px]"
        />
      </div>
      <p className="flex-1">{connector.name}</p>
    </button>
  );
};

export default Wallet;
