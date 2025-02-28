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
  targetNetworks: Chain[];
  rpcProviderUrl: string;
};

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
};

const defaultNetwork: bigint = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID
  ? BigInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
  : networks.devnet.id;

const rpcProviderUrl = (() => {
  const key = Object.keys(networks).find((k) => networks[k].id === defaultNetwork);
  return key ? networks[key].rpcUrl : networks.devnet.rpcUrl;
})();

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
  targetNetworks: [networks.devnet.chain, networks.mainnet.chain],
  rpcProviderUrl,
};

export default config;

// -----  Inline Test Code -----
// if (require.main === module) {
//   const defaultKey = Object.keys(networks).find((k) => networks[k].id === config.defaultNetwork) || "unknown";
//   console.log("[CONFIG] Initialized with:", {
//     defaultNetwork: config.defaultNetwork,
//     defaultNetworkName: defaultKey,
//     rpcUrl: config.rpcProviderUrl,
//     networks: Object.keys(config.networks).length,
//   });
// }
