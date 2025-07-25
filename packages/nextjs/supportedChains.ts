import * as chains from "@starknet-react/chains";

const rpcUrlDevnet =
  process.env.NEXT_PUBLIC_DEVNET_PROVIDER_URL || "http://127.0.0.1:5050";
// devnet with mainnet network ID
const mainnetFork = {
  id: BigInt("0x534e5f4d41494e"),
  network: "devnet",
  name: "Starknet Devnet",
  nativeCurrency: {
    address:
      "0x4718F5A0FC34CC1AF16A1CDEE98FFB20C31F5CD61D6AB07201858F4287C938D",
    name: "STRK",
    symbol: "STRK",
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: [`${rpcUrlDevnet}/rpc`],
    },
  },
  paymasterRpcUrls: {
    default: {
      http: [],
    },
  },
} as chains.Chain;

const devnet = {
  ...chains.devnet,
  rpcUrls: {
    default: {
      http: [],
    },
    public: {
      http: [`${rpcUrlDevnet}/rpc`],
    },
  },
} as const satisfies chains.Chain;

export const supportedChains = { ...chains, devnet, mainnetFork };
