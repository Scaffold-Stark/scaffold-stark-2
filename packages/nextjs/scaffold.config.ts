import { Chain } from "@starknet-react/chains";
import { supportedChains } from "./supportedChains";

export type NetworkConfig = {
  id: bigint;
  chain: Chain;
  rpcUrl: string;
};

export type ScaffoldConfig = {
  networks: Record<string, NetworkConfig>;
  defaultNetwork: bigint;
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
  targetNetworks?: Chain[];
  rpcProviderUrl?: string;
};

const buildNetworkConfigs = (): Record<string, NetworkConfig> => {
  const networkConfigs: Record<string, NetworkConfig> = {};
  const legacyRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_PROVIDER_URL;

  Object.entries(supportedChains).forEach(([networkName, chain]) => {
    // Skip non-chain entries
    if (typeof chain !== 'object' || !('id' in chain)) return;

    const envNetworkName = networkName.toUpperCase();
    let rpcUrl = 
      process.env[`NEXT_PUBLIC_${envNetworkName}_RPC_URL`] || 
      chain.rpcUrls?.public?.http?.[0] ||
      chain.rpcUrls?.default?.http?.[0] ||
      "";

    if (chain.id === getDefaultChainId() && legacyRpcUrl) {
      rpcUrl = legacyRpcUrl;
    }

    networkConfigs[networkName] = {
      id: chain.id,
      chain: chain as Chain,
      rpcUrl,
    };
  });

  return networkConfigs;
};

const getDefaultChainId = (): bigint => {
  const envChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID;
  return envChainId ? BigInt(envChainId) : supportedChains.devnet.id;
};

const initScaffoldConfig = (): ScaffoldConfig => {
  return {
    networks: buildNetworkConfigs(),
    defaultNetwork: getDefaultChainId(),
    pollingInterval: Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "30000"),
    onlyLocalBurnerWallet: process.env.NEXT_PUBLIC_ONLY_LOCAL_BURNER === "true",
    autoConnectTTL: Number(process.env.NEXT_PUBLIC_AUTO_CONNECT_TTL || "60000"),
    walletAutoConnect: process.env.NEXT_PUBLIC_WALLET_AUTO_CONNECT !== "false",
  };
};

const scaffoldConfig = initScaffoldConfig();

export const getCurrentNetworkConfig = (): NetworkConfig => {
  const defaultNetworkId = scaffoldConfig.defaultNetwork;

  for (const networkName in scaffoldConfig.networks) {
    if (scaffoldConfig.networks[networkName].id === defaultNetworkId) {
      return scaffoldConfig.networks[networkName];
    }
  }

  return scaffoldConfig.networks.devnet;
};

export const getTargetNetworks = (): Chain[] => {
  return [getCurrentNetworkConfig().chain];
};

export const getRpcUrl = (): string => {
  return getCurrentNetworkConfig().rpcUrl;
};

Object.defineProperties(scaffoldConfig, {
  targetNetworks: {
    get: () => getTargetNetworks(),
    enumerable: true,
  },
  rpcProviderUrl: {
    get: () => getRpcUrl(),
    enumerable: true,
  },
});

console.log("[CONFIG] Initialized with:", {
  defaultNetwork: scaffoldConfig.defaultNetwork,
  defaultNetworkName: getCurrentNetworkConfig().chain.name,
  rpcUrl: getRpcUrl(),
  networks: Object.keys(scaffoldConfig.networks).length,
});

export default scaffoldConfig;

// Test code
// if (typeof require !== "undefined" && require.main === module) {
//   console.log("=== RPC Configuration Test ===");
//   console.log("Direct from env:", process.env.NEXT_PUBLIC_RPC_URL || "not set");
//   console.log("From scaffoldConfig.rpcProviderUrl:", scaffoldConfig.rpcProviderUrl);
//   console.log("From getRpcUrl() helper:", getRpcUrl());
//   console.log("Default network ID:", scaffoldConfig.defaultNetwork);
//   console.log("Available networks:", Object.keys(scaffoldConfig.networks));
//   console.log("===============================");

//   const isConsistent =
//     (!process.env.NEXT_PUBLIC_RPC_URL ||
//       process.env.NEXT_PUBLIC_RPC_URL === scaffoldConfig.rpcProviderUrl) &&
//     scaffoldConfig.rpcProviderUrl === getRpcUrl();

//   console.log("Is configuration centralized?", isConsistent ? "✅ YES" : "❌ NO");
// }