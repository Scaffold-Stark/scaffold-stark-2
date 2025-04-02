"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAccount, useConnect } from "@starknet-react/core";
import { Contract, CallData, shortString, hash } from "starknet";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";
import CopyToClipboard from "react-copy-to-clipboard";

type SignerOption = "" | "add" | "remove";
type TxType = "pending" | "executed" | "all";

interface Transaction {
  id: string;
  to: string;
  selector: string;
  confirmations: number;
  executed: boolean;
  submittedBy: string;
  submittedBlock: string;
  salt: string;
  calldata: string[];
}

interface ExecuteTransactionParams {
  to: string;
  selector: string;
  calldata: string[];
  salt: string;
}

const convertFeltToAddress = (felt: string) => {
  if (!felt) return "";

  let hexString;
  if (felt.startsWith("0x")) {
    hexString = felt;
  } else {
    try {
      hexString = "0x" + BigInt(felt).toString(16);
    } catch (e) {
      console.error("Error converting felt to address:", e);
      return felt;
    }
  }

  return hexString;
};

const MultisigPage = () => {
  const { account } = useAccount();
  const { data: deployedContractData } = useDeployedContractInfo(
    "CustomMultisigWallet",
  );

  const [selectedOption, setSelectedOption] = useState<SignerOption>("");
  const [address, setAddress] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [customSelector, setCustomSelector] = useState<string>("");
  const [customCalldata, setCustomCalldata] = useState<string>("");
  const [newQuorum, setNewQuorum] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const [signers, setSigners] = useState<string[]>([]);
  const [quorum, setQuorum] = useState<number>(0);
  const [loadingSigners, setLoadingSigners] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    [],
  );
  const [executedTransactions, setExecutedTransactions] = useState<
    Transaction[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTxType, setSelectedTxType] = useState<TxType>("pending");
  const [selectedTxId, setSelectedTxId] = useState<string>("");
  const [transactionDetails, setTransactionDetails] = useState<{
    [key: string]: Transaction;
  }>({});

  const { data: submittedTxEvents } = useScaffoldEventHistory({
    contractName: "CustomMultisigWallet",
    eventName:
      "contracts::CustomMultisigComponent::MultisigComponent::TransactionSubmitted",
    fromBlock: 0n,
    watch: true,
  });

  const { data: confirmedTxEvents } = useScaffoldEventHistory({
    contractName: "CustomMultisigWallet",
    eventName:
      "contracts::CustomMultisigComponent::MultisigComponent::TransactionConfirmed",
    fromBlock: 0n,
    watch: true,
  });

  const { data: executedTxEvents } = useScaffoldEventHistory({
    contractName: "CustomMultisigWallet",
    eventName:
      "contracts::CustomMultisigComponent::MultisigComponent::TransactionExecuted",
    fromBlock: 0n,
    watch: true,
  });

  const { data: signerAddedEvents } = useScaffoldEventHistory({
    contractName: "CustomMultisigWallet",
    eventName:
      "contracts::CustomMultisigComponent::MultisigComponent::SignerAdded",
    fromBlock: 0n,
    watch: true,
  });

  const { data: signerRemovedEvents } = useScaffoldEventHistory({
    contractName: "CustomMultisigWallet",
    eventName:
      "contracts::CustomMultisigComponent::MultisigComponent::SignerRemoved",
    fromBlock: 0n,
    watch: true,
  });

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SignerOption;
    setSelectedOption(value);
  };

  const handleSignerChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleTransactionIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTransactionId(e.target.value);
  };

  const handleToAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomTo(e.target.value);
  };

  const handleSelectorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomSelector(e.target.value);
  };

  const handleCalldataChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCustomCalldata(e.target.value);
  };

  const handleNewQuorumChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setNewQuorum(isNaN(value) ? 1 : value);
  };

  const handleTxTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTxType(e.target.value as TxType);
  };

  const handleTxSelect = async (id: string) => {
    if (selectedTxId === id) {
      setSelectedTxId("");
      return;
    }

    setSelectedTxId(id);
  };

  const getContract = () => {
    if (!account || !deployedContractData)
      throw new Error("No account connected or contract not loaded");

    return new Contract(
      deployedContractData.abi,
      deployedContractData.address,
      account,
    );
  };

  const loadSigners = async () => {
    if (!account || !deployedContractData) return;

    setLoadingSigners(true);
    try {
      const contract = getContract();

      const quorumResult = await contract.get_quorum();
      setQuorum(Number(quorumResult));

      const signersResult = await contract.get_signers();

      const formattedSigners = signersResult.map((signer: any) => {
        const signerStr = signer.toString();
        return signerStr;
      });

      setSigners(formattedSigners);
    } catch (err: any) {
      console.error("Error loading signers:", err);
      notification.error("Error loading signers: " + err.message);
    } finally {
      setLoadingSigners(false);
    }
  };

  const loadTransactions = async () => {
    if (!account || !deployedContractData) return;

    setLoadingTransactions(true);
    try {
      const pending: Transaction[] = [];
      const executed: Transaction[] = [];
      const contract = getContract();

      if (submittedTxEvents && submittedTxEvents.length > 0) {
        for (const event of submittedTxEvents) {
          try {
            const txId = event.args.id.toString();
            const signer = event.args.signer.toString();

            const isExecuted = await contract.is_executed(txId);
            const confirmations =
              await contract.get_transaction_confirmations(txId);
            const submittedBlock = await contract.get_submitted_block(txId);

            const storedTxData = transactionDetails[txId];

            const tx: Transaction = {
              id: txId,
              to: storedTxData?.to || deployedContractData.address,
              selector: storedTxData?.selector || "",
              confirmations: Number(confirmations),
              executed: Boolean(isExecuted),
              submittedBy: signer,
              submittedBlock: submittedBlock.toString(),
              salt: storedTxData?.salt || "0",
              calldata: storedTxData?.calldata || [],
            };

            if (storedTxData) {
              setTransactionDetails((prev) => ({
                ...prev,
                [txId]: {
                  ...storedTxData,
                  confirmations: Number(confirmations),
                  executed: Boolean(isExecuted),
                  submittedBlock: submittedBlock.toString(),
                },
              }));
            }

            if (isExecuted) {
              executed.push(tx);
            } else {
              pending.push(tx);

              if (Number(confirmations) >= quorum && !isExecuted) {
                const txDetails = storedTxData || tx;
                try {
                  await contract.execute_transaction(
                    txDetails.to,
                    txDetails.selector,
                    txDetails.calldata,
                    txDetails.salt,
                  );
                } catch (execErr) {
                  console.error("Error auto-executing transaction:", execErr);
                }
              }
            }
          } catch (err) {
            console.error("Error processing transaction:", err);
          }
        }
      }

      setPendingTransactions(pending);
      setExecutedTransactions(executed);

      if (selectedTxType === "pending") {
        setTransactions(pending);
      } else if (selectedTxType === "executed") {
        setTransactions(executed);
      } else {
        setTransactions([...pending, ...executed]);
      }
    } catch (err: any) {
      console.error("Error loading transactions:", err);
      notification.error("Error loading transactions: " + err.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (account && deployedContractData) {
      loadSigners();
      loadTransactions();
    }
  }, [account, deployedContractData]);

  useEffect(() => {
    if (submittedTxEvents || confirmedTxEvents || executedTxEvents) {
      loadTransactions();
    }
  }, [submittedTxEvents, confirmedTxEvents, executedTxEvents]);

  useEffect(() => {
    if (signerAddedEvents || signerRemovedEvents) {
      loadSigners();
    }
  }, [signerAddedEvents, signerRemovedEvents]);

  useEffect(() => {
    if (selectedTxType === "pending") {
      setTransactions(pendingTransactions);
    } else if (selectedTxType === "executed") {
      setTransactions(executedTransactions);
    } else {
      setTransactions([...pendingTransactions, ...executedTransactions]);
    }
  }, [selectedTxType, pendingTransactions, executedTransactions]);

  const createSignerTransaction = async () => {
    if (!account || !deployedContractData) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!address) {
      notification.error("Please enter a valid address");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      const contractAddress = deployedContractData.address;
      const salt = "0";
      let selector = "";
      let calldata: any[] = [];

      if (selectedOption === "add") {
        selector = hash.getSelectorFromName("add_signer");
        calldata = CallData.compile({
          new_quorum: newQuorum,
          signer_to_add: address,
        });
      } else if (selectedOption === "remove") {
        const validNewQuorum = Math.min(newQuorum, signers.length - 1);
        selector = hash.getSelectorFromName("remove_signers");
        calldata = CallData.compile({
          new_quorum: validNewQuorum,
          signers_to_remove: [address],
        });
      }

      const txIdResponse = await contract.hash_transaction(
        contractAddress,
        selector,
        calldata,
        salt,
      );

      await contract.submit_transaction(
        contractAddress,
        selector,
        calldata,
        salt,
      );

      const txIdString = txIdResponse.toString();
      setTransactionId(txIdString);

      setTransactionDetails((prev) => ({
        ...prev,
        [txIdString]: {
          id: txIdString,
          to: contractAddress,
          selector: selector,
          calldata: calldata,
          salt: salt,
          confirmations: 1,
          executed: false,
          submittedBy: account.address,
          submittedBlock: "pending",
        },
      }));

      notification.success(
        `Transaction to ${selectedOption} signer submitted. ID: ${txIdString}`,
      );

      setAddress("");
      setSelectedOption("");

      if (quorum <= 1) {
        try {
          await executeTransaction(txIdString);
        } catch (execErr) {
          console.error("Error auto-executing transaction:", execErr);
        }
      }

      await Promise.all([loadSigners(), loadTransactions()]);
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      notification.error(err.message || "Error creating transaction");
    } finally {
      setLoading(false);
    }
  };

  const confirmTransaction = async (txId: string) => {
    if (!account || !deployedContractData || !txId) {
      notification.error(
        "Please connect your wallet and provide a transaction ID",
      );
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();

      await contract.confirm_transaction(txId);
      notification.success("Transaction confirmed successfully");

      const confirmations = await contract.get_transaction_confirmations(txId);
      const isExecuted = await contract.is_executed(txId);

      if (Number(confirmations) >= quorum && !isExecuted) {
        const storedTx = transactionDetails[txId];
        if (storedTx) {
          try {
            await contract.execute_transaction(
              storedTx.to,
              storedTx.selector,
              storedTx.calldata,
              storedTx.salt,
            );
            notification.success("Transaction auto-executed successfully");
          } catch (execErr) {
            console.error("Error auto-executing transaction:", execErr);
            notification.error(
              "Auto-execution failed, please execute manually",
            );
          }
        }
      }

      await loadTransactions();
    } catch (err: any) {
      console.error("Error confirming transaction:", err);
      notification.error(err.message || "Error confirming transaction");
    } finally {
      setLoading(false);
      setTransactionId("");
    }
  };

  const revokeConfirmation = async (txId: string) => {
    if (!account || !deployedContractData || !txId) {
      notification.error(
        "Please connect your wallet and provide a transaction ID",
      );
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();

      await contract.revoke_confirmation(txId);

      notification.success("Confirmation revoked successfully");
      await loadTransactions();
    } catch (err: any) {
      console.error("Error revoking confirmation:", err);
      notification.error(err.message || "Error revoking confirmation");
    } finally {
      setLoading(false);
      setTransactionId("");
    }
  };

  const executeTransaction = async (txId: string) => {
    if (!account || !deployedContractData || !txId) {
      notification.error("Transaction ID is required for execution");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();

      const storedTx = transactionDetails[txId];

      if (storedTx) {
        await contract.execute_transaction(
          storedTx.to,
          storedTx.selector,
          storedTx.calldata,
          storedTx.salt,
        );
      } else {
        const transaction = transactions.find((tx) => tx.id === txId);

        if (!transaction) {
          throw new Error("Transaction data not found");
        }

        await contract.execute_transaction(
          transaction.to,
          transaction.selector,
          transaction.calldata,
          transaction.salt,
        );
      }

      notification.success("Transaction executed successfully");

      await Promise.all([loadSigners(), loadTransactions()]);
    } catch (err: any) {
      console.error("Error executing transaction:", err);
      notification.error(err.message || "Error executing transaction");
    } finally {
      setLoading(false);
      setTransactionId("");
    }
  };

  const formatAddress = (address: string) => {
    if (!address || address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const isUserSigner = () => {
    const signersAddresses = signers.map(convertFeltToAddress);
    const normalizedUserAddress = account?.address.startsWith("0x")
      ? account.address.toLowerCase()
      : "0x" + account?.address.toLowerCase();

    return signersAddresses.some(
      (address) => address.toLowerCase() === normalizedUserAddress,
    );
  };

  return (
    <section className="max-w-screen-2xl mx-auto mt-8 px-4 pb-12">
      <h1 className="text-2xl font-bold mb-6">Multisig Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Wallet Information</h3>

            {deployedContractData && (
              <div className="mb-4">
                <div className="text-sm mb-2">
                  <span className="font-semibold">Contract Address:</span>
                  <CopyToClipboard
                    text="deployedContractData.address"
                    onCopy={() => {
                      notification.success("Copy successfully!");
                    }}
                  >
                    <span className="font-mono text-xs ml-2 break-all cursor-pointer">
                      {deployedContractData.address}
                    </span>
                  </CopyToClipboard>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Required Signatures:</span>
                  <span className="ml-2">
                    {loadingSigners ? "Loading..." : `${signers.length}`}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Current Signers:</h4>
              {loadingSigners ? (
                <div className="text-gray-400">Loading signers...</div>
              ) : signers.length === 0 ? (
                <div className="text-gray-400">No signers found</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {signers.map((address, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 rounded bg-gray-700 flex justify-between items-center"
                    >
                      <span className="font-mono break-all">
                        {convertFeltToAddress(address)}
                      </span>
                      {address === account?.address && (
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded ml-2">
                          You
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={loadSigners}
              disabled={loadingSigners || !account || !deployedContractData}
              className="mt-4 w-full rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loadingSigners ? "Loading..." : "Refresh Signers"}
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Manage Signers</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Action:</label>
                <select
                  value={selectedOption}
                  onChange={handleSelectChange}
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select an action
                  </option>
                  <option value="add">Add Signer</option>
                  <option value="remove">Remove Signer</option>
                </select>
              </div>

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

              <button
                onClick={createSignerTransaction}
                disabled={
                  loading ||
                  !selectedOption ||
                  !address ||
                  !account ||
                  !deployedContractData
                }
                className="w-full rounded-md py-2 font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Create Transaction"}
              </button>
            </div>
          </div>

          {/* <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Create Custom Transaction
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">
                  Target Contract Address:
                </label>
                <input
                  type="text"
                  value={customTo}
                  onChange={handleToAddressChange}
                  placeholder="Contract address to call"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Function Selector:</label>
                <input
                  type="text"
                  value={customSelector}
                  onChange={handleSelectorChange}
                  placeholder="Function name or hex selector"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Either function name (e.g. &quot;transfer&quot;) or hex
                  selector
                </p>
              </div>

              <div>
                <label className="block text-sm mb-1">Calldata (JSON):</label>
                <textarea
                  value={customCalldata}
                  onChange={handleCalldataChange}
                  placeholder='["param1", "param2"]'
                  rows={3}
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  JSON array of parameters
                </p>
              </div>

              <button
                onClick={createCustomTransaction}
                disabled={
                  loading ||
                  !customTo ||
                  !customSelector ||
                  !account ||
                  !deployedContractData ||
                  !isUserSigner()
                }
                className="w-full rounded-md py-2 font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Submit Custom Transaction"}
              </button>
            </div>
          </div> */}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Transactions</h3>

              <select
                value={selectedTxType}
                onChange={handleTxTypeChange}
                className="px-3 py-1 rounded-md bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="executed">Executed</option>
                <option value="all">All</option>
              </select>
            </div>

            {loadingTransactions ? (
              <div className="text-gray-400 my-4">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-gray-400 my-4">No transactions found</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3 rounded ${selectedTxId === tx.id ? "bg-blue-900" : "bg-gray-700"} cursor-pointer hover:bg-gray-600`}
                    onClick={() => handleTxSelect(tx.id)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-medium">
                          ID: {formatAddress(tx.id)}
                        </span>{" "}
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
                        className={`text-xs px-2 py-1 rounded ${tx.executed ? "bg-green-800" : tx.confirmations >= quorum ? "bg-blue-800" : "bg-yellow-800"}`}
                      >
                        {tx.executed
                          ? "Executed"
                          : `${tx.confirmations}/${quorum} confirmations`}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300 space-y-1">
                      <div>To: {formatAddress(tx.to)}</div>
                      <div>
                        Submitted by:{" "}
                        {formatAddress(convertFeltToAddress(tx.submittedBy))}
                      </div>
                      <div>Block: {tx.submittedBlock}</div>
                    </div>

                    {selectedTxId === tx.id &&
                      !tx.executed &&
                      isUserSigner() && (
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
                            disabled={loading}
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
                              : "Not Ready"}
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => loadTransactions()}
              disabled={
                loadingTransactions ||
                !account ||
                !deployedContractData ||
                !pendingTransactions.length
              }
              className="mt-4 w-full rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loadingTransactions ? "Loading..." : "Refresh Transactions"}
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Transaction by ID</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Transaction ID:</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={handleTransactionIdChange}
                  placeholder="Enter transaction ID"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => confirmTransaction(transactionId)}
                  disabled={
                    loading ||
                    !transactionId ||
                    !account ||
                    !deployedContractData ||
                    !isUserSigner()
                  }
                  className="flex-1 rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>

                <button
                  onClick={() => revokeConfirmation(transactionId)}
                  disabled={
                    loading ||
                    !transactionId ||
                    !account ||
                    !deployedContractData ||
                    !isUserSigner()
                  }
                  className="flex-1 rounded-md py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Revoke"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Transaction Events</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Recent Submitted Transactions:
                </h4>
                {!submittedTxEvents || submittedTxEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">No recent submissions</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto">
                    {submittedTxEvents.slice(0, 5).map((event, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 my-1 rounded bg-gray-700"
                      >
                        <div className="space-y-2">
                          <div className="font-mono text-xs">
                            ID: {formatAddress(event.args.id.toString())}
                          </div>
                          <div className="text-xs text-gray-400">
                            By:{" "}
                            {convertFeltToAddress(event.args.signer.toString())}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Recent Confirmations:
                </h4>
                {!confirmedTxEvents || confirmedTxEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No recent confirmations
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto">
                    {confirmedTxEvents.slice(0, 5).map((event, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 my-1 rounded bg-gray-700"
                      >
                        <div className="space-y-3">
                          <div className="font-mono text-xs">
                            ID: {formatAddress(event.args.id.toString())}
                          </div>
                          <div className="text-xs text-gray-400">
                            By:{" "}
                            {convertFeltToAddress(event.args.signer.toString())}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Recent Executions:
                </h4>
                {!executedTxEvents || executedTxEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">No recent executions</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto">
                    {executedTxEvents.slice(0, 5).map((event, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 my-1 rounded bg-gray-700"
                      >
                        <div className="font-mono text-xs">
                          ID: {formatAddress(event.args.id.toString())}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultisigPage;
