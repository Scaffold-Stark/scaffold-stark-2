export const useSwitchNetwork = () => {
  return {
    switchNetwork: async (network: string) => {
      if (window.starknet && window.starknet.isConnected) {
        await window.starknet.request({
          type: "wallet_switchStarknetChain",
          params: {
            chainId: `SN_${
              network == "mainnet" ? "MAIN" : network.toUpperCase()
            }`,
          },
        });
      }
    },
  };
};
