/**
 * Provides a function to switch the connected network.
 * This hook returns a function that can be used to request the connected wallet
 * to switch to a different Starknet network.
 *
 * @returns {Object} An object containing:
 *   - switchNetwork: (network: string) => Promise<void> - Async function that takes a network name and requests the wallet to switch to it
 */
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
