import {
  UseAccountResult,
  useAccount as useStarknetReactAccount,
} from "@starknet-react/core";
import { useEffect, useState, useMemo } from "react";
import { AccountInterface, constants } from "starknet";

/**
 * Wrapper around starknet react's useAccount hook to fix inconsistencies
 */
export function useAccount(): UseAccountResult {
  const starknetAccount = useStarknetReactAccount();
  const { account, address, status } = starknetAccount;

  const correctedStatus = useMemo(() => {
    if (status === "connected" && !account) {
      return "connecting";
    }
    return status;
  }, [status, account]);

  const [accountChainId, setAccountChainId] = useState<bigint>(0n);

  useEffect(() => {
    if (account) {
      const getChainId = async () => {
        try {
          let chainId: string | bigint;

          if (typeof account.getChainId === "function") {
            chainId = await account.getChainId();
          } else if ((account as any).channel?.getChainId) {
            chainId = await (account as any).channel.getChainId();
          } else {
            chainId = constants.StarknetChainId.SN_MAIN;
          }

          if (chainId) {
            setAccountChainId(BigInt(chainId.toString()));
          }
        } catch (error) {
          setAccountChainId(BigInt(constants.StarknetChainId.SN_MAIN));
        }
      };

      getChainId();
    }
  }, [account]);

  const patchedAccount = useMemo(() => {
    if (status === "connected" && address && !account) {
      const provisionalAccount = {
        address,
        execute: async () => {
          throw new Error(
            "Wallet connection issue. Please refresh and reconnect.",
          );
        },
        estimateInvokeFee: async () => {
          throw new Error(
            "Wallet connection issue. Please refresh and reconnect.",
          );
        },
        getChainId: async () => {
          return constants.StarknetChainId.SN_MAIN;
        },
        cairoVersion: "1",
        signer: {},
      };

      return provisionalAccount as unknown as AccountInterface;
    }

    return account;
  }, [status, address, account]);

  return {
    ...starknetAccount,
    account: patchedAccount,
    status: correctedStatus,
    chainId: accountChainId,
  } as UseAccountResult;
}
