import { Contract, Abi, Call, RpcProvider } from "starknet";
import { getTargetNetwork } from "~~/utils/scaffold-stark/network";

const MULTICALL_ADDRESSES: { [key: number]: string } = {
  // Add your network-specific multicall addresses here
  // Example:
  // 1: "0x123...", // Mainnet
  // 5: "0x456...", // Testnet
};

const MULTICALL_ABI = [
  {
    name: "aggregate",
    type: "function",
    inputs: [
      {
        name: "calls",
        type: "felt*",
      },
    ],
    outputs: [
      {
        name: "block_number",
        type: "felt",
      },
      {
        name: "return_data",
        type: "felt*",
      },
    ],
    stateMutability: "view",
  },
];

export const getMulticallContract = (chainId?: number) => {
  if (!chainId) {
    throw new Error("Chain ID is required");
  }

  const address = MULTICALL_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`Multicall contract not found for chain ID ${chainId}`);
  }

  const provider = new RpcProvider({
    nodeUrl: getTargetNetwork().rpcUrls.public.http[0],
  });

  return new Contract(MULTICALL_ABI as Abi, address, provider);
};

interface AbiItem {
  type: string;
  name: string;
  outputs?: Array<{
    type: string;
    name: string;
  }>;
}

export const parseMulticallResults = (
  rawResults: { block_number: bigint; return_data: bigint[] },
  abis: Abi[],
  functionNames: string[]
) => {
  const results: any[] = [];
  let currentIndex = 0;

  for (let i = 0; i < abis.length; i++) {
    const abi = abis[i];
    const functionName = functionNames[i];
    const functionAbi = abi.find(
      (item: AbiItem) => item.type === "function" && item.name === functionName
    );

    if (!functionAbi || !("outputs" in functionAbi)) {
      throw new Error(`Function ${functionName} not found in ABI`);
    }

    const outputTypes = functionAbi.outputs!.map((output: { type: string }) => output.type);
    const result = decodeMulticallResult(
      rawResults.return_data.slice(currentIndex),
      outputTypes
    );
    results.push(result);
    currentIndex += outputTypes.length;
  }

  return results;
};

const decodeMulticallResult = (data: bigint[], types: string[]): any => {
  if (types.length === 1) {
    return decodeSingleValue(data[0], types[0]);
  }

  return types.map((type, index) => decodeSingleValue(data[index], type));
};

const decodeSingleValue = (value: bigint, type: string): any => {
  switch (type) {
    case "felt":
      return value;
    case "felt*":
      return value;
    case "u8":
      return Number(value);
    case "u16":
      return Number(value);
    case "u32":
      return Number(value);
    case "u64":
      return value;
    case "u128":
      return value;
    case "u256":
      return value;
    case "bool":
      return value !== 0n;
    default:
      return value;
  }
}; 