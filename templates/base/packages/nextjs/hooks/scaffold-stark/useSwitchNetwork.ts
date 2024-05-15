export const useSwitchNetwork = () => {
  return {
    switchNetwork: async (network: string) => {
      // @ts-ignore
      if (window.starknet && window.starknet.isConnected) {
        // @ts-ignore
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
