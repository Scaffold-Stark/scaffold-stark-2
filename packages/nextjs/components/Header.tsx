"use client";

import React, { useCallback, useRef, useState } from "react";

import { BugAntIcon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div
      className={`lg:static top-0 navbar min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2 bg-base-100 ${pathname !== "/" ? "border-b border-[#1c2d49]" : ""}`}
    >
      <div className="pl-8">
        {pathname !== "/" && (
          <Image
            src={"/logo-header.svg"}
            alt={"logo header"}
            width={200}
            height={65}
            className="sm:w-[100px]"
          />
        )}
      </div>
      <div className="navbar-end flex-grow pr-8 py-[8px]">
        <CustomConnectButton />
      </div>
    </div>
  );
};
