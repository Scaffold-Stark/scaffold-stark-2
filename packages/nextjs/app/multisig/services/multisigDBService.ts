import {
  db,
  MultisigConfig,
  Signer,
  TransactionWithAdditionalInfo,
} from "../lib/db/multisigDB";
import { Transaction } from "../types";

export const dbService = {
  async initializeDB() {
    try {
      if (!db.isOpen()) {
        await db.open();
      }
      return true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      return false;
    }
  },

  async saveTransaction(tx: Transaction): Promise<string | null> {
    try {
      const txWithInfo: TransactionWithAdditionalInfo = {
        ...tx,
      };
      await db.transactions.put(txWithInfo);
      return tx.id;
    } catch (error) {
      console.error("Failed to save transaction:", error);
      return null;
    }
  },

  async updateTransaction(
    id: string,
    updates: Partial<TransactionWithAdditionalInfo>,
  ): Promise<boolean> {
    try {
      const tx = await db.transactions.get(id);
      if (!tx) {
        console.error(`Transaction with id ${id} not found`);
        return false;
      }

      const updatedTx = {
        ...tx,
        ...updates,
        updatedAt: Date.now(),
      };

      await db.transactions.put(updatedTx);
      return true;
    } catch (error) {
      console.error("Failed to update transaction:", error);
      return false;
    }
  },

  async getTransactions(filter?: {
    executed?: boolean;
  }): Promise<TransactionWithAdditionalInfo[]> {
    try {
      let collection = db.transactions.toCollection();

      if (filter) {
        if (filter.executed !== undefined) {
          collection = collection.filter(
            (tx) => tx.executed === filter.executed,
          );
        }
      }

      return await collection.reverse().sortBy("createdAt");
    } catch (error) {
      console.error("Failed to get transactions:", error);
      return [];
    }
  },

  async updateSigners(signerAddresses: string[]): Promise<boolean> {
    try {
      await db.signers.clear();

      const now = Date.now();
      for (const address of signerAddresses) {
        await db.signers.put({
          address: address,
          addedAt: now,
          isActive: true,
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to update signers:", error);
      return false;
    }
  },

  async getActiveSigners(): Promise<string[]> {
    try {
      const signers = await db.signers.toArray();
      return signers.filter((s) => s.isActive).map((s) => s.address);
    } catch (error) {
      console.error("Failed to get active signers:", error);
      return [];
    }
  },

  async saveConfig(contractAddress: string, quorum: number): Promise<boolean> {
    try {
      const config: MultisigConfig = {
        id: "default",
        contractAddress,
        quorum,
        updatedAt: Date.now(),
      };
      await db.configs.put(config);
      return true;
    } catch (error) {
      console.error("Failed to save config:", error);
      return false;
    }
  },

  async getConfig(): Promise<MultisigConfig | null> {
    try {
      const config = await db.configs.get("default");
      return config ?? null;
    } catch (error) {
      console.error("Failed to get config:", error);
      return null;
    }
  },
  async resetDatabase(): Promise<boolean> {
    try {
      await db.transactions.clear();
      await db.signers.clear();
      await db.configs.clear();

      console.log("Database has been reset successfully");
      return true;
    } catch (error) {
      console.error("Failed to reset database:", error);
      return false;
    }
  },
};
