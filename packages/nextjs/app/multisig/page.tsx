/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, ChangeEvent, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract } from "starknet";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";
import useScaffoldEthBalance from "~~/hooks/scaffold-stark/useScaffoldEthBalance";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";

import { Transaction, SignerOption, TxType } from "./types";
import WalletInfo from "./_components/WalletInfo";
import ManageTransaction from "./_components/ManageTransaction";
import TransactionList from "./_components/TransactionList";
import TransactionEvents from "./_components/TransactionEvents";
import {
  ADD_SIGNER_SELECTOR,
  convertFeltToAddress,
  REMOVE_SIGNER_SELECTOR,
  TRANSFER_FUNDS_SELECTOR,
} from "./utils";

const MultisigPage = () => {
  const { account } = useAccount();
  const { data: deployedContractData } = useDeployedContractInfo(
    "CustomMultisigWallet",
  );

  const { formatted: contractEthBalance } = useScaffoldEthBalance({
    address: deployedContractData?.address,
  });

  const { formatted: contractStrkBalance } = useScaffoldStrkBalance({
    address: deployedContractData?.address,
  });

  const [selectedOption, setSelectedOption] = useState<SignerOption>("add");
  const [address, setAddress] = useState<string>("");
  const [newQuorum, setNewQuorum] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const [transferRecipient, setTransferRecipient] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  const [signers, setSigners] = useState<string[]>([]);
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

  const handleSelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as SignerOption;
      setSelectedOption(value);
    },
    [],
  );

  const handleSignerChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  }, []);

  const handleNewQuorumChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      setNewQuorum(isNaN(value) ? 1 : value);
    },
    [],
  );

  const handleTxTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setSelectedTxType(e.target.value as TxType);
    },
    [],
  );

  const handleTxSelect = useCallback(
    async (id: string) => {
      if (selectedTxId === id) {
        setSelectedTxId("");
        return;
      }

      setSelectedTxId(id);
    },
    [selectedTxId],
  );

  const getContract = useCallback(() => {
    if (!account || !deployedContractData)
      throw new Error("No account connected or contract not loaded");

    return new Contract(
      deployedContractData.abi,
      deployedContractData.address,
      account,
    );
  }, [account, deployedContractData]);

  const loadSigners = useCallback(async () => {
    if (!account || !deployedContractData) return;

    setLoadingSigners(true);
    try {
      const contract = getContract();

      // Get quorum is called but not used in the component
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
  }, [account, deployedContractData, getContract]);

  const loadTransactions = useCallback(async () => {
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

            let addressesConfirmed = storedTxData?.addressConfirmed || [signer];

            if (confirmedTxEvents) {
              const txConfirmEvents = confirmedTxEvents.filter(
                (e) => e.args.id.toString() === txId,
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
              tokenType: storedTxData?.tokenType || "ETH",
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
  }, [
    account,
    deployedContractData,
    getContract,
    selectedTxType,
    submittedTxEvents,
    confirmedTxEvents,
    transactionDetails,
  ]);

  const confirmTransaction = useCallback(
    async (txId: string) => {
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

        await loadTransactions();
      } catch (err: any) {
        console.error("Error confirming transaction:", err);
        notification.error(err.message || "Error confirming transaction");
      } finally {
        setLoading(false);
      }
    },
    [account, deployedContractData, getContract, loadTransactions],
  );

  const revokeConfirmation = useCallback(
    async (txId: string) => {
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

        setTransactionDetails((prev) => {
          const tx = prev[txId];
          if (tx) {
            const updatedAddressConfirmed = (tx.addressConfirmed || []).filter(
              (address) => address !== account.address,
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
    },
    [account, deployedContractData, getContract, loadTransactions],
  );

  const hasUserConfirmed = useCallback(
    (tx: Transaction) => {
      if (!account || !tx.addressConfirmed) return false;
      return tx.addressConfirmed.some(
        (addr) =>
          convertFeltToAddress(addr).toLowerCase() ===
          account.address.toLowerCase(),
      );
    },
    [account],
  );

  const createSignerTransaction = useCallback(async () => {
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
      let calldata: string[] = [];

      if (selectedOption === "add") {
        selector = ADD_SIGNER_SELECTOR;
        calldata = [newQuorum.toString(), address];
      } else if (selectedOption === "remove") {
        const validNewQuorum = Math.min(newQuorum, signers.length - 1);
        selector = REMOVE_SIGNER_SELECTOR;
        calldata = [validNewQuorum.toString(), address];
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
        `Transaction to ${selectedOption} signer submitted. ID: ${txIdString}`,
      );

      setAddress("");
      setSelectedOption("add");

      // await Promise.all([loadSigners(), loadTransactions()]);
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      notification.error(err.message || "Error creating transaction");
    } finally {
      setLoading(false);
    }
  }, [
    account,
    address,
    deployedContractData,
    getContract,
    loadSigners,
    loadTransactions,
    newQuorum,
    selectedOption,
    signers.length,
  ]);

  const createTransferTransaction = useCallback(async () => {
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
      const salt = "0";

      const selector = TRANSFER_FUNDS_SELECTOR;

      const calldata = [transferRecipient, transferAmount, "0"];

      const txIdResponse = await contract.hash_transaction(
        deployedContractData.address,
        selector,
        calldata,
        salt,
      );

      await contract.submit_transaction(
        deployedContractData.address,
        selector,
        calldata,
        salt,
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
          addressConfirmed: [account.address],
          tokenType: "ETH",
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
  }, [
    account,
    deployedContractData,
    getContract,
    loadSigners,
    loadTransactions,
    transferAmount,
    transferRecipient,
  ]);

  const executeTransaction = useCallback(
    async (txId: string) => {
      if (!account || !deployedContractData || !txId) {
        notification.error("Transaction ID is required for execution");
        return;
      }

      setLoading(true);
      try {
        const contract = getContract();

        const confirmations =
          await contract.get_transaction_confirmations(txId);

        if (signers.length > 1 && Number(confirmations) < signers.length) {
          notification.error(
            "All signers must confirm this transaction before execution",
          );
          setLoading(false);
          return;
        }

        const storedTx = transactionDetails[txId];
        if (storedTx) {
          let calldata = storedTx.calldata;

          if (
            storedTx.selector === TRANSFER_FUNDS_SELECTOR &&
            calldata.length === 2
          ) {
            calldata = [...calldata, "0"];
          }

          await contract.execute_transaction(
            storedTx.to,
            storedTx.selector,
            calldata,
            storedTx.salt,
          );
        } else {
          const transaction = transactions.find((tx) => tx.id === txId);

          if (!transaction) {
            throw new Error("Transaction data not found");
          }

          let calldata = transaction.calldata;

          if (
            transaction.selector === TRANSFER_FUNDS_SELECTOR &&
            calldata.length === 2
          ) {
            calldata = [...calldata, "0"];
          }

          await contract.execute_transaction(
            transaction.to,
            transaction.selector,
            calldata,
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
      }
    },
    [
      account,
      deployedContractData,
      getContract,
      signers.length,
      transactionDetails,
      transactions,
      loadSigners,
      loadTransactions,
    ],
  );

  const isUserSigner = useCallback(() => {
    const signersAddresses = signers.map(convertFeltToAddress);
    const normalizedUserAddress = account?.address.startsWith("0x")
      ? account.address.toLowerCase()
      : "0x" + account?.address.toLowerCase();

    return signersAddresses.some(
      (address) => address.toLowerCase() === normalizedUserAddress,
    );
  }, [account, signers]);

  useEffect(() => {
    if (account && deployedContractData) {
      // Initial load only
      loadSigners();
    }
  }, [account, deployedContractData]);

  useEffect(() => {
    if (account && deployedContractData) {
      // Initial load only
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

  if (!deployedContractData)
    return (
      <div className="text-center w-full h-full flex flex-1 items-center justify-center">
        Not found contract
      </div>
    );

  return (
    <section className="max-w-screen-2xl w-full mx-auto mt-8 px-4 pb-12">
      <h1 className="text-2xl font-bold mb-6">Multisig Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <WalletInfo
            deployedContractData={deployedContractData}
            contractEthBalance={
              parseFloat(contractEthBalance).toFixed(4) ?? "0"
            }
            contractStrkBalance={
              parseFloat(contractStrkBalance).toFixed(4) ?? "0"
            }
            signers={signers}
            loadingSigners={loadingSigners}
            loadSigners={loadSigners}
            account={account}
          />

          <ManageTransaction
            account={account}
            deployedContractData={deployedContractData}
            selectedOption={selectedOption}
            handleSelectChange={handleSelectChange}
            address={address}
            handleSignerChange={handleSignerChange}
            newQuorum={newQuorum}
            handleNewQuorumChange={handleNewQuorumChange}
            transferRecipient={transferRecipient}
            setTransferRecipient={setTransferRecipient}
            transferAmount={transferAmount}
            setTransferAmount={setTransferAmount}
            createSignerTransaction={createSignerTransaction}
            createTransferTransaction={createTransferTransaction}
            loading={loading}
            signers={signers}
          />
        </div>

        <div className="space-y-6">
          <TransactionList
            transactions={transactions}
            loadingTransactions={loadingTransactions}
            selectedTxId={selectedTxId}
            handleTxSelect={handleTxSelect}
            selectedTxType={selectedTxType}
            handleTxTypeChange={handleTxTypeChange}
            loadTransactions={loadTransactions}
            confirmTransaction={confirmTransaction}
            revokeConfirmation={revokeConfirmation}
            executeTransaction={executeTransaction}
            loading={loading}
            signers={signers}
            isUserSigner={isUserSigner}
            hasUserConfirmed={hasUserConfirmed}
            account={account}
            deployedContractData={deployedContractData}
            pendingTransactions={pendingTransactions}
          />

          <TransactionEvents
            submittedTxEvents={submittedTxEvents}
            confirmedTxEvents={confirmedTxEvents}
            executedTxEvents={executedTxEvents}
          />
        </div>
      </div>
    </section>
  );
};

export default MultisigPage;
