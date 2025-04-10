import { create } from "zustand";
import { Transaction } from "../types";
import { TransactionWithAdditionalInfo } from "./db/multisigDB";
import { dbService } from "../services/multisigDBService";

interface MultisigState {
  initialized: boolean;
  loading: boolean;
  transactions: TransactionWithAdditionalInfo[];
  pendingTransactions: TransactionWithAdditionalInfo[];
  executedTransactions: TransactionWithAdditionalInfo[];
  signers: string[];
  quorum: number;
  contractAddress: string;

  initialize: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadSigners: () => Promise<void>;
  loadConfig: () => Promise<void>;

  saveTransaction: (tx: Transaction) => Promise<string | null>;
  updateTransaction: (
    id: string,
    updates: Partial<TransactionWithAdditionalInfo>,
  ) => Promise<boolean>;
  updateSigners: (signers: string[]) => Promise<boolean>;
  saveConfig: (contractAddress: string, quorum: number) => Promise<boolean>;

  resetStore: () => void;
  resetDatabase: () => Promise<boolean>;
}

export const useMultisigStore = create<MultisigState>((set, get) => ({
  initialized: false,
  loading: false,
  transactions: [],
  pendingTransactions: [],
  executedTransactions: [],
  signers: [],
  quorum: 0,
  contractAddress: "",

  initialize: async () => {
    const { loadTransactions, loadSigners, loadConfig } = get();
    set({ loading: true });

    try {
      await dbService.initializeDB();

      try {
        await loadConfig();
      } catch (error) {
        console.error("Failed to load config:", error);
      }

      try {
        await loadSigners();
      } catch (error) {
        console.error("Failed to load signers:", error);
      }

      try {
        await loadTransactions();
      } catch (error) {
        console.error("Failed to load transactions:", error);
      }

      set({ initialized: true });
    } catch (error) {
      console.error("Failed to initialize multisig store:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadTransactions: async () => {
    set({ loading: true });

    try {
      const allTransactions = await dbService.getTransactions();
      const pending = allTransactions.filter((tx) => !tx.executed);
      const executed = allTransactions.filter((tx) => tx.executed);

      set({
        transactions: allTransactions,
        pendingTransactions: pending,
        executedTransactions: executed,
      });
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadSigners: async () => {
    set({ loading: true });

    try {
      const signers = await dbService.getActiveSigners();
      set({ signers });
    } catch (error) {
      console.error("Failed to load signers:", error);
    } finally {
      set({ loading: false });
    }
  },

  loadConfig: async () => {
    set({ loading: true });

    try {
      const config = await dbService.getConfig();
      if (config) {
        set({
          contractAddress: config.contractAddress,
          quorum: config.quorum,
        });
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      set({ loading: false });
    }
  },

  saveTransaction: async (tx: Transaction) => {
    const result = await dbService.saveTransaction(tx);
    if (result) {
      await get().loadTransactions();
    }
    return result;
  },

  updateTransaction: async (
    id: string,
    updates: Partial<TransactionWithAdditionalInfo>,
  ) => {
    const result = await dbService.updateTransaction(id, updates);
    if (result) {
      await get().loadTransactions();
    }
    return result;
  },

  updateSigners: async (signers: string[]) => {
    const result = await dbService.updateSigners(signers);
    if (result) {
      await get().loadSigners();
    }
    return result;
  },

  saveConfig: async (contractAddress: string, quorum: number) => {
    const result = await dbService.saveConfig(contractAddress, quorum);
    if (result) {
      await get().loadConfig();
    }
    return result;
  },

  resetStore: () => {
    set({
      transactions: [],
      pendingTransactions: [],
      executedTransactions: [],
      signers: [],
      quorum: 0,
      contractAddress: "",
    });
  },
  resetDatabase: async () => {
    set({ loading: true });
    try {
      const result = await dbService.resetDatabase();
      if (result) {
        get().resetStore();
      }
      return result;
    } catch (error) {
      console.error("Failed to reset database:", error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
