import { argent, braavos } from "@starknet-react/core";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { BurnerConnector } from "./stark-burner/BurnerConnector";
import scaffoldConfig from "~~/scaffold.config";

const targetNetworks = getTargetNetworks();

export const  connectors  = getConnectors();

export function getConnectors() {
    const { targetNetworks } = scaffoldConfig;
  
    const connectors = [argent(), braavos()];
  
    if (targetNetworks.some(network => network.network === 'devnet')) {
      connectors.push(new BurnerConnector());
    }

    return connectors;
  }

export const appChains = targetNetworks;
