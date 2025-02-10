import { Contract, Provider, uint256, Abi } from "starknet";
import { red, yellow } from "./colorize-log";
import { Network } from "../types";

export const erc20ABI = [
  {
    inputs: [
      {
        name: "account",
        type: "felt",
      },
    ],
    name: "balance_of",
    outputs: [
      {
        name: "balance",
        type: "Uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] satisfies Abi;

//function to decide preferred token for fee payment
export async function getTxVersion(
  network: Network,
  feeToken: string,
  isSierra?: boolean
) {
  const { feeToken: feeTokenOptions, provider, deployer } = network;

  //check the specified feeToken
  const specifiedToken = feeTokenOptions.find(
    (token) => token.name === feeToken
  );
  if (specifiedToken) {
    const balance = await getBalance(
      deployer.address,
      provider,
      specifiedToken.address
    );
    if (balance > 0n) {
      console.log(yellow(`Using ${feeToken.toUpperCase()} as fee token`));
      return getTxVersionFromFeeToken(feeToken, isSierra);
    }
    console.log(
      red(`${feeToken.toUpperCase()} balance is zero, trying other options`)
    );
  }

  // Check other options
  for (const token of feeTokenOptions) {
    if (token.name !== feeToken) {
      const balance = await getBalance(
        deployer.address,
        provider,
        token.address
      );
      if (balance > 0n) {
        console.log(yellow(`Using ${token.name.toUpperCase()} as fee token`));
        return getTxVersionFromFeeToken(token.name, isSierra);
      }
      console.log(
        red(`${token.name.toUpperCase()} balance is zero, trying next option`)
      );
    }
  }

  console.error(
    red(
      "Error: Unable to find a fee token with sufficient balance. Please fund your wallet first."
    )
  );
  throw new Error("No fee token with balance found");
}

export async function getBalance(
  account: string,
  provider: Provider,
  tokenAddress: string
): Promise<bigint> {
  try {
    const contract = new Contract(erc20ABI, tokenAddress, provider);
    const { balance } = await contract.balance_of(account);
    return uint256.uint256ToBN(balance);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0n;
  }
}

function getTxVersionFromFeeToken(feeToken: string, isSierra?: boolean) {
  return feeToken === "strk"
    ? TransactionVersion.V3
    : isSierra
    ? TransactionVersion.V2
    : TransactionVersion.V1;
}

/**
 * V_ Transaction versions HexString
 * F_ Fee Transaction Versions HexString (2 ** 128 + TRANSACTION_VERSION)
 */
export enum TransactionVersion {
  V0 = "0x0",
  V1 = "0x1",
  V2 = "0x2",
  V3 = "0x3",
  F0 = "0x100000000000000000000000000000000",
  F1 = "0x100000000000000000000000000000001",
  F2 = "0x100000000000000000000000000000002",
  F3 = "0x100000000000000000000000000000003",
}
