import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import CopyToClipboard from "react-copy-to-clipboard";
import { createPortal } from "react-dom";
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useLocalStorage } from "usehooks-ts";
import { BlockieAvatar, isENS } from "~~/components/scaffold-stark";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { burnerAccounts } from "~~/utils/devnetAccounts";
import { Address } from "@starknet-react/chains";
import { useDisconnect, useNetwork, useConnect } from "@starknet-react/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~~/app/Uikit/components/ui/dropdown-menu";
import { getStarknetPFPIfExists } from "~~/utils/profile";
import useConditionalStarkProfile from "~~/hooks/useConditionalStarkProfile";
import { useTheme } from "next-themes";
import { default as NextImage } from "next/image";

const allowedNetworks = getTargetNetworks();

type CustomAddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const CustomAddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
}: CustomAddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const [addressCopied, setAddressCopied] = useState(false);
  const { data: profile } = useConditionalStarkProfile(address);
  const { chain } = useNetwork();
  const [showBurnerAccounts, setShowBurnerAccounts] = useState(false);
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const { connectors, connect } = useConnect();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  function handleConnectBurner(
    e: React.MouseEvent<HTMLButtonElement>,
    ix: number,
  ) {
    const connector = connectors.find(
      (it) => it.id == "burner-wallet",
    ) as BurnerConnector;
    if (connector) {
      connector.burnerAccount = burnerAccounts[ix];
      connect({ connector });
      setLastConnector({ id: connector.id, ix });
      setShowBurnerAccounts(false);
    }
  }

  const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
    {
      initializeWithValue: false,
    },
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center">
          <BlockieAvatar address={address} size={30} ensImage={ensAvatar} />
          <span className="ml-2 mr-1">
            {isENS(displayName)
              ? displayName
              : address?.slice(0, 6) + "..." + address?.slice(-4)}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="">
          <DropdownMenuItem>
            <div className={selectingNetwork ? "hidden" : ""}>
              {addressCopied ? (
                <div className="btn-sm flex gap-3 !rounded-xl py-3">
                  <CheckCircleIcon
                    className="ml-2 h-6 w-4 cursor-pointer text-xl font-normal sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap">Copy address</span>
                </div>
              ) : (
                <CopyToClipboard
                  text={address}
                  onCopy={() => {
                    setAddressCopied(true);
                    setTimeout(() => {
                      setAddressCopied(false);
                    }, 800);
                  }}
                >
                  <div className="btn-sm flex gap-3 !rounded-xl py-3">
                    <DocumentDuplicateIcon
                      className="ml-2 h-6 w-4 cursor-pointer text-xl font-normal sm:ml-0"
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">Copy address</span>
                  </div>
                </CopyToClipboard>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            {" "}
            <div className={selectingNetwork ? "hidden" : ""}>
              <label
                htmlFor="qrcode-modal"
                className="btn-sm flex gap-3 !rounded-xl py-3"
              >
                <QrCodeIcon className="ml-2 h-6 w-4 sm:ml-0" />
                <span className="whitespace-nowrap">View QR Code</span>
              </label>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            {" "}
            <div className={selectingNetwork ? "hidden" : ""}>
              <button
                className="menu-item btn-sm flex gap-3 !rounded-xl py-3"
                type="button"
              >
                <ArrowTopRightOnSquareIcon className="ml-2 h-6 w-4 sm:ml-0" />
                <a
                  target="_blank"
                  href={blockExplorerAddressLink}
                  rel="noopener noreferrer"
                  className="whitespace-nowrap"
                >
                  View on Block Explorer
                </a>
              </button>
            </div>
          </DropdownMenuItem>

          {allowedNetworks.length > 1 ? (
            <DropdownMenuItem>
              <div className={selectingNetwork ? "hidden" : ""}>
                <button
                  className="btn-sm flex gap-3 !rounded-xl py-3"
                  type="button"
                  onClick={() => {
                    setSelectingNetwork(true);
                  }}
                >
                  <ArrowsRightLeftIcon className="ml-2 h-6 w-4 sm:ml-0" />{" "}
                  <span>Switch Network</span>
                </button>
              </div>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem>
            <div className={selectingNetwork ? "hidden" : ""}>
              <button
                className="menu-item btn-sm flex gap-3 !rounded-xl py-3 text-error"
                type="button"
                onClick={() => disconnect()}
              >
                <ArrowLeftEndOnRectangleIcon className="ml-2 h-6 w-4 sm:ml-0" />{" "}
                <span>Disconnect</span>
              </button>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*  <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary
          tabIndex={0}
          className="btn bg-transparent btn-sm px-2 py-[0.35rem] dropdown-toggle gap-0 !h-auto border border-[#5c4fe5] "
        >
          <div className="hidden [@media(min-width:412px)]:block">
            {getStarknetPFPIfExists(profile?.profilePicture) ? (
              <NextImage
                src={profile?.profilePicture || ""}
                alt="Profile Picture"
                className="rounded-full"
                width={30}
                height={30}
              />
            ) : (
              <BlockieAvatar address={address} size={28} ensImage={ensAvatar} />
            )}
          </div>
          <span className="ml-2 mr-2 text-sm">
            {isENS(displayName)
              ? displayName
              : profile?.name ||
                address?.slice(0, 6) + "..." + address?.slice(-4)}
          </span>
          <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0 sm:block hidden" />
        </summary>
        <ul
          tabIndex={0}
          className={`dropdown-content menu z-[2] p-2 mt-2 rounded-[5px] gap-1 border border-[#5c4fe5] bg-base-100`}
        >
          <NetworkOptions hidden={!selectingNetwork} />
          <div className={selectingNetwork ? "hidden" : ""}>
            {addressCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3 py-3">
                <CheckCircleIcon
                  className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                  aria-hidden="true"
                />
                <span className=" whitespace-nowrap">Copy address</span>
              </div>
            ) : (
              <CopyToClipboard
                text={address}
                onCopy={() => {
                  setAddressCopied(true);
                  setTimeout(() => {
                    setAddressCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3 py-3">
                  <DocumentDuplicateIcon
                    className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className=" whitespace-nowrap">Copy address</span>
                </div>
              </CopyToClipboard>
            )}
          </div>
          <div className={selectingNetwork ? "hidden" : ""}>
            <label
              htmlFor="qrcode-modal"
              className="btn-sm !rounded-xl flex gap-3 py-3"
            >
              <QrCodeIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span className="whitespace-nowrap">View QR Code</span>
            </label>
          </div>
          <div className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item btn-sm !rounded-xl flex gap-3 py-3"
              type="button"
            >
              <ArrowTopRightOnSquareIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <a
                target="_blank"
                href={blockExplorerAddressLink}
                rel="noopener noreferrer"
                className="whitespace-nowrap"
              >
                View on Block Explorer
              </a>
            </button>
          </div>
          {allowedNetworks.length > 1 ? (
            <div className={selectingNetwork ? "hidden" : ""}>
              <button
                className="btn-sm !rounded-xl flex gap-3 py-3"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true);
                }}
              >
                <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />{" "}
                <span>Switch Network</span>
              </button>
            </div>
          ) : null}
          <div className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item text-secondary-content btn-sm !rounded-xl flex gap-3 py-3"
              type="button"
              onClick={() => disconnect()}
            >
              <ArrowLeftEndOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />{" "}
              <span>Disconnect</span>
            </button>
          </div>
        </ul>
      </details> */}
    </>
  );
};
