import { useTargetNetwork } from "./useTargetNetwork";
import { useTheme } from "next-themes";
import { ChainWithAttributes } from "~~/utils/scaffold-stark";

export const DEFAULT_NETWORK_COLOR: [string, string] = ["#666666", "#bbbbbb"];

export function getNetworkColor(
  network: ChainWithAttributes,
  isDarkMode: boolean,
) {
  const colorConfig = network.color ?? DEFAULT_NETWORK_COLOR;
  return Array.isArray(colorConfig)
    ? isDarkMode
      ? colorConfig[1]
      : colorConfig[0]
    : colorConfig;
}

/**
 * Gets the color of the target network based on the current theme.
 * This hook returns the appropriate color for the target network, taking into account
 * whether the current theme is light or dark mode.
 *
 * @returns {string} The network color as a CSS color value (hex, rgb, etc.)
 */
export const useNetworkColor = () => {
  const { resolvedTheme } = useTheme();
  const { targetNetwork } = useTargetNetwork();

  const isDarkMode = resolvedTheme === "dark";

  return getNetworkColor(targetNetwork, isDarkMode);
};
