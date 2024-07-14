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

    return shuffleArray(connectors);
}

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

export const appChains = targetNetworks;
