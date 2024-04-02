import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";

type ChainAttributes = {
  // color | [lightThemeColor, darkThemeColor]
  color: string | [string, string];
};

export type ChainWithAttributes = chains.Chain & Partial<ChainAttributes>;

export const NETWORKS_EXTRA_DATA: Record<string, ChainAttributes> = {
  [chains.devnet.network]: {
    color: "#b8af0c",
  },
  [chains.mainnet.network]: {
    color: "#ff8b9e",
  },
  [chains.sepolia.network]: {
    color: ["#5f4bb6", "#87ff65"],
  },
  [chains.goerli.network]: {
    color: "#48a9a6",
  },
};

/**
 * Gives the block explorer URL for a given address.
 * Defaults to Etherscan if no (wagmi) block explorer is configured for the network.
 */
export function getBlockExplorerAddressLink(
  network: chains.Chain,
  address: string
) {
  const blockExplorerBaseURL = network.explorers?.starkscan[0];
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/address/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://starkscan.co/contract/${address}`;
  }

  return `${blockExplorerBaseURL}/contract/${address}`;
}

export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
