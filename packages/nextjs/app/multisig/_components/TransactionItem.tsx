import React from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { BlockieAvatar } from "~~/components/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";
import {
  convertFeltToAddress,
  formatAddress,
  formatTokenAmount,
} from "../utils";
import { TransactionItemProps } from "../types";

const TransactionItem: React.FC<TransactionItemProps> = ({
  tx,
  isSelected,
  onSelect,
  confirmTransaction,
  revokeConfirmation,
  executeTransaction,
  loading,
  isUserSigner,
  hasUserConfirmed,
  quorum,
}) => {
  const getTransactionQuorum = () => {
    if (tx.txQuorum !== undefined) {
      return tx.txQuorum;
    }

    if (
      (tx.selector === "add_signer" ||
        tx.selector === "remove_signer" ||
        tx.selector === "change_quorum") &&
      tx.calldata &&
      tx.calldata.length > 0
    ) {
      return Number(tx.calldata[0]);
    }
    if (
      tx.selector === "transfer_funds" &&
      tx.calldata &&
      tx.calldata.length > 0
    ) {
      return Number(tx.calldata[2]);
    }

    return null;
  };

  const txQuorum = getTransactionQuorum();

  const renderTransactionInfo = () => {
    const funcName = tx.selector;

    if (funcName === "transfer_funds") {
      const recipient = tx.calldata[0];
      try {
        return (
          <>
            <div>Function: Transfer Funds</div>
            <div>
              To Address: {formatAddress(convertFeltToAddress(recipient))}
            </div>
            <div>
              Amount: {formatTokenAmount(tx.calldata[1])}{" "}
              {tx.tokenType || "ETH"}
            </div>
          </>
        );
      } catch (error) {
        console.error("Error parsing transfer amount:", error);
        return (
          <>
            <div>Function: Transfer Funds</div>
            <div>
              To Address: {formatAddress(convertFeltToAddress(recipient))}
            </div>
            <div>Amount: Error parsing amount</div>
          </>
        );
      }
    } else if (funcName === "add_signer") {
      return (
        <>
          <div>Function: Add Signer</div>
          <div>
            New Signer:{" "}
            {formatAddress(convertFeltToAddress(tx.calldata[1] || ""))}
          </div>
        </>
      );
    } else if (funcName === "remove_signer") {
      return (
        <>
          <div>Function: Remove Signer</div>
          <div>
            Signer To Remove:{" "}
            {formatAddress(convertFeltToAddress(tx.calldata[1] || ""))}
          </div>
        </>
      );
    } else if (funcName === "change_quorum") {
      return (
        <>
          <div>Function: Change Quorum</div>
          <div>New Quorum: {txQuorum || tx.calldata[0]}</div>
        </>
      );
    }

    return <div>Function: {funcName || "Unknown..."}</div>;
  };

  return (
    <div
      className={`p-3 rounded ${isSelected ? "bg-blue-900" : "bg-gray-700"} cursor-pointer hover:bg-gray-600`}
      onClick={() => onSelect(tx.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2.5">
          <div className="font-medium">ID: {formatAddress(tx.id)}</div>{" "}
          <div>
            <CopyToClipboard
              text={tx.id}
              onCopy={() => {
                notification.success("Copy successfully!");
              }}
            >
              <button className="bg-gray-800 rounded-xl px-2 py-1 text-[10px]">
                Copy
              </button>
            </CopyToClipboard>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            tx.executed
              ? "bg-green-800"
              : tx.confirmations >= quorum
                ? "bg-blue-800"
                : "bg-yellow-800"
          }`}
        >
          {tx.executed
            ? "Executed"
            : `${tx.confirmations}/${quorum} confirmations`}
        </span>
      </div>

      <div className="text-xs text-gray-300 space-y-1">
        <div>To: {formatAddress(tx.to)}</div>
        <div className="flex items-center gap-2">
          Submitted by:
          <span className="flex items-center gap-1">
            <BlockieAvatar
              address={convertFeltToAddress(tx.submittedBy)}
              size={16}
            />{" "}
            {formatAddress(convertFeltToAddress(tx.submittedBy))}
          </span>
        </div>
        <div>Block: {tx.submittedBlock}</div>
        {renderTransactionInfo()}
      </div>

      {isUserSigner && !tx.executed && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmTransaction(tx.id);
            }}
            disabled={
              loading || hasUserConfirmed(tx) || tx.confirmations == quorum
            }
            className="flex-1 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {hasUserConfirmed(tx) ? "Confirmed" : "Confirm"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              revokeConfirmation(tx.id);
            }}
            disabled={loading || !hasUserConfirmed(tx)}
            className="flex-1 py-1 text-xs rounded bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Revoke
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              executeTransaction(tx.id);
            }}
            disabled={loading || tx.confirmations < quorum}
            className="flex-1 py-1 text-xs rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {tx.confirmations >= quorum
              ? "Execute"
              : `Need ${quorum - tx.confirmations} More`}
          </button>
        </div>
      )}

      {!isUserSigner && (
        <div className="mt-2 text-xs text-gray-400">
          You need to be a signer to interact with this transaction
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
