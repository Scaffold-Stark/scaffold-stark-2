import React from "react";
import TransactionItem from "./TransactionItem";
import { TransactionListProps } from "../types";

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loadingTransactions,
  selectedTxId,
  handleTxSelect,
  selectedTxType,
  handleTxTypeChange,
  loadTransactions,
  confirmTransaction,
  revokeConfirmation,
  executeTransaction,
  loading,
  quorum,
  isUserSigner,
  hasUserConfirmed,
  account,
  deployedContractData,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Transactions</h3>

        <div className="p-1 rounded-md bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <select
            value={selectedTxType}
            onChange={handleTxTypeChange}
            className="outline-none border-none bg-gray-700"
          >
            <option value="pending">Pending</option>
            <option value="executed">Executed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loadingTransactions ? (
        <div className="text-gray-400 my-4">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-gray-400 my-4">No transactions found</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              quorum={quorum}
              isSelected={selectedTxId === tx.id}
              onSelect={handleTxSelect}
              confirmTransaction={confirmTransaction}
              revokeConfirmation={revokeConfirmation}
              executeTransaction={executeTransaction}
              loading={loading}
              isUserSigner={isUserSigner()}
              hasUserConfirmed={hasUserConfirmed}
            />
          ))}
        </div>
      )}

      <button
        onClick={loadTransactions}
        disabled={loadingTransactions || !account || !deployedContractData}
        className="mt-4 w-full rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {loadingTransactions ? "Loading..." : "Refresh Transactions"}
      </button>
    </div>
  );
};

export default TransactionList;
