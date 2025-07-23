import React, { useEffect, useMemo, useState } from "react";
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
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // connector has two : dark and light icon
  const icon = useMemo(() => {
    return typeof connector.icon === "object"
      ? resolvedTheme === "dark"
        ? (connector.icon.dark as string)
        : (connector.icon.light as string)
      : (connector.icon as string);
  }, [connector, resolvedTheme]);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? (
    <button
      className={`flex gap-4 items-center text-neutral  rounded-[4px] p-3 transition-all ${
        isDarkMode
          ? "hover:bg-[#385183] border-[#4f4ab7]"
          : "hover:bg-slate-200 border-[#5c4fe5]"
      } border ${clicked ? "bg-ligth" : ""}`}
      onClick={(e) => {
        setClicked(true);
        handleConnectWallet(e, connector);
      }}
    >
      <div className="h-6 w-6 rounded-[5px]">
        <Image
          alt={connector.name}
          loader={loader}
          src={icon}
          width={70}
          height={70}
          className="h-full w-full object-cover rounded-[5px]"
        />
      </div>
      <span className=" text-start m-0">{connector.name}</span>
    </button>
  ) : null;
};

export default Wallet;
