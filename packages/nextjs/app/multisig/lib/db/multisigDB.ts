import Dexie, { Table } from "dexie";
import { Transaction } from "../../types";

export interface TransactionWithAdditionalInfo extends Transaction {
  hash?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  metadata?: any;
}
export interface Signer {
  address: string;
  hexAddress?: string;
  addedAt: number;
  isActive: boolean;
}

export interface MultisigConfig {
  id: string;
  contractAddress: string;
  quorum: number;
  updatedAt: number;
}

export class MultisigDatabase extends Dexie {
  transactions!: Table<TransactionWithAdditionalInfo, string>;
  signers!: Table<Signer, string>;
  configs!: Table<MultisigConfig, string>;

  constructor() {
    super("multisigWalletDB");
    this.version(1).stores({
      transactions:
        "id, to, selector, executed, submittedBy, submittedBlock, createdAt, updatedAt",
      signers: "address",
      configs: "id, contractAddress, quorum, updatedAt",
    });
  }
}

export const db = new MultisigDatabase();
