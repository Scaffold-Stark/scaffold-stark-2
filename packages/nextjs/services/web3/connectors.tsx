import { argent, braavos } from "@starknet-react/core";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { BurnerConnector } from "./stark-burner/BurnerConnector";
import scaffoldConfig from "~~/scaffold.config";

const targetNetworks = getTargetNetworks();

export const connectors = getConnectors();

function getConnectors() {
  const { targetNetworks } = scaffoldConfig;

  const connectors = [argent(), braavos()];

  if (
    targetNetworks.some((network) => (network.network as string) === "devnet")
  ) {
    connectors.push(new BurnerConnector());
  }

  return connectors.sort(() => Math.random() - 0.5);
}

export const appChains = targetNetworks;
