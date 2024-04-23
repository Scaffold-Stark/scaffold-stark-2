import Link from "next/link";
import React from "react";
import { HeaderMenuLink } from "~~/components/Header";

interface MenuItemProps {
  link: HeaderMenuLink;
  isActive: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ link, isActive }) => {
  return (
    <li key={link.href}>
      <Link
        href={link.href}
        passHref
        className={`${
          isActive ? "bg-base-300 shadow-md text-base-100" : ""
        } hover:bg-base-300 hover:shadow-md hover:text-base-100 focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
      >
        {link.icon}
        <span>{link.label}</span>
      </Link>
    </li>
  );
};

export default MenuItem;
