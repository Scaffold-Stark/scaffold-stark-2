/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, ChangeEvent, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-stark/useScaffoldEventHistory";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import useScaffoldEthBalance from "~~/hooks/scaffold-stark/useScaffoldEthBalance";
import useScaffoldStrkBalance from "~~/hooks/scaffold-stark/useScaffoldStrkBalance";

import { SignerOption, TxType } from "./types";
import WalletInfo from "./_components/WalletInfo";
import TransactionEvents from "./_components/TransactionEvents";
import { ManageTransaction } from "./_components/ManageTransaction";
import { useMultisigStore } from "./lib/multisigStore";
import { useMultisigOperations } from "./hooks/useMultisigOperations";
import TransactionList from "./_components/TransactionList";

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

  const {
    pendingTransactions,
    executedTransactions,
    signers,
    quorum,
    initialized,
    loading: storeLoading,
    loadTransactions,
    loadSigners,
  } = useMultisigStore();

  const {
    loading: operationsLoading,
    syncSigners,
    syncTransactions,
    createSignerTransaction,
    createTransferTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    isUserSigner,
    hasUserConfirmed,
  } = useMultisigOperations();

  const [selectedOption, setSelectedOption] = useState<SignerOption>("add");
  const [address, setAddress] = useState<string>("");
  const [newQuorum, setNewQuorum] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const [transferRecipient, setTransferRecipient] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [loadingSigners, setLoadingSigners] = useState(false);

  const [selectedTxType, setSelectedTxType] = useState<TxType>("pending");
  const [selectedTxId, setSelectedTxId] = useState<string>("");
  const [displayedTransactions, setDisplayedTransactions] =
    useState(pendingTransactions);
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

  const { data: quorumUpdatedEvents } = useScaffoldEventHistory({
    contractName: "CustomMultisigWallet",
    eventName:
      "contracts::CustomMultisigComponent::MultisigComponent::QuorumUpdated",
    fromBlock: 0n,
    watch: true,
  });

  const handleSelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as SignerOption;
      setSelectedOption(value);

      if (value === "change_quorum") {
        setNewQuorum(quorum);
      }
    },
    [quorum],
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
    (id: string) => {
      if (selectedTxId === id) {
        setSelectedTxId("");
      } else {
        setSelectedTxId(id);
      }
    },
    [selectedTxId],
  );

  const handleCreateSignerTransaction = useCallback(async () => {
    if (!selectedOption) return;

    if ((selectedOption === "add" || selectedOption === "remove") && !address)
      return;

    setLoading(true);
    try {
      await createSignerTransaction(selectedOption, address, newQuorum);
      setAddress("");
      setSelectedOption("add");
    } finally {
      setLoading(false);
    }
  }, [address, createSignerTransaction, newQuorum, selectedOption]);

  const handleCreateTransferTransaction = useCallback(async () => {
    if (!transferRecipient || !transferAmount) return;

    setLoading(true);
    try {
      await createTransferTransaction(
        transferRecipient,
        transferAmount,
        newQuorum,
      );
      setTransferRecipient("");
      setTransferAmount("");
    } finally {
      setLoading(false);
    }
  }, [createTransferTransaction, transferAmount, transferRecipient, newQuorum]);

  const refreshSigners = useCallback(async () => {
    setLoadingSigners(true);
    try {
      await syncSigners();
    } finally {
      setLoadingSigners(false);
    }
  }, [syncSigners]);

  const refreshTransactions = useCallback(async () => {
    setLoading(true);
    try {
      await syncTransactions();
    } finally {
      setLoading(false);
    }
  }, [syncTransactions]);

  useEffect(() => {
    if (selectedTxType === "pending") {
      setDisplayedTransactions(pendingTransactions);
    } else if (selectedTxType === "executed") {
      setDisplayedTransactions(executedTransactions);
    } else {
      setDisplayedTransactions([
        ...pendingTransactions,
        ...executedTransactions,
      ]);
    }
  }, [selectedTxType, pendingTransactions, executedTransactions]);

  useEffect(() => {
    if (account && deployedContractData && initialized) {
      syncSigners();
      syncTransactions();
    }
  }, [account, deployedContractData, initialized]);

  useEffect(() => {
    if (submittedTxEvents || confirmedTxEvents || executedTxEvents) {
      syncTransactions();
      loadTransactions();
    }
  }, [submittedTxEvents, confirmedTxEvents, executedTxEvents]);

  useEffect(() => {
    if (signerAddedEvents || signerRemovedEvents || quorumUpdatedEvents) {
      syncSigners();
      loadSigners();
    }
  }, [signerAddedEvents, signerRemovedEvents, quorumUpdatedEvents]);

  if (!deployedContractData)
    return (
      <div className="text-center w-full h-full flex flex-1 items-center justify-center">
        Not found contract
      </div>
    );

  return (
    <section className="max-w-screen-2xl w-full mx-auto mt-8 px-4 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <WalletInfo
            deployedContractData={deployedContractData}
            contractEthBalance={
              parseFloat(contractEthBalance || "0").toFixed(4) ?? "0"
            }
            contractStrkBalance={
              parseFloat(contractStrkBalance || "0").toFixed(4) ?? "0"
            }
            signers={signers}
            loadingSigners={loadingSigners}
            loadSigners={refreshSigners}
            account={account}
            quorum={quorum}
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
            createSignerTransaction={handleCreateSignerTransaction}
            createTransferTransaction={handleCreateTransferTransaction}
            loading={loading || operationsLoading}
            signers={signers}
          />
        </div>

        <div className="space-y-6">
          <TransactionList
            transactions={displayedTransactions}
            loadingTransactions={loading || operationsLoading || storeLoading}
            selectedTxId={selectedTxId}
            handleTxSelect={handleTxSelect}
            selectedTxType={selectedTxType}
            handleTxTypeChange={handleTxTypeChange}
            loadTransactions={refreshTransactions}
            confirmTransaction={async (id: string) => {
              await confirmTransaction(id);
            }}
            revokeConfirmation={async (id: string) => {
              await revokeConfirmation(id);
            }}
            executeTransaction={async (id: string) => {
              await executeTransaction(id);
            }}
            loading={loading || operationsLoading}
            signers={signers}
            quorum={quorum}
            isUserSigner={isUserSigner}
            hasUserConfirmed={hasUserConfirmed}
            account={account}
            deployedContractData={deployedContractData}
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
