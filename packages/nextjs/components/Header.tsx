"use client";

import React, { useCallback, useRef, useState } from "react";

import { BugAntIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { FaucetButton } from "~~/components/scaffold-stark/FaucetButton";

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

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="lg:static top-0 navbar min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2 bg-base-100">
      <div className="navbar-end flex-grow mr-4">
        <CustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
