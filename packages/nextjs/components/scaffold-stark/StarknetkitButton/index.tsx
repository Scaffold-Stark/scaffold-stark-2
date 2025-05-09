import { useCallback, useEffect, useState } from "react";
import { connect, disconnect, StarknetkitConnector } from "starknetkit";
import { BurnerConnector, burnerAccounts } from "@scaffold-stark/stark-burner";
import { useLocalStorage } from "usehooks-ts";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
} from "@starknet-react/core";
import { AddressInfoDropdown } from "../CustomConnectButton/AddressInfoDropdown";
import { AddressQRCodeModal } from "../CustomConnectButton/AddressQRCodeModal";
import { WrongNetworkDropdown } from "../CustomConnectButton/WrongNetworkDropdown";
import { Balance } from "../Balance";
import { Address } from "@starknet-react/chains";
import { useAutoConnect, useNetworkColor } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-stark";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { useMemo } from "react";
import BurnerWalletModal from "./BurnerWalletModal";

export const StarknetkitButton = () => {
  useAutoConnect();
  const networkColor = useNetworkColor();
  const { connector } = useConnect();
  const { targetNetwork } = useTargetNetwork();
  const { account, status, address: accountAddress } = useAccount();
  const [accountChainId, setAccountChainId] = useState<bigint>(0n);
  const { chain } = useNetwork();
  const [isBurnerModalOpen, setIsBurnerModalOpen] = useState(false);
  const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
    {
      initializeWithValue: false,
    },
  );
  const [, setLastConnectionTime] = useLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
    0,
  );

  const blockExplorerAddressLink = useMemo(() => {
    return (
      accountAddress &&
      getBlockExplorerAddressLink(targetNetwork, accountAddress)
    );
  }, [accountAddress, targetNetwork]);

  // effect to get chain id and address from account
  useEffect(() => {
    if (account) {
      const getChainId = async () => {
        const chainId = await account.channel.getChainId();
        setAccountChainId(BigInt(chainId as string));
      };

      getChainId();
    }
  }, [account, status]);

  useEffect(() => {
    const handleChainChange = (event: { chainId?: bigint }) => {
      const { chainId } = event;
      if (chainId && chainId !== accountChainId) {
        setAccountChainId(chainId);
      }
    };
    connector?.on("change", handleChainChange);
    return () => {
      connector?.off("change", handleChainChange);
    };
  }, [connector, accountChainId]);

  const { connectors, connect: connectWithConnector } = useConnect();

  const handleConnectionWithStarknetKit = useCallback(async () => {
    const starknetkitConnectors = connectors.filter(
      (connector) => connector.id !== "burner-wallet",
    ) as StarknetkitConnector[];

    const { wallet } = await connect({
      dappName: "Scaffold Stark",
      connectors: starknetkitConnectors,
    });

    if (wallet) {
      const selectedConnector = connectors.find((c) => c.id === wallet.id);

      if (selectedConnector) {
        connectWithConnector({ connector: selectedConnector });
        setLastConnector({ id: selectedConnector.id });
        setLastConnectionTime(Date.now());
      }
    }
  }, [
    connectors,
    connectWithConnector,
    setLastConnector,
    setLastConnectionTime,
  ]);

  const handleBurnerWallet = useCallback(() => {
    setIsBurnerModalOpen(true);
  }, []);

  const handleConnectBurner = useCallback(
    (ix: number) => {
      const connector = connectors.find((it) => it.id === "burner-wallet");
      if (connector && connector instanceof BurnerConnector) {
        connector.burnerAccount = burnerAccounts[ix];
        connectWithConnector({ connector });
        setLastConnector({ id: connector.id, ix });
        setLastConnectionTime(Date.now());
        setIsBurnerModalOpen(false);
      }
    },
    [connectors, connectWithConnector, setLastConnector, setLastConnectionTime],
  );

  if (status === "disconnected" || accountChainId === 0n) {
    const isDevnet = targetNetwork.network === "devnet";

    return (
      <div className="flex space-x-2">
        <button
          onClick={handleConnectionWithStarknetKit}
          className="rounded-[18px] btn-sm font-bold px-4 bg-btn-wallet py-3 cursor-pointer flex items-center justify-center"
        >
          <span>Connect Wallet</span>
        </button>

        {isDevnet && (
          <button
            onClick={handleBurnerWallet}
            className="rounded-[18px] btn-sm font-bold px-4 bg-secondary py-3 cursor-pointer flex items-center justify-center"
          >
            <span>Burner Wallet</span>
          </button>
        )}

        <BurnerWalletModal
          isOpen={isBurnerModalOpen}
          onClose={() => setIsBurnerModalOpen(false)}
          onSelectBurner={handleConnectBurner}
        />
      </div>
    );
  }

  if (accountChainId !== targetNetwork.id) {
    return <WrongNetworkDropdown />;
  }

  return (
    <>
      <div className="flex flex-col items-center max-sm:mt-2">
        <Balance
          address={accountAddress as Address}
          className="min-h-0 h-auto"
        />
        <span className="text-xs ml-1" style={{ color: networkColor }}>
          {chain.name}
        </span>
      </div>
      <AddressInfoDropdown
        address={accountAddress as Address}
        displayName={""}
        ensAvatar={""}
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal
        address={accountAddress as Address}
        modalId="qrcode-modal"
      />
    </>
  );
};
