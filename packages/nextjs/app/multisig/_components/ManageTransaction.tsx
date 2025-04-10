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

  const handleMultiplyToWei = () => {
    if (!transferAmount) {
      setTransferAmount("1000000000000000000");
      return;
    }

    try {
      const value = BigInt(transferAmount);
      const multiplied = value * 10n ** 18n;
      setTransferAmount(multiplied.toString());
    } catch (error) {
      console.error("Error converting to wei:", error);
      setTransferAmount("1000000000000000000");
    }
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
              <option value="transfer_fund">Transfer</option>
            </select>
          </div>
        </div>

        {(selectedOption === "add" || selectedOption === "remove") && (
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
              <label className="block text-sm mb-1">New Quorum Value:</label>
              <input
                type="number"
                min="1"
                max={
                  selectedOption === "add"
                    ? signers.length + 1
                    : signers.length - 1
                }
                value={newQuorum}
                onChange={handleNewQuorumChange}
                className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

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
              <label className="block text-sm mb-1">Amount:</label>
              <div className="relative">
                <input
                  type="text"
                  value={transferAmount || ""}
                  onChange={handleAmountChange}
                  placeholder="Enter amount..."
                  className="block w-full px-4 py-2 pr-12 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
            !selectedOption ||
            (selectedOption !== "transfer_fund" && !address) ||
            (selectedOption === "transfer_fund" &&
              (!transferRecipient || !transferAmount)) ||
            !account ||
            !deployedContractData
          }
          className="w-full rounded-md py-2 font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Create Transaction"}
        </button>
      </div>
    </div>
  );
};
