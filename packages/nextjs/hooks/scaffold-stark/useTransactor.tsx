import { useAccount } from "~~/hooks/useAccount";
import { Call } from "starknet";
import { getBlockExplorerTxLink, notification } from "~~/utils/scaffold-stark";
import { useTargetNetwork } from "./useTargetNetwork";
import { useState, useEffect } from "react";
import {
  useSendTransaction,
  UseSendTransactionResult,
  useTransactionReceipt,
  UseTransactionReceiptResult,
} from "@starknet-start/react";

type TransactionFunc = (tx: Call[]) => Promise<string | undefined>;

interface UseTransactorReturn {
  writeTransaction: TransactionFunc;
  transactionReceiptInstance: UseTransactionReceiptResult;
  sendTransactionInstance: UseSendTransactionResult;
}

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
 * Handles sending transactions to Starknet contracts with comprehensive UI feedback and state management.
 * Uses useSendTransaction from starknet-start to submit transactions through the connected wallet.
 *
 * @returns {UseTransactorReturn} An object containing:
 *   - writeTransaction: (tx: Call[]) => Promise<string | undefined> - Async function that sends transactions with notifications and state management
 *   - transactionReceiptInstance: UseTransactionReceiptResult - Transaction receipt data and status
 *   - sendTransactionInstance: UseSendTransactionResult - Send transaction state and methods
 * @see {@link https://scaffoldstark.com/docs/hooks/useTransactor}
 */
export const useTransactor = (): UseTransactorReturn => {
  const { address, status } = useAccount();
  const { targetNetwork } = useTargetNetwork();
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
    enabled: !!transactionHash,
    watch: true,
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
    }
  }, [txResult]);

  const writeTransaction = async (tx: Call[]): Promise<string | undefined> => {
    resetStates();
    if (!address || status !== "connected") {
      notification.error("Cannot access account");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      return;
    }

    let notificationId = null;
    let transactionHash: string | undefined = undefined;
    try {
      notificationId = notification.loading(
        <TxnNotification message="Awaiting for user confirmation" />,
      );

      const result = await sendTransactionInstance.sendAsync(tx);
      transactionHash =
        typeof result === "string" ? result : result.transaction_hash;

      setTransactionHash(transactionHash);

      notification.remove(notificationId);

      const blockExplorerTxURL = getBlockExplorerTxLink(
        targetNetwork.network,
        transactionHash,
      );
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
