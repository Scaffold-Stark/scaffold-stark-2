import chalk from "chalk";
import { Account, Contract, RpcProvider, shortString } from "starknet";

const createHyperlink = (url: string, text?: string) => {
  const displayText = text || url;
  return `\u001b]8;;${url}\u0007${displayText}\u001b]8;;\u0007`;
};
// logDeploymentSummary function logs the deployment summary of contracts on a given network.
export const logDeploymentSummary = ({
  network,
  transactionHash,
  deployments,
}: {
  network: string;
  transactionHash: string;
  deployments: Record<string, { address: string }>;
}) => {
  let baseUrl: any;
  if (network === "sepolia") {
    baseUrl = `https://sepolia.starkscan.co`;
  } else if (network === "mainnet") {
    baseUrl = `https://starkscan.co`;
  } else {
    console.error(chalk.red(`Unsupported network: ${network}`));
    return;
  }

  console.log(chalk.green("\n📦 Deployment Summary\n"));
  console.log(`${chalk.blue("🌐 Network:")} ${chalk.white(network)}\n`);
  console.log(chalk.cyan("🔗 Transaction:"));
  const txUrl = `${baseUrl}/tx/${transactionHash}`;
  console.log(createHyperlink(txUrl) + "\n");

  for (const [name, { address }] of Object.entries(deployments)) {
    console.log(chalk.yellow(`📄 ${name} Contract:`));
    const contractUrl = `${baseUrl}/contract/${address}`;
    console.log(createHyperlink(contractUrl) + "\n");
  }
};
// postDeploymentBalanceSummary function logs the balance of the deployer after deployment.
export const postDeploymentBalanceSummary = async ({
  provider,
  deployer,
  reciept,
  feeToken,
}: {
  provider: RpcProvider;
  deployer: Account;
  reciept: any;
  feeToken: {
    name: string;
    address: string;
  }[];
}) => {
  console.log(chalk.blue("💰 Deployer Balance Summary:"));
  console.log(`Deployer-Address: ${deployer.address}`);

  if (!feeToken || feeToken.length === 0) {
    console.log(
      chalk.red(
        "Error: No fee token information provided. Cannot fetch balance."
      )
    );
    return;
  }
  const symbol = reciept.actual_fee.unit === "FRI" ? "strk" : "eth";
  const tokenInfo = feeToken.find(
    (token) => token.name.toLowerCase() === symbol
  );

  try {
    // Get the contract ABI directly from the chain.
    const { abi } = await provider.getClassAt(tokenInfo.address);

    // Create a Contract instance for the ERC20 token.
    const erc20Contract = new Contract({
      abi,
      address: tokenInfo.address,
      providerOrAccount: provider,
    });

    // Call the `balanceOf` function.
    // This correctly assumes `balanceOf` returns a BigInt directly.
    const rawBalance: BigInt = await erc20Contract.balanceOf(deployer.address);

    // Get the token decimals for proper formatting.
    let decimals = 18; // Default to 18 if fetching fails.
    try {
      const decimalsResult = await erc20Contract.decimals();
      if (decimalsResult !== undefined && decimalsResult !== null) {
        decimals = Number(decimalsResult.toString());
      }
    } catch (e) {
      console.warn(
        chalk.yellow(
          `Could not fetch decimals for ${tokenInfo.name}. Assuming 18 decimals.`
        )
      );
    }

    // Convert the raw BigInt balance to a human-readable format.
    const formattedBalance = parseFloat(rawBalance.toString()) / 10 ** decimals;

    // Log the final formatted balance.
    console.log(
      `💰Post-Deployer-Balance: ${formattedBalance.toFixed(decimals)} ${
        tokenInfo.name
      }`
    );
  } catch (error) {
    console.error(
      chalk.red(`Error fetching deployer balance for ${tokenInfo.name}:`),
      error
    );
    if (error instanceof Error) {
      console.error(chalk.red("Error message:"), error.message);
    }
  }
};
