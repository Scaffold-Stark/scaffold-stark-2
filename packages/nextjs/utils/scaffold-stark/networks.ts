import * as chains from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";

type ChainAttributes = {
  // color | [lightThemeColor, darkThemeColor]
  color: string | [string, string];
  nativeCurrencyTokenAddress?: string;
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
};
/**
 * Gives the block explorer transaction URL, returns empty string if the network is a local chain
 */
export function getBlockExplorerTxLink(network: string, txnHash: string) {
  const chainNames = Object.keys(chains);

  const targetChainArr = chainNames.filter((chainName) => {
    const wagmiChain = chains[chainName as keyof typeof chains];
    return wagmiChain.network === network;
  });

  if (targetChainArr.length === 0) {
    return "";
  }

  const targetChain = targetChainArr[0] as keyof typeof chains;
  // @ts-expect-error : ignoring error since `blockExplorers` key may or may not be present on some chains
  const blockExplorerBaseURL = chains[targetChain].explorers?.starkscan[0];

  if (!blockExplorerBaseURL) {
    return `https://starkscan.co/tx/${txnHash}`;
  }

  return `${blockExplorerBaseURL}/tx/${txnHash}`;
}

/**
 * Gives the block explorer URL for a given address.
 * Defaults to Etherscan if no (wagmi) block explorer is configured for the network.
 */
export function getBlockExplorerAddressLink(
  network: chains.Chain,
  address: string,
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

/**
 * Gives the block explorer URL for a given classhash.
 * Defaults to Etherscan if no (wagmi) block explorer is configured for the network.
 */
export function getBlockExplorerClasshashLink(
  network: chains.Chain,
  address: string,
) {
  const blockExplorerBaseURL = network.explorers?.starkscan[0];
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/class/${address}`;
  }

  if (!blockExplorerBaseURL) {
    return `https://starkscan.co/class/${address}`;
  }

  return `${blockExplorerBaseURL}/class/${address}`;
}

export function getBlockExplorerLink(network: chains.Chain) {
  switch (network) {
    case chains.mainnet:
      return "https://starkscan.co/";
    default:
    case chains.devnet:
    case chains.sepolia:
      return "https://sepolia.starkscan.co/";
  }
}

export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
