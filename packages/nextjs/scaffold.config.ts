import { Chain } from "@starknet-react/chains";
import { supportedChains as chains } from "./supportedChains";

export type ScaffoldConfig = {
  targetNetworks: readonly Chain[];
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  rpcProviderUrl: {
    [key: string]: string;
  };
  walletAutoConnect: boolean;
  autoConnectTTL: number;
};

// Convert BigInt chain IDs to strings for object keys
const devnetId = String(chains.devnet.id);
const sepoliaId = String(chains.sepolia.id);
const mainnetId = String(chains.mainnet.id);

const scaffoldConfig = {
  targetNetworks: [chains.devnet],
  // Only show the Burner Wallet when running on devnet
  onlyLocalBurnerWallet: false,
  rpcProviderUrl: {
    [devnetId]: process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL || process.env.NEXT_PUBLIC_PROVIDER_URL || "",
    [sepoliaId]: process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL || process.env.NEXT_PUBLIC_PROVIDER_URL || "",
    [mainnetId]: process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL || process.env.NEXT_PUBLIC_PROVIDER_URL || ""
  },
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
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;