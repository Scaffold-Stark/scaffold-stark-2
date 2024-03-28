import { Chain } from "@starknet-react/chains";
import scaffoldConfig from "~~/scaffold.config";

export function getTargetNetworks(): Chain[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
