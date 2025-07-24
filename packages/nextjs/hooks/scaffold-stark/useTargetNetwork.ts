import { useEffect } from "react";
import { useAccount } from "~~/hooks/useAccount";
import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { ChainWithAttributes } from "~~/utils/scaffold-stark";
// import { NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-stark";

/**
 * Returns the currently selected target network and related info.
 *
 * @returns {Object} An object containing:
 *   - targetNetwork: The current target network object
 *
 * @see https://scaffoldstark.com/docs/
 */
export function useTargetNetwork(): { targetNetwork: ChainWithAttributes } {
  const { chainId } = useAccount();
  const targetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);
  const setTargetNetwork = useGlobalState(
    ({ setTargetNetwork }) => setTargetNetwork
  );

  useEffect(() => {
    const newSelectedNetwork = scaffoldConfig.targetNetworks.find(
      (targetNetwork) => targetNetwork.id === chainId
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
