import * as chains from "@starknet-react/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  onlyLocalBurnerWallet: boolean;
  rpcProviderUrl: string;
  walletAutoConnect: boolean;
  autoConnectTTL: number;
};

const forkMainnet = {
  id: BigInt("0x534e5f4d41494e"),
  network: "devnet",
  name: "Starknet Devnet",
  nativeCurrency: {
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: []
    },
    public: {
      http: ["http://localhost:5050/rpc"]
    }
  }
} as chains.Chain;

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
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
