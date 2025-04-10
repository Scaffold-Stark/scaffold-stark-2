import { TransactionWithAdditionalInfo } from "../lib/db/multisigDB";
import { Transaction } from "../types";

export const toTransactionWithInfo = (
  tx: Transaction,
): TransactionWithAdditionalInfo => {
  return {
    ...tx,
  };
};

export const toTransaction = (
  tx: TransactionWithAdditionalInfo,
): Transaction => {
  const { hash, notes, metadata, ...transaction } = tx;
  return transaction;
};

export const getLocalStorageKey = (prefix: string, id: string) => {
  return `multisig_${prefix}_${id}`;
};

export const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage with key ${key}:`, error);
    return false;
  }
};

export const getFromLocalStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting from localStorage with key ${key}:`, error);
    return null;
  }
};
