"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useConnect } from "@starknet-react/core";
import { getWallet, isAuthenticated } from "~~/services/web3/privy/storage";

export const usePrivyAutoConnect = () => {
  const { authenticated, user } = usePrivy();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const autoConnectPrivyWallet = async () => {
      if (!authenticated || !user?.id || typeof window === "undefined") return;

      try {
        // Check if we have stored wallet info and Privy token exists
        const wallet = getWallet();
        const hasAuth = isAuthenticated();

        // Only auto-connect if we have wallet info and Privy token exists
        if (wallet.walletId && wallet.walletAddress && hasAuth) {
          // Find the Privy connector
          const privyConnector = connectors.find(
            (connector) => connector.id === "privy",
          );

          if (privyConnector) {
            try {
              await connect({ connector: privyConnector });
              console.log("Auto-connected Privy wallet");
            } catch (error) {
              console.error("Failed to auto-connect Privy wallet:", error);
            }
          }
        }
      } catch (error) {
        console.error("Auto-connect error:", error);
      }
    };

    // Small delay to ensure everything is initialized
    const timeoutId = setTimeout(autoConnectPrivyWallet, 1000);
    return () => clearTimeout(timeoutId);
  }, [authenticated, user?.id, connect, connectors]);
};
