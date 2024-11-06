import path from "path";
import { execSync } from "child_process";
import yargs from "yargs";
import { green, red, yellow } from "./helpers/colorize-log";
import deployedContracts from "../../nextjs/contracts/deployedContracts";

function main() {
  // Parse command line arguments
  const argv = yargs(process.argv.slice(2))
    .option("network", {
      type: "string",
      description: "Specify the network mainnet or sepolia",
      demandOption: true,
    })
    .parseSync();

  const network = argv.network;

  if (network !== "sepolia" && network !== "mainnet") {
    console.error(
      `Unsupported network: ${network}. Please use 'sepolia' or 'mainnet'.`
    );
    process.exit(1);
  }

  const contractsToVerify = deployedContracts[network];

  if (!contractsToVerify) {
    console.error(`No deployed contracts found for network: ${network}`);
    process.exit(1);
  }

  // Change to the contracts directory
  const contractsDir = path.resolve(__dirname, "../contracts");
  process.chdir(contractsDir);

  // Verify each contract
  Object.entries(contractsToVerify).forEach(
    ([contractName, contractInfo]: [string, any]) => {
      const { address, abi } = contractInfo;
      const interfaceNameItem = abi.find(
        (item) => item.type === "impl" && item.interface_name
      );
      if (!interfaceNameItem) {
        console.error(red(`Failed to find Contract for ${contractName}`));
        return;
      }
      const contractParts = interfaceNameItem.interface_name.split("::");
      const contract = contractParts[contractParts.length - 2];

      console.log(yellow(`Verifying ${contractName} on ${network}...`));
      try {
        execSync(
          `sncast verify --contract-address ${address} --contract-name ${contract} --network ${network} --verifier walnut --confirm-verification`,
          { stdio: "inherit" }
        );
        console.log(green("Successfully verified"), contractName);
      } catch (error) {
        console.error(red(`Failed to verify ${contractName}:`), error);
      }
    }
  );
  console.log(green("✅ Verification process completed."));
}

if (typeof module !== "undefined" && require.main === module) {
  main();
}
