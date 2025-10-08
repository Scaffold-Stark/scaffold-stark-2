"use client";

import { default as NextImage } from "next/image";
import { BlockieAvatar } from "./BlockieAvatar";
import { getStarknetPFPIfExists } from "~~/utils/profile";

type AvatarProps = {
  address: string;
  size: number;
  profilePicture?: string;
  className?: string;
};

export const Avatar = ({
  address,
  size,
  profilePicture,
  className,
}: AvatarProps) => {
  const pfp = getStarknetPFPIfExists(profilePicture);
  if (pfp) {
    return (
      <NextImage
        src={pfp}
        alt="Profile Picture"
        className={`rounded-full ${className ?? ""}`}
        width={size}
        height={size}
      />
    );
  }
  return <BlockieAvatar address={address} size={size} />;
};
