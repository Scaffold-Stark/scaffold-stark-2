"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { WalletAccount, Account, ec, json, stark, RpcProvider, hash, CallData, wallet } from 'starknet';
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bars3Icon,
  BugAntIcon,
  Cog8ToothIcon,
} from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useTheme } from "next-themes";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { devnet } from "@starknet-react/chains";
import { SwitchTheme } from "./SwitchTheme";
import { useAccount, useProvider, useDeployAccount } from "@starknet-react/core";
import { BlockIdentifier } from "starknet";

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
  {
    label: "Configure Contracts",
    href: "/configure",
    icon: <Cog8ToothIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);
  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive
                  ? "!bg-gradient-nav !text-white active:bg-gradient-nav shadow-md"
                  : ""
              } py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col hover:bg-gradient-nav hover:text-white`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

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
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === devnet.id;

  const { provider } = useProvider();
  const { address, status, chainId, account} = useAccount();
  const [isDeployed, setIsDeployed] = useState(true);
  const { deployAccount, error, isSuccess } = useDeployAccount({});

  useEffect(() => {
    if (status === "connected" && address && chainId === targetNetwork.id) {
      provider
        .getClassHashAt(address, "pending" as BlockIdentifier)
        .then((classHash) => {
          if (classHash) setIsDeployed(true);
          else setIsDeployed(false);
        })
        .catch((e) => {
          if (e.toString().includes("Contract not found")) {
            setIsDeployed(false);
          }
        });
    }
  }, [status, address, provider, chainId, targetNetwork.id]);

  return (
    <div className="sticky lg:static top-0 navbar min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${
              isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"
            }`}
            onClick={() => {
              setIsDrawerOpen((prevIsOpenState) => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <Link
          href="/"
          passHref
          className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0"
        >
          <div className="flex relative w-10 h-10">
            <Image
              alt="SE2 logo"
              className="cursor-pointer"
              fill
              src="/logo.svg"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">Scaffold-Stark</span>
            <span className="text-xs">Starknet dev stack</span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4 gap-4">
        {status === "connected" && !isDeployed ? (
           <button
           className={`rounded-[18px] btn-sm font-bold px-8 bg-btn-wallet`}
           onClick={async () => {

            console.log("Deploy wallet button clicked");
            console.log("Provider:", provider.channel.nodeUrl);
            console.log("wallet:", address)
            console.log("account", account)
            
            console.log("wallet", wallet)
            

            const handleDeploy = async () => {
              try {
                const deployVariables = {
                  addressSalt: "new-salt",
                  classHash: "new-class-hash",
                  contractAddress: "new-contract-address",
                  constructorCalldata: { key: 'value' } // Example of dynamic constructor calldata
                };
          
                // Call deployAccount with the necessary variables
                const response = await deployAccount(deployVariables);
                console.log("Contract deployed:", response);
              } catch (deployError) {
                console.error("Deployment failed:", deployError);
              }
            };

            await handleDeploy()

            // const myWalletAccount = new WalletAccount({ nodeUrl: process.env.RPC_URL_SEPOLIA  }, );

            // const deployData = await wallet

            // Calculate future address of the ArgentX account
            // const AXConstructorCallData = CallData.compile({
            //   owner: address || "",
            //   guardian: '0',
            // });
            // const AXcontractAddress = hash.calculateContractAddressFromHash(
            //   address || "",
            //   "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f",
            //   AXConstructorCallData,
            //   0
            // );

            // const deployAccountPayload = {
            //   classHash: "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f",
            //   constructorCalldata: AXConstructorCallData,
            //   contractAddress: AXcontractAddress,
            //   addressSalt: address || "",
            // };

            // // const deployAccountPayload = {
            // //   classHash: "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f",
            // // };

            // const response = await account?.deployAccount(deployAccountPayload);

            // if (response && 'contract_address' in response && 'transaction_hash' in response) {
            //   const { contract_address: AXdAth, transaction_hash: AXcontractFinalAddress } = response;
            //   console.log('✅ ArgentX wallet deployed at:', AXcontractFinalAddress);
            // } else {
            //   console.error('Failed to deploy account or response is undefined');
            // }


          }}
           type="button"
         >
           Deploy Wallet
         </button>
        ) : null}
        <CustomConnectButton />
        {/* <FaucetButton /> */}
        <SwitchTheme
          className={`pointer-events-auto ${
            isLocalNetwork ? "self-end md:self-auto" : ""
          }`}
        />
      </div>
    </div>
  );
};
