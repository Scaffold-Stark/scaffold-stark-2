import { useReadLocalStorage } from "usehooks-ts";
import { useEffect } from "react";
import { useConnect } from "@starknet-react/core";
import scaffoldConfig from "~~/scaffold.config";

/**
 * Automatically connect to a wallet/connector based on config and prior wallet
 */
export const useAutoConnect = (): void => {
  const wagmiWalletValue = useReadLocalStorage<string>("lastUsedConnector");
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (scaffoldConfig.walletAutoConnect) {
      const connector = connectors.find(
        (conn) => conn.name == wagmiWalletValue,
      );
      if (connector) {
        connect({ connector });
      }
    }
  }, []);
};
