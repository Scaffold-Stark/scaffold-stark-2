import { useEffect, useRef } from "react";
import { useConnect } from "@starknet-start/react";
import { useReadLocalStorage } from "usehooks-ts";
import { burnerWalletId } from "@scaffold-stark/stark-burner";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { useAccount } from "~~/hooks/useAccount";

/**
 * Auto-connects wallet if user has connected before and meets auto-connect criteria.
 * This hook automatically reconnects the user's wallet on app initialization if:
 * - Auto-connect is enabled in scaffold config
 * - User was not manually disconnected
 * - Time since last connection hasn't exceeded TTL
 * - The previously used connector is available
 *
 * @returns {void} This hook doesn't return any value but performs auto-connection side effects
 */
export const useAutoConnect = (): void => {
  const savedConnector = useReadLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
  );
  const lastConnectionTime = useReadLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
  );
  const wasDisconnectedManually = useReadLocalStorage<boolean>(
    "wasDisconnectedManually",
  );

  const { connect, connectors } = useConnect();
  const { status } = useAccount();

  const hasAutoConnected = useRef(false);

  useEffect(() => {
    if (hasAutoConnected.current) return;
    if (!scaffoldConfig.walletAutoConnect || wasDisconnectedManually) return;

    const now = Date.now();
    const ttlExpired =
      now - (lastConnectionTime || 0) > scaffoldConfig.autoConnectTTL;

    const connector = connectors.find(
      (c) =>
        c.name === savedConnector?.id || c.instanceId === savedConnector?.id,
    );
    if (!connector) return;

    const shouldReconnect = status !== "connected" || ttlExpired;

    // Restore burner account selection before connecting
    if (
      (connector.name === burnerWalletId ||
        connector.name === "Burner Wallet") &&
      savedConnector?.ix !== undefined &&
      "switchAccount" in connector
    ) {
      (connector as any).switchAccount(savedConnector.ix);
    }

    if (shouldReconnect) {
      hasAutoConnected.current = true;
      connect({ connector });
    }
  }, [
    connect,
    connectors,
    savedConnector,
    lastConnectionTime,
    status,
    wasDisconnectedManually,
  ]);
};
