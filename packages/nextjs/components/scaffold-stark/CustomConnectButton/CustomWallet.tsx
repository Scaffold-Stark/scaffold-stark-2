import React, { useState } from "react";
import { Connector } from "@starknet-react/core";
import Image from "next/image";
import { useTheme } from "next-themes";

const CustomWallet = ({
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
      className={`flex gap-4 items-center text-neutral  rounded-[4px] p-3 transition-all ${isDarkMode ? "hover:bg-[#385183] border-[#4f4ab7]" : "hover:bg-slate-200 border-[#5c4fe5]"} border ${clicked ? "bg-ligth" : ""}`}
      onClick={(e) => {
        setClicked(true);
        handleConnectWallet(e, connector);
      }}
    >
      <div className="h-[2.4rem] w-[2.2rem] rounded-[5px] p-1">
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
      <span className=" text-start m-0">{connector.name}</span>
    </button>
  );
};

export default CustomWallet;
