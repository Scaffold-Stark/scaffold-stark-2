import Link from "next/link";
import React from "react";
import { HeaderMenuLink } from "~~/components/Header";

interface MenuItemProps {
  link: HeaderMenuLink;
  isActive: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ link, isActive }) => {
  //console.log({ isActive }, link.label);
  return (
    <li key={link.href}>
      <Link
        href={link.href}
        passHref
        className={`${
          isActive
            ? "!bg-base-300 !text-base-100 active:bg-base-300 shadow-md text-base-100"
            : ""
        } hover:bg-base-300 hover:text-base-100`}
      >
        {link.icon}
        <span>{link.label}</span>
      </Link>
    </li>
  );
};

export default MenuItem;
