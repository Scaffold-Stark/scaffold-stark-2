/**
 * Type definitions for the block explorer
 */

/**
 * Transaction entry interface for the block explorer
 */
export interface TxnEntry {
  hash: string;
  blockNumber: number;
  timeMined: string;
  from: string;
  status: string;
  type: string;
  age: string;
  calls: string[];
  isDeploy?: boolean;
}

/**
 * Address details interface
 */
export interface AddressData {
  contractAddress: string;
  classHash: string;
  strkBalance: string;
  type: string;
  deployedByContractAddress: string;
  deployedAtTransactionHash: string;
  deployedAt: string;
  classVersion: string;
  profileName: string;
}

/**
 * Tab configuration interface
 */
export interface TabConfig {
  id: string;
  label: string;
  count: number | null;
}

/**
 * Copy button props
 */
export interface CopyButtonProps {
  text: string;
  fieldName: string;
}

/**
 * Event argument type
 */
export interface EventArgument {
  key: string;
  value: any;
  type?: string;
}

/**
 * Decoded function call interface
 */
export interface DecodedFunctionCall {
  contractAddress: string;
  entrypoint: string;
  selector?: string;
  calldata: string[];
  decodedArgs?: Record<string, any>;
  argTypes?: Record<string, string>;
}
