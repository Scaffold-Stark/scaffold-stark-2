import yargs from "yargs";
import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  loadExistingDeployments,
  resetDeployments,
} from "./deploy-contract";
import { green, yellow } from "./helpers/colorize-log";

const deployScript = async (): Promise<void> => {
 const existingDeployments = loadExistingDeployments();
 if (Object.keys(existingDeployments).length > 0) {
   console.log(yellow("Appending to existing deployments..."));
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
    exportDeployments();
    console.log(
      green(`All Setup Done (${resetDeployments ? "Reset" : "Append"})`)
    );
  })
  .catch(console.error);