/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract, CallData, hash } from "starknet";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";
import CopyToClipboard from "react-copy-to-clipboard";
import { BlockieAvatar } from "~~/components/scaffold-stark";

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
  addressConfirmed: string[];
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

const convertSelectorToFuncName = (text: string) => {
  switch (text) {
    case "0x5c587631625b8e19617cebe376ee17e070ca15615606aaad48d9afae7823ad":
      return "add_signer";
    case "0x1b266621d7e8d679991575aa72fe52af4e5e336d71013f0de37be2802b34bc6":
      return "remove_signers";
    case "0x15cbdfd86e04fc1247c8cea1f9f6c9c0d92f1f1668c7a46591ed6e4091fbad":
      return "transfer_funds";
    default:
      return null;
  }
};

const MultisigPage = () => {
  const { account } = useAccount();
  const { data: deployedContractData } = useDeployedContractInfo(
    "CustomMultisigWallet"
  );

  const [selectedOption, setSelectedOption] = useState<SignerOption>("");
  const [address, setAddress] = useState<string>("");
  const [newQuorum, setNewQuorum] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const [transferRecipient, setTransferRecipient] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  const [signers, setSigners] = useState<string[]>([]);
  const [loadingSigners, setLoadingSigners] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
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
      account
    );
  };

  const loadSigners = async () => {
    if (!account || !deployedContractData) return;

    setLoadingSigners(true);
    try {
      const contract = getContract();

      const quorumResult = await contract.get_quorum();

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

      const currentSignersCount = signers.length;
      const singleSignerMode = currentSignersCount === 1;

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

            let addressesConfirmed = storedTxData?.addressConfirmed || [signer];

            if (confirmedTxEvents) {
              const txConfirmEvents = confirmedTxEvents.filter(
                (e) => e.args.id.toString() === txId
              );

              for (const confirmEvent of txConfirmEvents) {
                const confirmerAddress = confirmEvent.args.signer.toString();
                if (!addressesConfirmed.includes(confirmerAddress)) {
                  addressesConfirmed.push(confirmerAddress);
                }
              }
            }

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
              addressConfirmed: addressesConfirmed,
            };

            if (storedTxData) {
              setTransactionDetails((prev) => ({
                ...prev,
                [txId]: {
                  ...storedTxData,
                  confirmations: Number(confirmations),
                  executed: Boolean(isExecuted),
                  submittedBlock: submittedBlock.toString(),
                  addressConfirmed: addressesConfirmed,
                },
              }));
            }

            if (isExecuted) {
              executed.push(tx);
            } else {
              pending.push(tx);

              // if (singleSignerMode && !isExecuted) {
              //   const txDetails = storedTxData || tx;
              //   try {
              //     if (txDetails.to && txDetails.selector) {
              //       await contract.execute_transaction(
              //         txDetails.to,
              //         txDetails.selector,
              //         txDetails.calldata,
              //         txDetails.salt
              //       );
              //     }
              //   } catch (execErr) {
              //     console.error("Error auto-executing transaction:", execErr);
              //   }
              // }
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

  const confirmTransaction = async (txId: string) => {
    if (!account || !deployedContractData || !txId) {
      notification.error(
        "Please connect your wallet and provide a transaction ID"
      );
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      const singleSignerMode = signers.length === 1;

      await contract.confirm_transaction(txId);

      setTransactionDetails((prev) => {
        const tx = prev[txId];
        if (tx) {
          const updatedAddressConfirmed = [...(tx.addressConfirmed || [])];
          if (!updatedAddressConfirmed.includes(account.address)) {
            updatedAddressConfirmed.push(account.address);
          }
          return {
            ...prev,
            [txId]: {
              ...tx,
              addressConfirmed: updatedAddressConfirmed,
              confirmations: tx.confirmations + 1,
            },
          };
        }
        return prev;
      });

      notification.success("Transaction confirmed successfully");

      // if (singleSignerMode) {
      //   const storedTx = transactionDetails[txId];
      //   if (storedTx) {
      //     try {
      //       await contract.execute_transaction(
      //         storedTx.to,
      //         storedTx.selector,
      //         storedTx.calldata,
      //         storedTx.salt
      //       );
      //       notification.success("Transaction auto-executed successfully");
      //     } catch (execErr: any) {
      //       console.error("Error auto-executing transaction:", execErr);
      //       notification.error("Auto-execution failed: " + execErr.message);
      //     }
      //   }
      // }

      await loadTransactions();
    } catch (err: any) {
      console.error("Error confirming transaction:", err);
      notification.error(err.message || "Error confirming transaction");
    } finally {
      setLoading(false);
    }
  };

  const revokeConfirmation = async (txId: string) => {
    if (!account || !deployedContractData || !txId) {
      notification.error(
        "Please connect your wallet and provide a transaction ID"
      );
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();

      await contract.revoke_confirmation(txId);

      setTransactionDetails((prev) => {
        const tx = prev[txId];
        if (tx) {
          const updatedAddressConfirmed = (tx.addressConfirmed || []).filter(
            (address) => address !== account.address
          );
          return {
            ...prev,
            [txId]: {
              ...tx,
              addressConfirmed: updatedAddressConfirmed,
              confirmations: Math.max(0, tx.confirmations - 1),
            },
          };
        }
        return prev;
      });

      notification.success("Confirmation revoked successfully");
      await loadTransactions();
    } catch (err: any) {
      console.error("Error revoking confirmation:", err);
      notification.error(err.message || "Error revoking confirmation");
    } finally {
      setLoading(false);
    }
  };

  const hasUserConfirmed = (tx: Transaction) => {
    if (!account || !tx.addressConfirmed) return false;
    return tx.addressConfirmed.some(
      (addr) =>
        convertFeltToAddress(addr).toLowerCase() ===
        account.address.toLowerCase()
    );
  };

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
        salt
      );

      const submitResponse = await contract.submit_transaction(
        contractAddress,
        selector,
        calldata,
        salt
      );

      const txIdString = txIdResponse.toString();

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
          addressConfirmed: [account.address],
        },
      }));

      notification.success(
        `Transaction to ${selectedOption} signer submitted. ID: ${txIdString}`
      );

      setAddress("");
      setSelectedOption("");

      await Promise.all([loadSigners(), loadTransactions()]);
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      notification.error(err.message || "Error creating transaction");
    } finally {
      setLoading(false);
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

      const confirmations = await contract.get_transaction_confirmations(txId);

      if (signers.length > 1 && Number(confirmations) < signers.length) {
        notification.error(
          "All signers must confirm this transaction before execution"
        );
        setLoading(false);
        return;
      }

      const storedTx = transactionDetails[txId];

      if (storedTx) {
        await contract.execute_transaction(
          storedTx.to,
          storedTx.selector,
          storedTx.calldata,
          storedTx.salt
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
          transaction.salt
        );
      }

      notification.success("Transaction executed successfully");

      await Promise.all([loadSigners(), loadTransactions()]);
    } catch (err: any) {
      console.error("Error executing transaction:", err);
      notification.error(err.message || "Error executing transaction");
    } finally {
      setLoading(false);
    }
  };

  const createTransferTransaction = async () => {
    if (!account || !deployedContractData) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!transferRecipient) {
      notification.error("Please enter a valid recipient address");
      return;
    }

    if (!transferAmount || isNaN(Number(transferAmount))) {
      notification.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      const salt = "0x1234"; // Hard-coded salt for now

      const selector = hash.getSelectorFromName("transfer_funds");

      const calldata = [transferRecipient, transferAmount];

      const txIdResponse = await contract.hash_transaction(
        deployedContractData.address,
        selector,
        calldata,
        salt
      );

      await contract.submit_transaction(
        deployedContractData.address,
        selector,
        calldata,
        salt
      );

      const txIdString = txIdResponse.toString();

      setTransactionDetails((prev) => ({
        ...prev,
        [txIdString]: {
          id: txIdString,
          to: deployedContractData.address,
          selector: selector,
          calldata: calldata,
          salt: salt,
          confirmations: 1,
          executed: false,
          submittedBy: account.address,
          submittedBlock: "pending",
        },
      }));

      notification.success(`Transfer transaction submitted. ID: ${txIdString}`);

      setTransferRecipient("");
      setTransferAmount("");

      await Promise.all([loadSigners(), loadTransactions()]);
    } catch (err: any) {
      console.error("Error creating transfer transaction:", err);
      notification.error(err.message || "Error creating transfer transaction");
    } finally {
      setLoading(false);
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
      (address) => address.toLowerCase() === normalizedUserAddress
    );
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

  useEffect(() => {
    if (account && deployedContractData) {
      loadSigners();
      loadTransactions();
    }
  }, [account, deployedContractData]);

  return (
    <section className="max-w-screen-2xl w-full mx-auto mt-8 px-4 pb-12">
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
                      {formatAddress(deployedContractData.address)}
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
                      <div className="flex items-center gap-2">
                        <BlockieAvatar
                          address={convertFeltToAddress(address)}
                          size={16}
                        />
                        <span className="font-mono break-all">
                          {formatAddress(convertFeltToAddress(address))}
                        </span>
                      </div>
                      {convertFeltToAddress(address) == account?.address && (
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
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Create Transfer Transaction
            </h3>

            <div className="space-y-4">
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
                <label className="block text-sm mb-1">Amount (in wei):</label>
                <input
                  type="text"
                  value={transferAmount || ""}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter amount to transfer"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={createTransferTransaction}
                disabled={loading || !account || !deployedContractData}
                className="w-full rounded-md py-2 font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Create Transfer Transaction"}
              </button>
            </div>
          </div>
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
                {transactions.map((tx) => {
                  return (
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
                            {formatAddress(
                              convertFeltToAddress(tx.submittedBy)
                            )}
                          </span>
                        </div>
                        <div>Block: {tx.submittedBlock}</div>
                        <div>
                          Function Name:{" "}
                          {convertSelectorToFuncName(tx.selector)}
                        </div>
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
                              disabled={
                                loading || tx.confirmations < signers.length
                              }
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
                })}
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
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span>By:</span>
                            <div className="flex items-center gap-1.5">
                              <BlockieAvatar
                                address={convertFeltToAddress(
                                  event.args.signer.toString()
                                )}
                                size={16}
                              />
                              {formatAddress(
                                convertFeltToAddress(
                                  event.args.signer.toString()
                                )
                              )}
                            </div>
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
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span>By:</span>
                            <div className="flex items-center gap-1.5">
                              <BlockieAvatar
                                address={convertFeltToAddress(
                                  event.args.signer.toString()
                                )}
                                size={16}
                              />
                              {formatAddress(
                                convertFeltToAddress(
                                  event.args.signer.toString()
                                )
                              )}
                            </div>
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
