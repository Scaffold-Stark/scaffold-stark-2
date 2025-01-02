"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BugAntIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useTheme } from "next-themes";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { devnet } from "@starknet-react/chains";
import { SwitchTheme } from "./SwitchTheme";
import { useAccount, useNetwork, useProvider } from "@starknet-react/core";
import { BlockIdentifier } from "starknet";
import { LibraryBig, Notebook } from "lucide-react";
import { Button } from "~~/app/Uikit/components/ui/button";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "My bets",
    href: "/bets",
    icon: <Notebook className="h-4 w-4" />,
  },
];

function MenuLinkButton({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li key={href}>
      <Button asChild variant={"ghost"}>
        <Link
          href={href}
          passHref
          className={`${
            isActive ? "!text-white !opacity-100" : ""
          } grid grid-flow-col gap-2 rounded-full px-3 py-1.5 text-sm opacity-65 hover:text-white`}
        >
          {icon}
          <span>{label}</span>
        </Link>
      </Button>
    </li>
  );
}

export const HeaderMenuLinks = () => {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);
  return (
    <>
      {menuLinks.map(({ label, href, icon }) => (
        <MenuLinkButton label={label} href={href} icon={icon} key={href} />
      ))}
    </>
  );
};

/**
 * Site header
 */
export const CustomHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(
    //@ts-expect-error refs are supposed to be null by default
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.network === devnet.network;

  const { provider } = useProvider();
  const { address, status, chainId } = useAccount();
  const { chain } = useNetwork();
  const [isDeployed, setIsDeployed] = useState(true);

  useEffect(() => {
    if (
      status === "connected" &&
      address &&
      chainId === targetNetwork.id &&
      chain.network === targetNetwork.network
    ) {
      provider
        .getClassHashAt(address)
        .then((classHash) => {
          if (classHash) setIsDeployed(true);
          else setIsDeployed(false);
        })
        .catch((e) => {
          console.error("contreact cehc", e);
          if (e.toString().includes("Contract not found")) {
            setIsDeployed(false);
          }
        });
    }
  }, [
    status,
    address,
    provider,
    chainId,
    targetNetwork.id,
    targetNetwork.network,
    chain.network,
  ]);

  return (
    <div className="navbar sticky top-0 z-30 flex h-16 min-h-0 flex-shrink-0 items-center justify-between border-b border-border bg-background px-6 shadow-md lg:static">
      <div className="navbar-start -mr-2 w-auto lg:w-1/2">
        <Link href={"/"}>
          <Image
            src={"/starksight-green.png"}
            alt={"starksight"}
            width={250}
            height={60}
          />
        </Link>
        <ul className="menu menu-horizontal flex-nowrap gap-2 px-1 lg:flex">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end mr-2 flex-grow gap-4">
        {status === "connected" && !isDeployed ? (
          <span className="bg-[#8a45fc] p-1 text-[9px] text-white">
            Wallet Not Deployed
          </span>
        ) : null}
        <CustomConnectButton />
        {/* <FaucetButton /> */}
        {/*   <SwitchTheme
          className={`pointer-events-auto ${
            isLocalNetwork ? "mb-1 lg:mb-0" : ""
          }`}
        /> */}
      </div>
    </div>
  );
};
