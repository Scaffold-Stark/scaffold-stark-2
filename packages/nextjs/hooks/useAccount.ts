import {
  UseAccountResult,
  useAccount as useStarknetStartAccount,
} from "@starknet-start/react";
import { useMemo } from "react";

/**
 * Wrapper around starknet-start's useAccount hook.
 * Provides connection status with corrected state handling.
 *
 * @returns {UseAccountResult} An object containing:
 *   - address: `0x${string}` | undefined - The user's wallet address
 *   - status: "disconnected" | "connecting" | "connected" | "reconnecting" - Connection status
 *   - chainId: bigint | undefined - The chain ID of the connected network
 *   - isConnected: boolean | undefined - Boolean indicating if the user is connected
 *   - connector: WalletWithStarknetFeatures | undefined - The connected wallet
 */

export function useAccount(): UseAccountResult {
  const account = useStarknetStartAccount();

  const correctedStatus = useMemo(() => {
    if (account.status === "connected" && !account.address) {
      return "connecting" as const;
    }
    return account.status;
  }, [account.status, account.address]);

  return {
    ...account,
    status: correctedStatus,
  };
}
