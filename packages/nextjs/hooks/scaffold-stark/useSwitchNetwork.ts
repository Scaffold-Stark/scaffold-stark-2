
declare global {
  interface Window {
    starknet?: {
      isConnected: boolean;
      request: (params: { type: string; params: { chainId: string } }) => Promise<void>;
    };
  }
}


const getChainId = (network: string): string => {
  switch (network) {
    case "mainnet":
      return "SN_MAIN";
    case "devnet":
      return "SN_GOERLI";
    default:
      return `SN_${network.toUpperCase()}`;
  }
};

export const useSwitchNetwork = () => {
  return {
    switchNetwork: async (network: string) => {
      if (window.starknet && window.starknet.isConnected) {
        await window.starknet.request({
          type: "wallet_switchStarknetChain",
          params: {
            chainId: getChainId(network),
          },
        });
      }
    },
  };
};
