// import { Chain } from "@starknet-react/chains";
// import { supportedChains as chains } from "./supportedChains";

// export type ScaffoldConfig = {
//   targetNetworks: readonly Chain[];
//   pollingInterval: number;
//   onlyLocalBurnerWallet: boolean;
//   rpcProviderUrl: string;
//   walletAutoConnect: boolean;
//   autoConnectTTL: number;
// };

// const scaffoldConfig = {
//   targetNetworks: [chains.devnet],
//   // Only show the Burner Wallet when running on devnet
//   onlyLocalBurnerWallet: false,
//   rpcProviderUrl: process.env.NEXT_PUBLIC_PROVIDER_URL || "",
//   // The interval at which your front-end polls the RPC servers for new data
//   // it has no effect if you only target the local network (default is 30_000)
//   pollingInterval: 30_000,
//   /**
//    * Auto connect:
//    * 1. If the user was connected into a wallet before, on page reload reconnect automatically
//    * 2. If user is not connected to any wallet:  On reload, connect to burner wallet if burnerWallet.enabled is true && burnerWallet.onlyLocal is false
//    */
//   autoConnectTTL: 60000,
//   walletAutoConnect: true,
// } as const satisfies ScaffoldConfig;

// export default scaffoldConfig;




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

const scaffoldConfig = {
  // Get network from env or default to devnet
  targetNetworks: [
    chains.find(chain => chain.id === Number(process.env.NEXT_PUBLIC_CHAIN_ID)) || chains.devnet
  ],
  
  // Get RPC URL from env or use devnet default
  rpcProviderUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:5050",

  // Keep existing configs unchanged
  onlyLocalBurnerWallet: false,
  pollingInterval: 30_000,
  autoConnectTTL: 60_000,
  walletAutoConnect: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;