import { useReadLocalStorage } from "usehooks-ts";
import { useEffect } from "react";
import { useConnect } from "@starknet-react/core";
import scaffoldConfig from "~~/scaffold.config";
import type { BurnerConnector } from "~~/services/web3/stark-burner/BurnerConnector";
import { burnerAccounts } from "~~/utils/devnetAccounts";

/**
 * Automatically connect to a wallet/connector based on config and prior wallet
 */
export const useAutoConnect = (): void => {
  const savedConnector = useReadLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
  );
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (scaffoldConfig.walletAutoConnect) {
      const connector = connectors.find(
        (conn) => conn.id == savedConnector?.id,
      );
      if (connector) {
        if (
          connector.id == "burner-wallet" &&
          savedConnector?.ix !== undefined
        ) {
          (connector as BurnerConnector).burnerAccount =
            burnerAccounts[savedConnector.ix];
        }
        connect({ connector });
      }
    }
  }, [connect, connectors, savedConnector]);
};
