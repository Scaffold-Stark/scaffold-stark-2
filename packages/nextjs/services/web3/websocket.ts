import scaffoldConfig from "~~/scaffold.config";
import { Chain } from "@starknet-react/chains";
import { WebSocketChannel } from "starknet";

// Cache one channel per ws url
const urlToChannel: Record<string, WebSocketChannel> = {};

const httpToWs = (httpUrl: string): string => {
  if (!httpUrl) return "";
  // Replace protocol with secure websocket
  const wsBase = httpUrl.replace(/^http/i, "ws");
  // If it already ends with "/ws", keep it
  if (wsBase.endsWith("/ws")) return wsBase;
  // For local devnet (127.0.0.1:5050), replace /rpc with /ws or append /ws
  if (wsBase.includes("127.0.0.1:5050")) {
    if (wsBase.includes("/rpc")) {
      return wsBase.replace("/rpc", "/ws");
    }
    return wsBase.endsWith("/") ? `${wsBase}ws` : `${wsBase}/ws`;
  }
  // For other providers, keep the same path as HTTP (no /ws suffix needed)
  return wsBase;
};

export const getWsUrlForChain = (chain: Chain): string => {
  const network = chain.network;
  const devnetWs = process.env.NEXT_PUBLIC_DEVNET_WS_PROVIDER_URL;
  const sepoliaWs = process.env.NEXT_PUBLIC_SEPOLIA_WS_PROVIDER_URL;
  const mainnetWs = process.env.NEXT_PUBLIC_MAINNET_WS_PROVIDER_URL;

  // Prefer explicit WS env, else derive from configured HTTP rpcUrls
  switch (network) {
    case "devnet":
      return (
        devnetWs ||
        httpToWs(chain.rpcUrls.public.http[0] || "http://127.0.0.1:5050/rpc")
      );
    case "sepolia":
      return (
        sepoliaWs ||
        httpToWs(
          chain.rpcUrls.public.http[0] ||
            "https://starknet-sepolia.public.blastapi.io/rpc/v0_9",
        )
      );
    case "mainnet":
      return (
        mainnetWs ||
        httpToWs(
          chain.rpcUrls.public.http[0] ||
            "https://starknet-mainnet.public.blastapi.io/rpc/v0_9",
        )
      );
    default:
      return httpToWs(chain.rpcUrls.public.http[0] || "");
  }
};

export const getSharedWebSocketChannel = async (
  chain?: Chain,
): Promise<WebSocketChannel | null> => {
  const target = chain || scaffoldConfig.targetNetworks[0];
  const wsUrl = getWsUrlForChain(target);
  if (!wsUrl) return null;
  if (!urlToChannel[wsUrl]) {
    urlToChannel[wsUrl] = new WebSocketChannel({ nodeUrl: wsUrl });
    try {
      await urlToChannel[wsUrl].waitForConnection();
    } catch (e) {
      // On failure, drop channel and return null to allow fallbacks
      delete urlToChannel[wsUrl];
      return null;
    }
  }
  return urlToChannel[wsUrl];
};

export const closeAllWebSocketChannels = async () => {
  const entries = Object.entries(urlToChannel);
  await Promise.all(
    entries.map(async ([key, ch]) => {
      try {
        const anyCh = ch as any;
        if (typeof anyCh.disconnect === "function") {
          await anyCh.disconnect();
        }
      } catch {}
      delete urlToChannel[key];
    }),
  );
};
