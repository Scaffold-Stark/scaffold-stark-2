import { Chain } from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";

export type ChainWithAttributes = Chain;

export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
