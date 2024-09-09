import { Contract, Provider, uint256 } from "starknet";
import { Abi } from "starknet";
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
        name: "balanceOf",
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
            return getTxVersionFromFeeToken(feeToken);
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
                return getTxVersionFromFeeToken(token.name);
            }
            console.log(
                red(`${token.name.toUpperCase()} balance is zero, trying next option`)
            );
        }
    }

    console.error(
        red("Error: Unable to find a fee token with sufficient balance. Please fund your wallet first.")
    );
    throw new Error("No fee token with balance found");
}

export async function getBalance(
    account: string,
    provider: Provider,
    tokenAddress: string
): Promise<bigint> {
    const contract = new Contract(erc20ABI, tokenAddress, provider);
    const { balance } = await contract.balanceOf(account);
    return uint256.uint256ToBN(balance);
}

function getTxVersionFromFeeToken(feeToken: string) {
    return feeToken === "strk" ? "0x3" : "0x1";
}
