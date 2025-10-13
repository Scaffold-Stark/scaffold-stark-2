import { RpcProvider, PaymasterRpc } from "starknet";
import scaffoldConfig from "~~/scaffold.config";

const providerCache = new Map<string, RpcProvider>();
let cachedPaymaster: PaymasterRpc | null = null;

export function getRpcProvider(opts?: {
  blockIdentifier?: "pre_confirmed" | "latest" | "pending";
}): RpcProvider {
  // Determine current target network from Scaffold config
  const currentNetwork = scaffoldConfig.targetNetworks[0];
  const currentNetworkName = String(currentNetwork.network);

  // Resolve RPC URL with precedence: RPC_URL (server override) > network-specific envs > defaults
  const devnetRpcUrl = process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL;
  const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_PROVIDER_URL;
  const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_PROVIDER_URL;

  let resolvedRpc = process.env.RPC_URL as string | undefined;
  if (!resolvedRpc) {
    switch (currentNetworkName) {
      case "devnet":
        resolvedRpc = devnetRpcUrl || "http://127.0.0.1:5050";
        break;
      case "sepolia":
        resolvedRpc =
          sepoliaRpcUrl ||
          "https://starknet-sepolia.public.blastapi.io/rpc/v0_9";
        break;
      case "mainnet":
        resolvedRpc =
          mainnetRpcUrl ||
          "https://starknet-mainnet.public.blastapi.io/rpc/v0_9";
        break;
      default:
        resolvedRpc = "http://127.0.0.1:5050";
        break;
    }
  }

  if (!resolvedRpc) throw new Error("Missing RPC URL configuration");
  const key = `${resolvedRpc}|${opts?.blockIdentifier || ""}`;
  const existing = providerCache.get(key);
  if (existing) return existing;
  const provider = new RpcProvider({
    nodeUrl: resolvedRpc,
    ...(opts?.blockIdentifier ? { blockIdentifier: opts.blockIdentifier } : {}),
  });
  providerCache.set(key, provider);
  return provider;
}

export function getPaymasterRpc(): PaymasterRpc {
  if (cachedPaymaster) return cachedPaymaster;
  const url = process.env.PAYMASTER_URL || "https://sepolia.paymaster.avnu.fi";
  const headers: Record<string, string> | undefined = process.env
    .PAYMASTER_API_KEY
    ? { "x-paymaster-api-key": process.env.PAYMASTER_API_KEY as string }
    : undefined;
  cachedPaymaster = new PaymasterRpc(
    headers ? { nodeUrl: url, headers } : { nodeUrl: url },
  );
  return cachedPaymaster;
}

export async function setupPaymaster(): Promise<{
  paymasterRpc: PaymasterRpc;
  isSponsored: boolean;
  gasToken?: string;
}> {
  const isSponsored =
    (process.env.PAYMASTER_MODE || "sponsored").toLowerCase() === "sponsored";
  if (isSponsored && !process.env.PAYMASTER_API_KEY) {
    throw new Error(
      "PAYMASTER_API_KEY is required when PAYMASTER_MODE is 'sponsored'",
    );
  }
  const paymasterRpc = getPaymasterRpc();
  const available = await paymasterRpc.isAvailable();
  if (!available) throw new Error("Paymaster service is not available");
  let gasToken: string | undefined;
  if (!isSponsored) {
    const supported = await paymasterRpc.getSupportedTokens();
    gasToken =
      (process.env.GAS_TOKEN_ADDRESS as string) || supported[0]?.token_address;
    if (!gasToken)
      throw new Error(
        "No supported gas tokens available (and GAS_TOKEN_ADDRESS not set)",
      );
  }
  return { paymasterRpc, isSponsored, gasToken };
}
