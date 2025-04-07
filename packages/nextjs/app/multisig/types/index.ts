export type SignerOption = "" | "add" | "remove" | "transfer_fund";
export type TxType = "pending" | "executed" | "all";

export const ADD_SIGNER_SELECTOR =
  "163160470112599928456934797768840367968245733614578848060926957836914140077";
export const REMOVE_SIGNERS_SELECTOR =
  "767518249422081897823135012745208437981351925483047827767343643794160700358";
export const TRANSFER_FUNDS_SELECTOR =
  "38510877729565715727506855624077120381398490202787197538796091827660389293";

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
    case ADD_SIGNER_SELECTOR:
      return "add_signer";
    case REMOVE_SIGNERS_SELECTOR:
      return "remove_signers";
    case TRANSFER_FUNDS_SELECTOR:
      return "transfer_funds";
    default:
      return null;
  }
};

export const formatAddress = (address: string) => {
  if (!address || address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatTokenAmount = (
  amount: string,
  decimals = 18,
  displayDecimals = 4,
) => {
  const amountBigInt = BigInt(amount);

  const divisor = BigInt(10 ** decimals);

  const integerPart = amountBigInt / divisor;

  const fractionalPart = amountBigInt % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");

  const result = `${integerPart}${
    displayDecimals > 0 ? "." + fractionalStr.substring(0, displayDecimals) : ""
  }`;

  return result.replace(/\.?0+$/, "");
};
