"use client";

import { useState } from "react";
import Link from "next/link";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Address as AddressType } from "@starknet-react/chains";
import { devnet } from "@starknet-react/chains";
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { getBlockExplorerClasshashLink } from "~~/utils/scaffold-stark";

type ClasshashProps = {
  classHash: AddressType;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
};

/**
 * Displays a Classhash and option to copy classHash.
 */
export const ClassHash = ({
  classHash,
  format,
  size = "xs",
}: ClasshashProps) => {
  const [addressCopied, setAddressCopied] = useState(false);
  const { targetNetwork } = useTargetNetwork();

  const blockExplorerAddressLink = getBlockExplorerClasshashLink(
    targetNetwork,
    classHash,
  );

  let displayClasshash = classHash?.slice(0, 6) + "..." + classHash?.slice(-4);

  if (format === "long") {
    displayClasshash = classHash;
  }

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <span className={`text-${size} font-normal`}>class hash: </span>
      </div>
      {targetNetwork.network === devnet.network ? (
        <span className={`ml-1.5 text-${size} font-normal`}>
          <Link href={blockExplorerAddressLink}>{displayClasshash}</Link>
        </span>
      ) : (
        <a
          className={`ml-1.5 text-${size} font-normal`}
          target="_blank"
          href={blockExplorerAddressLink}
          rel="noopener noreferrer"
        >
          {displayClasshash}
        </a>
      )}
      {addressCopied ? (
        <CheckCircleIcon
          className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
          aria-hidden="true"
        />
      ) : (
        <CopyToClipboard
          text={classHash}
          onCopy={() => {
            setAddressCopied(true);
            setTimeout(() => {
              setAddressCopied(false);
            }, 800);
          }}
        >
          <DocumentDuplicateIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        </CopyToClipboard>
      )}
    </div>
  );
};
