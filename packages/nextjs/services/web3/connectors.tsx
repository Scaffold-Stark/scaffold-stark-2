import type { InjectedConnector } from "@starknet-react/core";
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { supportedChains } from "~~/supportedChains";

const targetNetworks = scaffoldConfig.targetNetworks;

export const appChains = getTargetNetworks();

export type WalletConnectorType = 
  | 'argent' 
  | 'braavos' 
  | 'keplr' 
  | 'burner';

export async function loadConnector(type: WalletConnectorType): Promise<InjectedConnector> {
  const isDevnet = targetNetworks.some(
    (network) => (network.network as string) === "devnet",
  );

  switch (type) {
    case 'argent':
    case 'braavos': {
      const core = await importReactCore();
      return type === "argent" ? core.argent() : core.braavos();
    }
    case 'keplr': {
      if (!isDevnet) {
        const { KeplrConnector } = await import("./keplr");
        return new KeplrConnector();
      }
      throw new Error('Keplr not supported in devnet');
    }
    case 'burner': {
      if (isDevnet) {
        const { BurnerConnector } = await import("@scaffold-stark/stark-burner");
        const burnerConnector = new BurnerConnector();
        burnerConnector.chain = supportedChains.devnet;
        return burnerConnector as unknown as InjectedConnector;
      }
      throw new Error('Burner connector only supported in devnet');
    }
    default:
      throw new Error(`Unsupported connector type: ${type}`);
  }
}

export async function getConnectors(): Promise<InjectedConnector[]> {
  const connectors: InjectedConnector[] = [];
  const core = await importReactCore();

  // Default connectors that are always available
  connectors.push(core.argent(), core.braavos());

  const isDevnet = targetNetworks.some(
    (network) => (network.network as string) === "devnet",
  );

  if (!isDevnet) {
    const { KeplrConnector } = await import("./keplr");
    connectors.push(new KeplrConnector());
  } else {
    const { BurnerConnector } = await import("@scaffold-stark/stark-burner");
    const burner = new BurnerConnector();
    burner.chain = supportedChains.devnet;
    connectors.push(burner as unknown as InjectedConnector);
  }

  return connectors.sort(() => Math.random() - 0.5).map(withDisconnectWrapper);
}

// Wrap disconnect to avoid autoconnect loop
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

// Helper to import Starknet core module once
async function importReactCore() {
  return await import("@starknet-react/core");
}