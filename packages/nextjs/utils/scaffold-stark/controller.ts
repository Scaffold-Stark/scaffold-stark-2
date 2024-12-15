"use client";
import ControllerConnector from "@cartridge/connector/controller";
import { Chain, mainnet, sepolia } from "@starknet-react/chains";
import { InjectedConnector } from "@starknet-react/core";
import scaffoldConfig from "~~/scaffold.config";

function controllerProvider(chain: Chain) {
  switch (chain) {
    case mainnet:
      return { nodeUrl: "https://api.cartridge.gg/x/starknet/mainnet" };
    case sepolia:
      return { nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia" };
    default:
      return { nodeUrl: "https://api.cartridge.gg/x/starknet/sepolia" };
  }
}

export const controllerInstance = new ControllerConnector({
  rpc: controllerProvider(scaffoldConfig.targetNetworks[0]).nodeUrl,
}) as never as InjectedConnector;
