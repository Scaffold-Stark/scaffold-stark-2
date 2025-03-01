import scaffoldConfig from "~~/scaffold.config";
import {
  jsonRpcProvider,
  publicProvider,
  starknetChainId,
} from "@starknet-react/core";
import * as chains from "@starknet-react/chains";

const containsDevnet = (networks: readonly chains.Chain[]) => {
  return (
    networks.filter((it) => it.network == chains.devnet.network).length > 0
  );
};

// Get the current target network (first one in the array)
const currentNetwork = scaffoldConfig.targetNetworks[0];
const currentNetworkId = String(currentNetwork.id);

// Get RPC URL for the current network
const rpcUrl = scaffoldConfig.rpcProviderUrl[currentNetworkId] || "";

const provider =
  rpcUrl === "" || containsDevnet(scaffoldConfig.targetNetworks)
    ? publicProvider()
    : jsonRpcProvider({
        rpc: () => ({
          nodeUrl: rpcUrl,
          chainId: starknetChainId(currentNetwork.id),
        }),
      });

export default provider;