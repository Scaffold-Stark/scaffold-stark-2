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
      className={`flex items-center gap-4 rounded-[4px] p-3 text-neutral transition-all ${isDarkMode ? "border-[#4f4ab7] hover:bg-[#385183]" : "border-[#5c4fe5] hover:bg-slate-200"} border ${clicked ? "bg-ligth" : ""}`}
      onClick={(e) => {
        setClicked(true);
        handleConnectWallet(e, connector);
      }}
    >
      <div className="h-[2.4rem] w-[2.2rem] rounded-[5px] p-1">
        {isSvg ? (
          <div
            className="h-full w-full rounded-[5px] object-cover"
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
            className="h-full w-full rounded-[5px] object-cover"
          />
        )}
      </div>
      <span className="m-0 text-start">{connector.name}</span>
    </button>
  );
};

export default CustomWallet;
