"use client";

import { blo } from "blo";
import { useState, useEffect } from "react";

interface BlockieAvatarProps {
  address: string;
  size: number;
}

// Custom Avatar for RainbowKit
export const BlockieAvatar = ({ address, size }: BlockieAvatarProps) => {
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const avatarUrl = blo(address as `0x${string}`);
    setAvatarSrc(avatarUrl);
    setIsLoading(false);
  }, [address]);

  if (isLoading) {
    return (
      <div
        className="rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

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
