"use client";

import { blo } from "blo";

interface BlockieAvatarProps {
  address: string;
  size: number;
}

// Custom Avatar for RainbowKit
export const BlockieAvatar = ({ address, size }: BlockieAvatarProps) => {
  const avatarSrc = blo(address as `0x${string}`);
  return (
    // Don't want to use nextJS Image here (and adding remote patterns for the URL)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="rounded-full"
      src={avatarSrc}
      width={size}
      height={size}
      alt={`${address} avatar`}
    />
  );
};
