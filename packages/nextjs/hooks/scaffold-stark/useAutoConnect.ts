import { useEffect } from "react";
import { useConnect } from "@starknet-react/core";
import { useReadLocalStorage } from "usehooks-ts";
import { BurnerConnector, burnerAccounts } from "@scaffold-stark/stark-burner";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { useAccount } from "~~/hooks/useAccount";

export const useAutoConnect = (): void => {
  const savedConnector = useReadLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
  );
  const lastConnectionTime = useReadLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
  );
  const wasDisconnectedManually =
    localStorage.getItem("wasDisconnectedManually") === "true";

  const { connect, connectors } = useConnect();
  const { account } = useAccount();

  useEffect(() => {
    if (!scaffoldConfig.walletAutoConnect || wasDisconnectedManually) return;

    const now = Date.now();
    const ttlExpired =
      now - (lastConnectionTime || 0) > scaffoldConfig.autoConnectTTL;

    const connector = connectors.find((c) => c.id === savedConnector?.id);
    if (!connector || !connector.ready) return;

    const shouldReconnect = !account || ttlExpired;

    if (
      connector.id === "burner-wallet" &&
      savedConnector?.ix !== undefined &&
      connector instanceof BurnerConnector
    ) {
      connector.burnerAccount = burnerAccounts[savedConnector.ix];
    }

    if (shouldReconnect) {
      connect({ connector });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, connectors, savedConnector, lastConnectionTime, account]);
};
