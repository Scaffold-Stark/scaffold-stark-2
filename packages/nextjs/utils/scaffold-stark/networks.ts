import scaffoldConfig from "~~/scaffold.config";
import { devnet, sepolia, mainnet, Chain } from "@starknet-start/chains";
export const chains = {
  devnet,
  sepolia,
  mainnet,
};

type ChainAttributes = {
  // color | [lightThemeColor, darkThemeColor]
  color: string | [string, string];
  nativeCurrencyTokenAddress?: string;
};

export type ChainWithAttributes = Chain & Partial<ChainAttributes>;

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
};
/**
 * Gives the block explorer transaction URL, returns empty string if the network is a local chain
 */
export function getBlockExplorerTxLink(network: string, txnHash: string) {
  const chainNames = Object.keys(chains);

  const targetChainArr = chainNames.filter((chainName) => {
    const starknetReactChain = chains[
      chainName as keyof typeof chains
    ] as Chain;
    return starknetReactChain.network === network;
  });

  if (targetChainArr.length === 0) {
    return "";
  }

  const targetChain = targetChainArr[0] as keyof typeof chains;
  const blockExplorerBaseURL = chains[targetChain].explorers?.voyager?.[0];

  if (!blockExplorerBaseURL) {
    return `https://voyager.online/tx/${txnHash}`;
  }

  return `${blockExplorerBaseURL}/tx/${txnHash}`;
}

/**
 * Gives the block explorer URL for a given address.
 * Defaults to Voyager if no block explorer is configured for the network.
 */
export function getBlockExplorerAddressLink(network: Chain, address: string) {
  const blockExplorerBaseURL = network.explorers?.voyager?.[0];
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/address/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://voyager.online/contract/${address}`;
  }

  return `${blockExplorerBaseURL}/contract/${address}`;
}

/**
 * Gives the block explorer URL for a given classhash.
 * Defaults to Voyager if no block explorer is configured for the network.
 */
export function getBlockExplorerClasshashLink(network: Chain, address: string) {
  const blockExplorerBaseURL = network.explorers?.voyager?.[0];
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/class/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://voyager.online/class/${address}`;
  }

  return `${blockExplorerBaseURL}/class/${address}`;
}

export function getBlockExplorerLink(network: Chain) {
  switch (network) {
    case chains.mainnet:
      return "https://voyager.online/";
    default:
    case chains.devnet:
    case chains.sepolia:
      return "https://sepolia.voyager.online/";
  }
}

export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
