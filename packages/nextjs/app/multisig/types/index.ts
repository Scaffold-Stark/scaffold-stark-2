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

export const convertFeltToAddress = (felt: string) => {
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

export const convertSelectorToFuncName = (text: string) => {
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

export const formatAddress = (address: string) => {
  if (!address || address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};