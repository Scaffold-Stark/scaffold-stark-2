import { useAccount } from "~~/hooks/useAccount";
import {
  AccountInterface,
  InvokeFunctionResponse,
  constants,
  Call,
} from "starknet";
import { getBlockExplorerTxLink, notification } from "~~/utils/scaffold-stark";
import { useTargetNetwork } from "./useTargetNetwork";
import { useState, useEffect } from "react";
import {
  useSendTransaction,
  UseSendTransactionResult,
  useTransactionReceipt,
  UseTransactionReceiptResult,
} from "@starknet-react/core";

type TransactionFunc = (
  tx: Call[],
  // | SendTransactionParameters,
) => Promise<string | undefined>;

interface UseTransactorReturn {
  writeTransaction: TransactionFunc;
  transactionReceiptInstance: UseTransactionReceiptResult;
  sendTransactionInstance: UseSendTransactionResult;
}

/**
 * Custom notification content for TXs.
 */
const TxnNotification = ({
  message,
  blockExplorerLink,
}: {
  message: string;
  blockExplorerLink?: string;
}) => {
  return (
    <div className={`flex flex-col ml-1 cursor-default`}>
      <p className="my-0">{message}</p>
      {blockExplorerLink && blockExplorerLink.length > 0 ? (
        <a
          href={blockExplorerLink}
          target="_blank"
          rel="noreferrer"
          className="block link text-md"
        >
          check out transaction
        </a>
      ) : null}
    </div>
  );
};

/**
 * Runs Transaction passed in to returned function showing UI feedback.
 * @param _walletClient - Optional wallet client to use. If not provided, will use the one from useWalletClient.
 * @returns An object with the writeTransaction function, transaction status, and other transaction-related properties
 */
export const useTransactor = (
  _walletClient?: AccountInterface,
): UseTransactorReturn => {
  let walletClient = _walletClient;
  const { account, address, status } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  if (walletClient === undefined && account) {
    walletClient = account;
  }
  const sendTransactionInstance = useSendTransaction({});

  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [blockExplorerTxURL, setBlockExplorerTxURL] = useState<
    string | undefined
  >(undefined);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(
    undefined,
  );
  const transactionReceiptInstance = useTransactionReceipt({
    hash: transactionHash,
  });
  const { data: txResult, status: txStatus } = transactionReceiptInstance;

  const resetStates = () => {
    setTransactionHash(undefined);
    setBlockExplorerTxURL(undefined);
  };

  useEffect(() => {
    if (notificationId && txStatus && txStatus !== "pending") {
      notification.remove(notificationId);
    }
    if (txStatus === "success") {
      notification.success(
        <TxnNotification
          message="Transaction completed successfully!"
          blockExplorerLink={blockExplorerTxURL}
        />,
        {
          icon: "🎉",
        },
      );
      resetStates();
    }
  }, [txResult]);

  const writeTransaction = async (tx: Call[]): Promise<string | undefined> => {
    resetStates();
    if (!walletClient) {
      notification.error("Cannot access account");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      return;
    }

    let notificationId = null;
    let transactionHash:
      | Awaited<InvokeFunctionResponse>["transaction_hash"]
      | undefined = undefined;
    try {
      const networkId = await walletClient.getChainId();
      notificationId = notification.loading(
        <TxnNotification message="Awaiting for user confirmation" />,
      );
      if (tx != null) {
        // Tx is already prepared by the caller
        const result = await sendTransactionInstance.sendAsync(tx);
        if (typeof result === "string") {
          transactionHash = result;
        } else {
          transactionHash = result.transaction_hash;
        }
      } else {
        throw new Error("Incorrect transaction passed to transactor");
      }

      setTransactionHash(transactionHash);

      notification.remove(notificationId);

      const blockExplorerTxURL = networkId
        ? getBlockExplorerTxLink(targetNetwork.network, transactionHash)
        : "";
      setBlockExplorerTxURL(blockExplorerTxURL);

      notificationId = notification.loading(
        <TxnNotification
          message="Waiting for transaction to complete."
          blockExplorerLink={blockExplorerTxURL}
        />,
      );
      setNotificationId(notificationId);
    } catch (error: any) {
      if (notificationId) {
        notification.remove(notificationId);
      }

      const errorPattern = /Contract (.*?)"}/;
      const match = errorPattern.exec(error.message);
      const message = match ? match[1] : error.message;

      console.error("⚡️ ~ file: useTransactor.tsx ~ error", message);

      notification.error(message);
      throw error;
    }

    return transactionHash;
  };

  return {
    writeTransaction,
    transactionReceiptInstance,
    sendTransactionInstance,
  };
};
