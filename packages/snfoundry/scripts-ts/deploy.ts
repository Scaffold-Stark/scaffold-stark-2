import yargs from "yargs";
import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  loadExistingDeployments,
} from "./deploy-contract";
import { green, yellow } from "./helpers/colorize-log";

const argv = yargs(process.argv.slice(2))
  .options({
    network: { type: "string", demandOption: true },
    reset: { type: "boolean", default: false },
  })
  .parseSync();

const deployScript = async (): Promise<void> => {
  if (argv.reset) {
    console.log(yellow("Resetting deployments..."));
  } else {
    const existingDeployments = loadExistingDeployments();
    if (Object.keys(existingDeployments).length > 0) {
      console.log(yellow("Appending to existing deployments..."));
    }
  }

  await deployContract({
    contract: "YourContract",
    constructorArgs: {
      owner: deployer.address,
    },
  });
};

deployScript()
  .then(async () => {
    await executeDeployCalls();
    exportDeployments(argv.reset);
    console.log(green(`All Setup Done (${argv.reset ? "Reset" : "Append"})`));
  })
  .catch(console.error);