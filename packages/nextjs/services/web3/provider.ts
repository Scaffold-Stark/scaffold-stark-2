import scaffoldConfig from "~~/scaffold.config";
import {
  jsonRpcProvider,
  publicProvider,
  starknetChainId,
} from "@starknet-react/core";
import * as chains from "@starknet-react/chains";

const containsDevnet = (networks: readonly chains.Chain[]) => {
  return networks.filter((it) => it.id == chains.devnet.id).length > 0;
};

const provider = jsonRpcProvider({
  rpc: () =>
    // @ts-ignore cannot use ts expect error since it will complain if set to devnet
    scaffoldConfig.targetNetworks[0].network === "devnet"
      ? {
          nodeUrl: "http://127.0.0.1:5050",
          chainId: starknetChainId(scaffoldConfig.targetNetworks[0].id),
        }
      : {
          nodeUrl: scaffoldConfig.rpcProviderUrl,
          chainId: starknetChainId(scaffoldConfig.targetNetworks[0].id),
        },
});

export default provider;
