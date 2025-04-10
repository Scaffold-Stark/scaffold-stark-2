import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract } from "starknet";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useMultisigStore } from "../lib/multisigStore";
import { notification } from "~~/utils/scaffold-stark";
import { SignerOption, Transaction } from "../types";
import {
  ADD_SIGNER_SELECTOR,
  convertToWei,
  REMOVE_SIGNER_SELECTOR,
  TRANSFER_FUNDS_SELECTOR,
} from "../utils";

export const useMultisigOperations = () => {
  const { account } = useAccount();
  const { data: deployedContractData } = useDeployedContractInfo(
    "CustomMultisigWallet",
  );
  const [loading, setLoading] = useState(false);

  const {
    initialized,
    loadTransactions,
    loadSigners,
    saveTransaction,
    updateTransaction,
    updateSigners,
    saveConfig,
    pendingTransactions,
    executedTransactions,
    signers,
  } = useMultisigStore();

  useEffect(() => {
    const initializeDB = async () => {
      if (!initialized) {
        useMultisigStore.getState().initialize();
      }
    };

    initializeDB();
  }, [initialized]);

  const getContract = useCallback(() => {
    if (!account || !deployedContractData) {
      throw new Error("No account connected or contract not loaded");
    }

    return new Contract(
      deployedContractData.abi,
      deployedContractData.address,
      account,
    );
  }, [account, deployedContractData]);

  const syncSigners = useCallback(async () => {
    if (!account || !deployedContractData) return;

    setLoading(true);
    try {
      const contract = getContract();

      const quorumResult = await contract.get_quorum();
      const signersResult = await contract.get_signers();

      const formattedSigners = signersResult.map((signer: any) => {
        const signerStr = signer.toString();
        return signerStr;
      });

      if (formattedSigners.some((s: any) => !s || typeof s !== "string")) {
        console.error("Invalid signer data detected:", formattedSigners);
        return;
      }

      await updateSigners(formattedSigners);
      await saveConfig(deployedContractData.address, Number(quorumResult));
    } catch (err: any) {
      console.error("Error syncing signers:", err);
    } finally {
      setLoading(false);
    }
  }, [account, deployedContractData, getContract, saveConfig, updateSigners]);

  const syncTransactions = useCallback(async () => {
    if (!account || !deployedContractData) return;

    setLoading(true);
    try {
      const allTransactions = [...pendingTransactions, ...executedTransactions];
      const contract = getContract();

      for (const tx of allTransactions) {
        try {
          const isExecuted = await contract.is_executed(tx.id);
          const confirmations = await contract.get_transaction_confirmations(
            tx.id,
          );

          if (
            isExecuted !== tx.executed ||
            Number(confirmations) !== tx.confirmations
          ) {
            await updateTransaction(tx.id, {
              executed: Boolean(isExecuted),
              confirmations: Number(confirmations),
            });
          }
        } catch (err) {
          console.error(`Error updating transaction ${tx.id}:`, err);
        }
      }

      await loadTransactions();
    } catch (err: any) {
      console.error("Error syncing transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [
    account,
    deployedContractData,
    executedTransactions,
    getContract,
    loadTransactions,
    pendingTransactions,
    updateTransaction,
  ]);

  const createSignerTransaction = useCallback(
    async (option: SignerOption, signerAddress: string, newQuorum: number) => {
      if (!account || !deployedContractData) {
        return null;
      }

      if (!signerAddress) {
        return null;
      }

      setLoading(true);
      try {
        const contract = getContract();
        const contractAddress = deployedContractData.address;
        const salt = "0";
        let selector = "";
        let calldata: string[] = [];

        if (option === "add") {
          selector = ADD_SIGNER_SELECTOR;
          calldata = [newQuorum.toString(), signerAddress];
        } else if (option === "remove") {
          const validNewQuorum = Math.min(newQuorum, signers.length - 1);
          selector = REMOVE_SIGNER_SELECTOR;
          calldata = [validNewQuorum.toString(), signerAddress];
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

        const transaction: Transaction = {
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
        };

        await saveTransaction(transaction);

        return txIdString;
      } catch (err: any) {
        console.error("Error creating transaction:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      account,
      deployedContractData,
      getContract,
      saveTransaction,
      signers.length,
    ],
  );

  const createTransferTransaction = useCallback(
    async (recipient: string, amount: string) => {
      if (!account || !deployedContractData) {
        return null;
      }

      if (!recipient) {
        return null;
      }

      if (!amount || isNaN(Number(amount))) {
        return null;
      }

      setLoading(true);
      try {
        const contract = getContract();
        const salt = "0";

        const selector = TRANSFER_FUNDS_SELECTOR;
        const calldata = [recipient, convertToWei(amount), "0"];

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

        const transaction: Transaction = {
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
        };

        await saveTransaction(transaction);

        return txIdString;
      } catch (err: any) {
        console.error("Error creating transfer transaction:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [account, deployedContractData, getContract, saveTransaction],
  );

  const confirmTransaction = useCallback(
    async (txId: string) => {
      if (!account || !deployedContractData || !txId) {
        return false;
      }

      setLoading(true);
      try {
        const contract = getContract();

        await contract.confirm_transaction(txId);

        const tx = pendingTransactions.find((t) => t.id === txId);

        if (tx) {
          const updatedAddressConfirmed = [...(tx.addressConfirmed || [])];
          if (!updatedAddressConfirmed.includes(account.address)) {
            updatedAddressConfirmed.push(account.address);
          }

          await updateTransaction(txId, {
            addressConfirmed: updatedAddressConfirmed,
            confirmations: tx.confirmations + 1,
          });
        }

        return true;
      } catch (err: any) {
        console.error("Error confirming transaction:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      account,
      deployedContractData,
      getContract,
      pendingTransactions,
      updateTransaction,
    ],
  );

  const revokeConfirmation = useCallback(
    async (txId: string) => {
      if (!account || !deployedContractData || !txId) {
        return false;
      }

      setLoading(true);
      try {
        const contract = getContract();

        await contract.revoke_confirmation(txId);

        const tx = pendingTransactions.find((t) => t.id === txId);

        if (tx) {
          const updatedAddressConfirmed = (tx.addressConfirmed || []).filter(
            (address) => address !== account.address,
          );

          await updateTransaction(txId, {
            addressConfirmed: updatedAddressConfirmed,
            confirmations: Math.max(0, tx.confirmations - 1),
          });
        }

        return true;
      } catch (err: any) {
        console.error("Error revoking confirmation:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      account,
      deployedContractData,
      getContract,
      pendingTransactions,
      updateTransaction,
    ],
  );

  const executeTransaction = useCallback(
    async (txId: string) => {
      if (!account || !deployedContractData || !txId) {
        return false;
      }

      setLoading(true);
      try {
        const contract = getContract();

        const tx = pendingTransactions.find((t) => t.id === txId);

        if (!tx) {
          throw new Error("Transaction not found");
        }

        let calldata = tx.calldata;

        if (tx.selector === TRANSFER_FUNDS_SELECTOR && calldata.length === 2) {
          calldata = [...calldata, "0"];
        }

        await contract.execute_transaction(
          tx.to,
          tx.selector,
          calldata,
          tx.salt,
        );

        await updateTransaction(txId, {
          executed: true,
        });

        return true;
      } catch (err: any) {
        console.error("Error executing transaction:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      account,
      deployedContractData,
      getContract,
      pendingTransactions,
      updateTransaction,
    ],
  );

  const isUserSigner = useCallback(() => {
    return signers.some((signer) => {
      const normalizedSignerAddress = signer.startsWith("0x")
        ? signer.toLowerCase()
        : "0x" + signer.toLowerCase();

      const normalizedUserAddress = account?.address.startsWith("0x")
        ? account.address.toLowerCase()
        : "0x" + account?.address.toLowerCase();

      return normalizedSignerAddress === normalizedUserAddress;
    });
  }, [account, signers]);

  const hasUserConfirmed = useCallback(
    (tx: Transaction) => {
      if (!account || !tx.addressConfirmed) return false;

      return tx.addressConfirmed.some((addr) => {
        const normalizedConfirmAddress = addr.startsWith("0x")
          ? addr.toLowerCase()
          : "0x" + addr.toLowerCase();

        const normalizedUserAddress = account.address.startsWith("0x")
          ? account.address.toLowerCase()
          : "0x" + account.address.toLowerCase();

        return normalizedConfirmAddress === normalizedUserAddress;
      });
    },
    [account],
  );

  return {
    loading,
    syncSigners,
    syncTransactions,
    createSignerTransaction,
    createTransferTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    isUserSigner,
    hasUserConfirmed,
  };
};
