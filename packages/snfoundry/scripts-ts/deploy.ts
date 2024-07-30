import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
} from "./deploy-contract";


/**
 * Deploy a contract using the specified parameters.
 *
 * @example (deploy contract with contructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contractName: "YourContract",
 *       exportContractName: "YourContractExportName",
 *       constructorArgs: {
 *         owner: deployer.address,
 *       },
 *       options: {
 *         maxFee: BigInt(1000000000000)
 *       }
 *     }
 *   );
 * };
 * 
 * @example (deploy contract without)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contractName: "YourContract",
 *       exportContractName: "YourContractExportName",
 *       options: {
 *         maxFee: BigInt(1000000000000)
 *       }
 *     }
 *   );
 * };
 * 
 *
 * @returns {Promise<void>}
 */
const deployScript = async (): Promise<void> => {
  await deployContract(
    {
      contractName: "YourContract",
      exportContractName: "YourContractExportName",
      constructorArgs: {
        owner: deployer.address,
      },
      options:{
        maxFee: BigInt(1000000000000)
      }
    }
  );
};

deployScript()
  .then(() => {
    executeDeployCalls().then(() => {
      exportDeployments();
    });
    console.log("All Setup Done");
  })
  .catch(console.error);
