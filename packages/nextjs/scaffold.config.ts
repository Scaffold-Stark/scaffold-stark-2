import * as chains from "@starknet-react/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
};

const scaffoldConfig = {
  targetNetworks: [chains.sepolia],
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
