import React from "react";
import { ManageTransactionProps } from "../types";

export const ManageTransaction: React.FC<ManageTransactionProps> = ({
  account,
  deployedContractData,
  selectedOption,
  handleSelectChange,
  address,
  handleSignerChange,
  newQuorum,
  handleNewQuorumChange,
  transferRecipient,
  setTransferRecipient,
  transferAmount,
  setTransferAmount,
  createSignerTransaction,
  createTransferTransaction,
  loading,
  signers,
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setTransferAmount("");
      return;
    }

    const decimalNumberRegex = /^[0-9]*\.?[0-9]*$/;
    if (decimalNumberRegex.test(value)) {
      setTransferAmount(value);
    }
  };

  const getMaxQuorumValue = () => {
    return signers.length;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Manage Transaction</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Action:</label>
          <div className="block w-full px-1 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <select
              value={selectedOption}
              onChange={handleSelectChange}
              className="bg-gray-700 w-full outline-none border-none"
            >
              <option value="add">Add Signer</option>
              <option value="remove">Remove Signer</option>
              {/* <option value="change_quorum">Change Quorum</option> */}
              <option value="transfer_fund">Transfer</option>
            </select>
          </div>
        </div>

        {selectedOption === "add" && (
          <>
            <div>
              <label className="block text-sm mb-1">Signer Address:</label>
              <input
                type="text"
                value={address}
                onChange={handleSignerChange}
                placeholder="Enter wallet address"
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">New Quorum:</label>
              <input
                type="number"
                min="1"
                max={getMaxQuorumValue()}
                value={newQuorum}
                onChange={handleNewQuorumChange}
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {selectedOption === "remove" && (
          <>
            <div>
              <label className="block text-sm mb-1">Signer Address:</label>
              <input
                type="text"
                value={address}
                onChange={handleSignerChange}
                placeholder="Enter wallet address"
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">New Quorum:</label>
              <input
                type="number"
                min="1"
                max={getMaxQuorumValue()}
                value={newQuorum}
                onChange={handleNewQuorumChange}
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* {selectedOption === "change_quorum" && (
          <div>
            <label className="block text-sm mb-1">Quorum Value:</label>
            <input
              type="number"
              min="1"
              max={getMaxQuorumValue()}
              value={newQuorum}
              onChange={handleNewQuorumChange}
              className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )} */}

        {selectedOption === "transfer_fund" && (
          <>
            <div>
              <label className="block text-sm mb-1">Recipient Address:</label>
              <input
                type="text"
                value={transferRecipient || ""}
                onChange={(e) => setTransferRecipient(e.target.value)}
                placeholder="Enter recipient wallet address"
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Amount (ETH):</label>
              <div className="relative">
                <input
                  type="text"
                  value={transferAmount || ""}
                  onChange={handleAmountChange}
                  placeholder="Enter amount in ETH"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* <div>
              <label className="block text-sm mb-1">Quorum Value:</label>
              <input
                type="number"
                min="1"
                max={getMaxQuorumValue()}
                value={newQuorum}
                onChange={handleNewQuorumChange}
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div> */}
          </>
        )}

        <button
          onClick={
            selectedOption === "transfer_fund"
              ? createTransferTransaction
              : createSignerTransaction
          }
          disabled={
            loading ||
            newQuorum > getMaxQuorumValue() ||
            !selectedOption ||
            (selectedOption === "add" && !address) ||
            (selectedOption === "remove" && !address) ||
            (selectedOption === "transfer_fund" &&
              (!transferRecipient || !transferAmount)) ||
            !account ||
            !deployedContractData
          }
          className="w-full rounded-md py-2 font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Create Transaction"}
        </button>

        <div className="text-xs text-gray-400 mt-2">
          Note: After creating a transaction, it needs {newQuorum} confirmations
          to be executed.
        </div>
      </div>
    </div>
  );
};
