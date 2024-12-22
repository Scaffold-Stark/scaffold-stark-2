import { Chain } from "@starknet-react/chains";
import { supportedChains as chains } from "./supportedChains";

export type ScaffoldConfig = {
  targetNetworks: readonly Chain[];
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  rpcProviderUrl: string;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
  /**
   * Flag to indicate if the network is a fork of another network
   * This is used to handle network validation differently for forked networks
   * since they share the same chain ID as their parent network
   */
  isFork?: boolean;
};

const scaffoldConfig = {
  targetNetworks: [chains.devnet],
  // Only show the Burner Wallet when running on devnet
  onlyLocalBurnerWallet: false,
  rpcProviderUrl: process.env.NEXT_PUBLIC_PROVIDER_URL || "",
  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 30_000)
  pollingInterval: 30_000,
  /**
   * Auto connect:
   * 1. If the user was connected into a wallet before, on page reload reconnect automatically
   * 2. If user is not connected to any wallet:  On reload, connect to burner wallet if burnerWallet.enabled is true && burnerWallet.onlyLocal is false
   */
  autoConnectTTL: 60000,
  walletAutoConnect: true,
  /**
   * Set to true when using a fork of a network
   * This will prevent showing the wrong network dropdown when the chainId matches
   * but the RPC URL is different (e.g., when using a local fork of mainnet)
   */
  isFork: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
