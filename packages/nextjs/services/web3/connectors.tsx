// import { argent, braavos, InjectedConnector } from '@starknet-react/core';
import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { BurnerConnector } from "@scaffold-stark/stark-burner";
import scaffoldConfig from "~~/scaffold.config";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";
import { KeplrConnector } from "./keplr";
import { supportedChains } from "~~/supportedChains";
import { Connector } from "@starknet-react/core";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

const targetNetworks = getTargetNetworks();

export const connectors = getConnectors();

// workaround helper function to properly disconnect with removing local storage (prevent autoconnect infinite loop)
function withDisconnectWrapper(connector: Connector) {
  const connectorDisconnect = connector.disconnect;
  const _disconnect = (): Promise<void> => {
    localStorage.removeItem("lastUsedConnector");
    localStorage.removeItem(LAST_CONNECTED_TIME_LOCALSTORAGE_KEY);
    return connectorDisconnect();
  };
  connector.disconnect = _disconnect.bind(connector);
  return connector;
}

function getConnectors(): Connector[] {
  const { targetNetworks } = scaffoldConfig;

  const connectors: Connector[] = [
    new InjectedConnector({
      options: { id: "argentX", name: "Argent X" },
    }),
    new InjectedConnector({
      options: { id: "braavos", name: "Braavos" },
    }),
  ];

  const isDevnet = targetNetworks.some(
    (network) => (network.network as string) === "devnet",
  );
  const isSepolia = targetNetworks.some(
    (network) => (network.network as string) === "sepolia",
  );

  if (isSepolia) {
    // Add standard connectors for mainnet/testnet
    connectors.push(
      new KeplrConnector(),
      new WebWalletConnector({ url: "https://sepolia-web.argent.xyz" }),
    );
  }
  if (!isDevnet && !isSepolia) {
    // Add standard connectors for mainnet/testnet
    connectors.push(
      new KeplrConnector(),
      new WebWalletConnector({ url: "https://web.argent.xyz" }),
    );
  }

  // Always add burner connector for devnet
  const burnerConnector = new BurnerConnector();
  if (isDevnet) {
    burnerConnector.chain = supportedChains.devnet;
  }
  connectors.push(burnerConnector);

  return connectors
    .map(withDisconnectWrapper)
    .filter((connector) => connector !== null);
}

export const appChains = targetNetworks;
