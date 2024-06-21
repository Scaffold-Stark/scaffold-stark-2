"use client";

import React, { useCallback, useRef, useState } from "react";
import { useAccount } from "@starknet-react/core";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BugAntIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { FaucetButton } from "~~/components/scaffold-stark/FaucetButton";

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
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
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
    useCallback(() => setIsDrawerOpen(false), []),
  );

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
