import { getTargetNetworks } from "~~/utils/scaffold-stark";
import { createBurnerWallet } from "@scaffold-stark/stark-burner";
import scaffoldConfig from "~~/scaffold.config";

const targetNetworks = getTargetNetworks();

export const appChains = targetNetworks;

function isBurnerWalletEnabled(): boolean {
  const isDevnet = targetNetworks.some((n) => n.network === "devnet");
  return !scaffoldConfig.onlyLocalBurnerWallet || isDevnet;
}

export const extraWallets = isBurnerWalletEnabled()
  ? [createBurnerWallet(targetNetworks[0])]
  : [];
