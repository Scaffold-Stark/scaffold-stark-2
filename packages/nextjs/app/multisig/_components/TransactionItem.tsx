import React from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { BlockieAvatar } from "~~/components/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";
import {
  convertFeltToAddress,
  convertSelectorToFuncName,
  formatAddress,
  TransactionItemProps,
} from "../types";

const TransactionItem: React.FC<TransactionItemProps> = ({
  tx,
  signers,
  isSelected,
  onSelect,
  confirmTransaction,
  revokeConfirmation,
  executeTransaction,
  loading,
  isUserSigner,
  hasUserConfirmed,
}) => {
  return (
    <div
      className={`p-3 rounded ${isSelected ? "bg-blue-900" : "bg-gray-700"} cursor-pointer hover:bg-gray-600`}
      onClick={() => onSelect(tx.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-medium">ID: {formatAddress(tx.id)}</span>{" "}
          <span>
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
          </span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            tx.executed
              ? "bg-green-800"
              : tx.confirmations >= signers.length
                ? "bg-blue-800"
                : "bg-yellow-800"
          }`}
        >
          {tx.executed
            ? "Executed"
            : `${tx.confirmations}/${signers.length} confirmations`}
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
        <div>Function Name: {convertSelectorToFuncName(tx.selector)}</div>
      </div>

      {isSelected && !tx.executed && isUserSigner && (
        <div className="mt-3 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmTransaction(tx.id);
            }}
            disabled={loading}
            className="flex-1 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Confirm
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
            disabled={loading || tx.confirmations < signers.length}
            className="flex-1 py-1 text-xs rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {tx.confirmations >= signers.length
              ? "Execute"
              : "Need All Confirmations"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionItem;
