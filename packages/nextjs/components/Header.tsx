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
import { useAccount, useProvider } from "@starknet-react/core";

import ConnectModal from "./scaffold-stark/CustomConnectButton/ConnectModal";
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
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);
  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive
                  ? "!bg-gradient-nav !text-white active:bg-gradient-nav shadow-md "
                  : ""
              } py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col hover:bg-gradient-nav hover:text-white`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { address, status, chainId, ...props } = useAccount();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), [])
  );
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === devnet.id;

  const { provider } = useProvider();
  const { address, status } = useAccount();
  const [isDeployed, setIsDeployed] = useState(true);

  useEffect(() => {
    if (status === "connected" && address) {
      provider.getContractVersion(address).catch((e) => {
        if (e.toString().includes("Contract not found")) {
          setIsDeployed(false);
        }
      });
    }
  }, [status, address, provider]);

  return (
    <div className="sticky flex lg:static top-0 navbar bg-background border-b border-border min-h-0 flex-shrink-0 justify-between z-20 shadow-md px-6 h-16 items-center">
      <div className="flex justify-center items-center">
        <Link href={"/"}>
          <Image
            src={"/starksight-green.png"}
            alt={"starksight"}
            width={250}
            height={60}
          />
        </Link>
        {status !== "disconnected" ? (
          <Link href={"/bets"}>
            <Button variant={"ghost"} className="text-end">
              My bets
            </Button>
          </Link>
        ) : null}
        <Link href={"/crash"}>
          <Button variant={"ghost"} className="text-end">
            Crash game
          </Button>
        </Link>
      </div>

      <CustomConnectButton />
    </div>
  );
};
