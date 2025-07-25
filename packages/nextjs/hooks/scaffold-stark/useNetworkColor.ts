import { useTargetNetwork } from "./useTargetNetwork";
import { useTheme } from "next-themes";
import { ChainWithAttributes } from "~~/utils/scaffold-stark";

export const DEFAULT_NETWORK_COLOR: [string, string] = ["#666666", "#bbbbbb"];

export function getNetworkColor(
  network: ChainWithAttributes,
  isDarkMode: boolean
) {
  const colorConfig = network.color ?? DEFAULT_NETWORK_COLOR;
  return Array.isArray(colorConfig)
    ? isDarkMode
      ? colorConfig[1]
      : colorConfig[0]
    : colorConfig;
}

/**
 * Returns a color string representing the current network for UI theming.
 *
 * @param networkId - The network ID
 * @returns {string} The color associated with the network
 *
 * @see https://scaffoldstark.com/docs/
 */
export const useNetworkColor = () => {
  const { resolvedTheme } = useTheme();
  const { targetNetwork } = useTargetNetwork();

  const isDarkMode = resolvedTheme === "dark";

  return getNetworkColor(targetNetwork, isDarkMode);
};
