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
    connector: Connector,
  ) => void;
}) => {
  const [clicked, setClicked] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // connector has two : dark and light icon
  const icon =
    typeof connector.icon === "object"
      ? resolvedTheme === "dark"
        ? (connector.icon.dark as string)
        : (connector.icon.light as string)
      : (connector.icon as string);
  return (
    <button
      className={`flex gap-4 items-center text-neutral p-[.2rem] rounded-[4px] transition-all cursor-pointer ${isDarkMode ? "hover:bg-[#385183] border-[#4f4ab7]" : "hover:bg-gradient-light hover:border-none"} border pl-3 ${clicked ? "bg-ligth" : ""}`}
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
      <p className="flex-1 text-start">{connector.name}</p>
    </button>
  );
};

export default Wallet;
