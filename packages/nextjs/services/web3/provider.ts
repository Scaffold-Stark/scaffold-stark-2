import scaffoldConfig from "~~/scaffold.config";
import {
  jsonRpcProvider,
  publicProvider,
  starknetChainId,
} from "@starknet-react/core";
import * as chains from "@starknet-react/chains";

const containsDevnet = (networks: readonly chains.Chain[]) => {
  return (
    networks.filter((it) => it.network == chains.devnet.network).length > 0
  );
};

// Get the current target network (first one in the array)
const currentNetwork = scaffoldConfig.targetNetworks[0];
const currentNetworkName = currentNetwork.network;

export const getRpcUrl = (networkName: string): string => {
  const devnetRpcUrl = process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL;
  const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL;
  const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL;
  const fallBack = process.env.NEXT_PUBLIC_PROVIDER_URL;

  let rpcUrl = "";

  switch (networkName) {
    case "devnet":
      rpcUrl = devnetRpcUrl || fallBack || "";
      break;
    case "sepolia":
      rpcUrl = sepoliaRpcUrl || fallBack || "";
      break;
    case "mainnet":
      rpcUrl = mainnetRpcUrl || fallBack || "";
      break;
    default:
      rpcUrl = "";
      break;
  }

  return rpcUrl;
};

// Get RPC URL for the current network
const rpcUrl = getRpcUrl(currentNetworkName);

// Important: if the rpcUrl is empty (not configed in .env), we use the publicProvider
// which randomly choose a provider from the chain list of public providers.
// Some public provider might have strict rate limits.
if (rpcUrl === "") {
  console.warn(
    `No RPC Provider URL configured for ${currentNetworkName}. Using public provider.`,
  );
}

const provider =
  rpcUrl === "" || containsDevnet(scaffoldConfig.targetNetworks)
    ? publicProvider()
    : jsonRpcProvider({
        rpc: () => ({
          nodeUrl: rpcUrl,
          chainId: starknetChainId(currentNetwork.id),
        }),
      });

export default provider;
