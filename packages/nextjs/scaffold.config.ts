import { Chain } from "@starknet-react/chains";
import { supportedChains as chains } from "./supportedChains";

export type ScaffoldConfig = {
  targetNetworks: readonly Chain[];
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  rpcProviderUrl: string;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
};

/**
 * Environment variable configuration with fallbacks
 * All RPC configuration is centralized through .env
 */
const getChainId = (): number => {
  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return envChainId ? Number(envChainId) : chains.devnet.id;
};

const getRpcUrl = (): string => {
  // Priority: NEXT_PUBLIC_RPC_URL -> NEXT_PUBLIC_PROVIDER_URL -> default
  return (
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_PROVIDER_URL ||
    "http://localhost:5050"
  );
};

// Get target network based on chain ID
const getTargetNetwork = (): Chain => {
  const chainId = getChainId();
  for (const key in chains) {
    if (chains[key]?.id === chainId) {
      return chains[key];
    }
  }
  return chains.devnet;
};

const scaffoldConfig = {
  // Get network from env or default to devnet
  targetNetworks: [getTargetNetwork()],
  
  // Centralized RPC URL from environment
  rpcProviderUrl: getRpcUrl(),
  
  // Configurable through env with defaults
  onlyLocalBurnerWallet: process.env.NEXT_PUBLIC_ONLY_LOCAL_BURNER === "true",
  pollingInterval: Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "30000"),
  autoConnectTTL: Number(process.env.NEXT_PUBLIC_AUTO_CONNECT_TTL || "60000"),
  walletAutoConnect: process.env.NEXT_PUBLIC_WALLET_AUTO_CONNECT === "false" ? false : true,
} as const satisfies ScaffoldConfig;

// Debug logging only in non-production environments
if (process.env.NODE_ENV !== "production") {
  console.log("[DEBUG] RPC Configuration:", {
    chainId: getChainId(),
    network: scaffoldConfig.targetNetworks[0].name,
    rpcUrl: scaffoldConfig.rpcProviderUrl,
    source: process.env.NEXT_PUBLIC_RPC_URL
      ? "NEXT_PUBLIC_RPC_URL"
      : process.env.NEXT_PUBLIC_PROVIDER_URL
      ? "NEXT_PUBLIC_PROVIDER_URL"
      : "default",
  });
}

export default scaffoldConfig;
