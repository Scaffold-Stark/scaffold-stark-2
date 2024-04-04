import * as chains from "@starknet-react/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
};

const scaffoldConfig = {
  targetNetworks: [chains.sepolia],
  // Only show the Burner Wallet when running on devnet
  onlyLocalBurnerWallet: false,
  /**
   * Auto connect:
   * 1. If the user was connected into a wallet before, on page reload reconnect automatically
   * 2. If user is not connected to any wallet:  On reload, connect to burner wallet if burnerWallet.enabled is true && burnerWallet.onlyLocal is false
   */
  walletAutoConnect: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
