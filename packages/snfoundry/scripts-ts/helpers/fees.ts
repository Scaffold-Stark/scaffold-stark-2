import { Account, Contract, Provider, uint256 } from "starknet";
import { Abi } from "starknet";
import { red, yellow } from "./colorize-log";

export const ETH_TOKEN_ADDRESS =
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
export const STRK_TOKEN_ADDRESS =
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

const ETH_TOKEN_ADDRESS_DEVNET = '0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7'
const STRK_TOKEN_ADDRESS_DEVNET = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'

const feeTokenOptions = {
    devnet: [
        { name: "eth", address: ETH_TOKEN_ADDRESS_DEVNET },
        { name: "strk", address: STRK_TOKEN_ADDRESS_DEVNET },
    ],
    mainnet: [
        { name: "eth", address: ETH_TOKEN_ADDRESS },
        { name: "strk", address: STRK_TOKEN_ADDRESS },
    ],
    sepolia: [
        { name: "eth", address: ETH_TOKEN_ADDRESS },
        { name: "strk", address: STRK_TOKEN_ADDRESS },
    ]
};

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
    deployer: Account,
    provider: Provider,
    feeToken: string,
    network: string
) {
    //check the specified feeToken
    const specifiedToken = feeTokenOptions[network].find(
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
    for (const token of feeTokenOptions[network]) {
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
