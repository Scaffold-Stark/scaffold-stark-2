"use client";

import { blo } from "blo";

interface BlockieAvatarProps {
  address: string;
  ensImage?: string | null;
  size: number;
}

// Custom Avatar for RainbowKit
export const BlockieAvatar = ({
  address,
  ensImage,
  size,
}: BlockieAvatarProps) => (
  // Don't want to use nextJS Image here (and adding remote patterns for the URL)
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className="rounded-full"
    src={ensImage || blo(address as `0x${string}`)}
    width={size}
    height={size}
    alt={`${address} avatar`}
  />
);
