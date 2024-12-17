import { argent, braavos, InjectedConnector } from "@starknet-react/core";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { BurnerConnector } from "@scaffold-stark/stark-burner";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";

const targetNetworks = getTargetNetworks();

export const connectors = getConnectors();

// workaround helper function to properly disconnect with removing local storage (prevent autoconnect infinite loop)
function withDisconnectWrapper(connector: InjectedConnector) {
  const connectorDisconnect = connector.disconnect;
  const _disconnect = (): Promise<void> => {
    localStorage.removeItem("lastUsedConnector");
    localStorage.removeItem(LAST_CONNECTED_TIME_LOCALSTORAGE_KEY);
    return connectorDisconnect();
  };
  connector.disconnect = _disconnect.bind(connector);
  return connector;
}

function getConnectors() {
  const { targetNetworks } = scaffoldConfig;

  const connectors: InjectedConnector[] = [argent(), braavos()];

  if (
    targetNetworks.some((network) => (network.network as string) === "devnet")
  ) {
    const burnerConnector = new BurnerConnector();
    connectors.push(burnerConnector as unknown as InjectedConnector);
  }

  return connectors.sort(() => Math.random() - 0.5).map(withDisconnectWrapper);
}

export const appChains = targetNetworks;
