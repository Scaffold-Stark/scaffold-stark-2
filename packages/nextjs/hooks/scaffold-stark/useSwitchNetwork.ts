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
      // @ts-expect-error: Assert that window.starknet exists and isConnected is a boolean
      if (window.starknet && window.starknet.isConnected) {
        // @ts-expect-error: Assert that window.starknet.request is a function and the parameters match
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
