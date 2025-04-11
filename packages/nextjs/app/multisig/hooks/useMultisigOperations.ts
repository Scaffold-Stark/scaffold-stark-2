import { useCallback, useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract, Provider } from "starknet";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useMultisigStore } from "../lib/multisigStore";
import { notification } from "~~/utils/scaffold-stark";
import { SignerOption, Transaction } from "../types";
import {
  ADD_SIGNER_SELECTOR,
  convertToWei,
  REMOVE_SIGNER_SELECTOR,
  TRANSFER_FUNDS_SELECTOR,
  CHANGE_QUORUM_SELECTOR,
  convertFeltToAddress,
  getFunctionSelector,
} from "../utils";

const starknet = new Provider();

export const useMultisigOperations = () => {
  const { account } = useAccount();
  const { data: deployedContractData } = useDeployedContractInfo(
    "CustomMultisigWallet",
  );
  const [loading, setLoading] = useState(false);

  const {
    initialized,
    saveTransaction,
    updateTransaction,
    updateSigners,
    saveConfig,
    pendingTransactions,
    signers,
  } = useMultisigStore();

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
      const contract = getContract();

      for (const tx of pendingTransactions) {
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
    } catch (err: any) {
      console.error("Error syncing transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [
    account,
    deployedContractData,
    getContract,
    pendingTransactions,
    updateTransaction,
  ]);

  const createSignerTransaction = useCallback(
    async (option: SignerOption, signerAddress: string, newQuorum: number) => {
      if (!account || !deployedContractData) {
        notification.error("No account connected or contract not loaded");
        return null;
      }

      setLoading(true);
      try {
        const contract = getContract();
        const contractAddress = deployedContractData.address;
        const salt = "0";
        let selector = "";
        let calldata: string[] = [];
        let functionName = "";

        if (option === "add") {
          if (!signerAddress) {
            notification.error("Signer address is required");
            return null;
          }
          selector = ADD_SIGNER_SELECTOR;
          calldata = [newQuorum.toString(), signerAddress];
          functionName = "add_signer";
        } else if (option === "remove") {
          if (!signerAddress) {
            notification.error("Signer address is required");
            return null;
          }
          const validNewQuorum = Math.min(newQuorum, signers.length - 1);
          selector = REMOVE_SIGNER_SELECTOR;
          calldata = [validNewQuorum.toString(), signerAddress];
          functionName = "remove_signer";
        } else if (option === "change_quorum") {
          selector = CHANGE_QUORUM_SELECTOR;
          calldata = [newQuorum.toString()];
          functionName = "change_quorum";
        } else {
          notification.error("Invalid option selected");
          return null;
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

        // Get the current block number
        const currentBlockNumber = await starknet.getBlockNumber();
        const currentTime = Date.now();

        const transaction: Transaction = {
          id: txIdString,
          to: contractAddress,
          selector: functionName,
          calldata: calldata,
          salt: salt,
          confirmations: 0,
          executed: false,
          submittedBy: account.address,
          submittedBlock: currentBlockNumber.toString(),
          addressConfirmed: [],
          createdAt: currentTime,
          updatedAt: currentTime,
        };

        await saveTransaction(transaction);
        notification.success("Transaction created successfully");
        return txIdString;
      } catch (err: any) {
        console.error("Error creating transaction:", err);
        notification.error("Failed to create transaction");
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
    async (recipient: string, amount: string, newQuorum: number) => {
      if (!account || !deployedContractData) {
        notification.error("No account connected or contract not loaded");
        return null;
      }

      if (!recipient) {
        notification.error("Recipient address is required");
        return null;
      }

      if (!amount || isNaN(Number(amount))) {
        notification.error("Valid amount is required");
        return null;
      }

      setLoading(true);
      try {
        const contract = getContract();
        const salt = "0";

        const selector = TRANSFER_FUNDS_SELECTOR;
        const calldata = [recipient, convertToWei(amount), "0"];
        // const calldata = [recipient, convertToWei(amount), newQuorum.toString()];

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

        // Create transaction object for saving to IndexedDB
        const functionName = "transfer_funds";
        const currentBlockNumber = await starknet.getBlockNumber();
        const currentTime = Date.now();

        const transaction: Transaction = {
          id: txIdString,
          to: deployedContractData.address,
          selector: functionName,
          calldata: calldata,
          salt: salt,
          confirmations: 0,
          executed: false,
          submittedBy: account.address,
          submittedBlock: currentBlockNumber.toString(),
          addressConfirmed: [],
          tokenType: "ETH",
          createdAt: currentTime,
          updatedAt: currentTime,
        };

        await saveTransaction(transaction);
        notification.success("Transfer transaction created successfully");
        return txIdString;
      } catch (err: any) {
        console.error("Error creating transfer transaction:", err);
        notification.error("Failed to create transfer transaction");
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
        notification.error("Account, contract, or transaction ID missing");
        return false;
      }

      setLoading(true);
      try {
        const contract = getContract();

        await contract.confirm_transaction(txId);

        // Find the transaction in our store
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

        notification.success("Transaction confirmed successfully");
        return true;
      } catch (err: any) {
        console.error("Error confirming transaction:", err);
        notification.error("Failed to confirm transaction");
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
        notification.error("Account, contract, or transaction ID missing");
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

        notification.success("Confirmation revoked successfully");
        return true;
      } catch (err: any) {
        console.error("Error revoking confirmation:", err);
        notification.error("Failed to revoke confirmation");
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
        notification.error("Account, contract, or transaction ID missing");
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

        if (tx.selector === "transfer_funds" && calldata.length === 2) {
          calldata = [...calldata, "0"];
        }

        await contract.execute_transaction(
          tx.to,
          getFunctionSelector(tx.selector),
          calldata,
          tx.salt,
        );

        await updateTransaction(txId, {
          executed: true,
        });

        notification.success("Transaction executed successfully");
        return true;
      } catch (err: any) {
        console.error("Error executing transaction:", err);
        notification.error("Failed to execute transaction");
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
    if (!account) return false;

    return signers.some((signer) => {
      const signerAddress = convertFeltToAddress(signer);
      const normalizedSignerAddress = signerAddress.toLowerCase();
      const normalizedUserAddress = account.address.toLowerCase();

      return normalizedSignerAddress === normalizedUserAddress;
    });
  }, [account, signers]);

  const hasUserConfirmed = useCallback(
    (tx: Transaction) => {
      if (!account || !tx.addressConfirmed) return false;

      return tx.addressConfirmed.some((addr) => {
        const normalizedConfirmAddress = addr.toLowerCase();
        const normalizedUserAddress = account.address.toLowerCase();

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
