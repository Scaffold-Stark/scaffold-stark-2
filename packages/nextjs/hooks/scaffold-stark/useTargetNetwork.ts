import { useEffect } from "react";
import { useAccount } from "~~/hooks/useAccount";
import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { ChainWithAttributes } from "~~/utils/scaffold-stark";
// import { NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-stark";

/**
 * Retrieves the target network based on the connected wallet or defaults to the first network.
 * This hook gets the network from the connected wallet's chainId and updates the global state
 * when the network changes. If no wallet is connected, it defaults to the first network in the config.
 *
 * @returns {Object} An object containing:
 *   - targetNetwork: ChainWithAttributes - The target network with all its attributes and configuration
 */
export function useTargetNetwork(): { targetNetwork: ChainWithAttributes } {
  const { chainId } = useAccount();
  const targetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);
  const setTargetNetwork = useGlobalState(
    ({ setTargetNetwork }) => setTargetNetwork,
  );

  useEffect(() => {
    const newSelectedNetwork = scaffoldConfig.targetNetworks.find(
      (targetNetwork) => targetNetwork.id === chainId,
    );
    if (newSelectedNetwork && newSelectedNetwork.id !== targetNetwork.id) {
      setTargetNetwork(newSelectedNetwork);
    }
  }, [chainId, setTargetNetwork, targetNetwork.id]);

  return {
    targetNetwork: {
      ...targetNetwork,
      //   ...NETWORKS_EXTRA_DATA[targetNetwork.id],
    },
  };
}
