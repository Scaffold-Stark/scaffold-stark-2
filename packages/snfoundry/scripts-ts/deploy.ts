import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  declareContract,
} from "./deploy-contract";
import { green } from "./helpers/colorize-log";

/**
 * First declare and then deploy a contract using the specified parameters.
 *
 * @example (deploy contract with contructorArgs)
 * const mainScript = async (): Promise<void> => {
 *   await declareContract({
 *     contract: "YourContract",
 *     options: {}
 *   });
 *
 *   await deployContract({
 *     contract: "YourContract",
 *     contractName: "YourContractExportName",
 *     constructorArgs: {
 *       owner: deployer.address,
 *     },
 *     options: {
 *       maxFee: BigInt(1000000000000)
 *     }
 *   });
 * };
 *
 * @example (deploy contract without contructorArgs)
 * const mainScript = async (): Promise<void> => {
 *   await declareContract({
 *     contract: "YourContract",
 *     options: {}
 *   });
 *
 *   await deployContract({
 *     contract: "YourContract",
 *     contractName: "YourContractExportName",
 *     options: {
 *       maxFee: BigInt(1000000000000)
 *     }
 *   });
 * };
 *
 * @returns {Promise<void>}
 */
const mainScript = async (): Promise<void> => {
  try {
    await declareContract({
      contract: "YourContract",
      options: {},
    });

    await deployContract({
      contract: "YourContract",
      constructorArgs: {
        owner: deployer.address,
      },
    });

    await executeDeployCalls();
    exportDeployments();
    console.log(green("All Setup Done"));
  } catch (error) {
    console.error("Error in deployment process:", error);
    process.exit(1); // exit with error so that no subsequent scripts are run
  }
};

// Execute the main script
mainScript().catch(console.error);
