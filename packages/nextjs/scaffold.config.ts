import { Chain } from "@starknet-react/chains";
import { supportedChains } from "./supportedChains";

// Define the type for each network configuration.
export type NetworkConfig = {
  id: bigint;
  chain: Chain;
  rpcUrl: string;
};

// Define the overall scaffold configuration type.
export type ScaffoldConfig = {
  networks: Record<string, NetworkConfig>;
  defaultNetwork: bigint;
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
  targetNetworks: Chain[];
  rpcProviderUrl: string;
};

/*
  Create a static networks object.
  Note: Since scaffold config is not expected to change frequently,
  the networks are defined explicitly here.
  If you need to update RPC URLs, change them in this file.
  Environment variables can still override these defaults at startup.
*/
const networks: Record<string, NetworkConfig> = {
  devnet: {
    id: supportedChains.devnet.id,
    chain: supportedChains.devnet,
    rpcUrl: process.env.NEXT_PUBLIC_DEVNET_RPC_URL || "http://localhost:5050/rpc",
  },
  mainnet: {
    id: supportedChains.mainnet.id,
    chain: supportedChains.mainnet,
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "https://alpha-mainnet.starknet.io",
  },
  mainnetFork: {
    id: supportedChains.mainnetFork.id,
    chain: supportedChains.mainnetFork,
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_FORK_RPC_URL || "https://mainnetfork.starknet.io",
  },
  // Add additional networks as needed.
};

// Compute the default network from env (if provided) or fall back to devnet.
const defaultNetwork: bigint = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
  ? BigInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
  : networks.devnet.id;

// Determine the centralized RPC URL by taking the rpcUrl of the default network.
const rpcProviderUrl = (() => {
  const key = Object.keys(networks).find((k) => networks[k].id === defaultNetwork);
  return key ? networks[key].rpcUrl : networks.devnet.rpcUrl;
})();

// Assemble the complete scaffold configuration.
const config: ScaffoldConfig = {
  networks,
  defaultNetwork,
  pollingInterval: process.env.NEXT_PUBLIC_POLLING_INTERVAL
    ? Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL)
    : 30000,
  onlyLocalBurnerWallet: process.env.NEXT_PUBLIC_ONLY_LOCAL_BURNER === "true",
  walletAutoConnect: process.env.NEXT_PUBLIC_WALLET_AUTO_CONNECT !== "false",
  autoConnectTTL: process.env.NEXT_PUBLIC_AUTO_CONNECT_TTL
    ? Number(process.env.NEXT_PUBLIC_AUTO_CONNECT_TTL)
    : 60000,
  // Explicitly list the target chains (feel free to adjust as needed)
  targetNetworks: [networks.devnet.chain, networks.mainnet.chain],
  // This is the single source of truth for the RPC URL.
  rpcProviderUrl,
};

// Export the configuration object.
// All functions in the repo should reference config.rpcProviderUrl (or other config values) only.
export default config;

// ----- Optional: Inline Test Code -----
// When running this file directly, it will print the initialized configuration.
if (require.main === module) {
  const defaultKey = Object.keys(networks).find((k) => networks[k].id === config.defaultNetwork) || "unknown";
  console.log("[CONFIG] Initialized with:", {
    defaultNetwork: config.defaultNetwork,
    defaultNetworkName: defaultKey,
    rpcUrl: config.rpcProviderUrl,
    networks: Object.keys(config.networks).length,
  });
}
