export type SignerOption = "" | "add" | "remove" | "transfer_fund";
export type TxType = "pending" | "executed" | "all";

export interface Transaction {
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
  tokenType?: string;
}

export interface ContractInfo {
  abi: any;
  address: string;
}

export interface EventData {
  args: {
    id: {
      toString: () => string;
    };
    signer?: {
      toString: () => string;
    };
    [key: string]: any;
  };
}

export interface WalletInfoProps {
  deployedContractData: ContractInfo;
  contractEthBalance: string;
  contractStrkBalance: string;
  signers: string[];
  loadingSigners: boolean;
  loadSigners: () => Promise<void>;
  account?: { address: string };
}

export interface TransactionItemProps {
  tx: Transaction;
  signers: string[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  confirmTransaction: (id: string) => Promise<void>;
  revokeConfirmation: (id: string) => Promise<void>;
  executeTransaction: (id: string) => Promise<void>;
  loading: boolean;
  isUserSigner: boolean;
  hasUserConfirmed: (tx: Transaction) => boolean;
}

export interface TransactionListProps {
  transactions: Transaction[];
  loadingTransactions: boolean;
  selectedTxId: string;
  handleTxSelect: (id: string) => void;
  selectedTxType: TxType;
  handleTxTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  loadTransactions: () => Promise<void>;
  confirmTransaction: (id: string) => Promise<void>;
  revokeConfirmation: (id: string) => Promise<void>;
  executeTransaction: (id: string) => Promise<void>;
  loading: boolean;
  signers: string[];
  isUserSigner: () => boolean;
  hasUserConfirmed: (tx: Transaction) => boolean;
  account?: { address: string };
  deployedContractData?: ContractInfo;
  pendingTransactions: Transaction[];
}

export interface TransactionEventsProps {
  submittedTxEvents: EventData[] | undefined;
  confirmedTxEvents: EventData[] | undefined;
  executedTxEvents: EventData[] | undefined;
}

export interface ManageTransactionProps {
  account?: { address: string };
  deployedContractData?: ContractInfo;
  selectedOption: SignerOption;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  address: string;
  handleSignerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newQuorum: number;
  handleNewQuorumChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  transferRecipient: string;
  setTransferRecipient: (value: string) => void;
  transferAmount: string;
  setTransferAmount: (value: string) => void;
  createSignerTransaction: () => Promise<void>;
  createTransferTransaction: () => Promise<void>;
  loading: boolean;
  signers: string[];
}
