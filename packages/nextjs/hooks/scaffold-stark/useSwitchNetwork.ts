
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
      // @ts-ignore
      if (window.starknet && window.starknet.isConnected) {
        const chainId = getChainId(network);

        // @ts-ignore
        await window.starknet.request({
          type: "wallet_switchStarknetChain",
          params: {
            chainId: chainId,
          },
        });
      }
    },
  };
};
