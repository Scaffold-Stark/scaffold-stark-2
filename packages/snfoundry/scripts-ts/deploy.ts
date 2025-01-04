import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
} from "./deploy-contract";
import { green } from "./helpers/colorize-log";

/**
 * Deploy a contract using the specified parameters.
 *
 * @example (deploy contract with contructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contract: "YourContract",
 *       contractName: "YourContractExportName",
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
 * @example (deploy contract without contructorArgs)
 * const deployScript = async (): Promise<void> => {
 *   await deployContract(
 *     {
 *       contract: "YourContract",
 *       contractName: "YourContractExportName",
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
  await deployContract({
    contract: "PackAtemu",
    constructorArgs: {
      owner: deployer.address,
    },
  });
  // await deployContract({
  //   contract: "CardCollection",
  //   constructorArgs: {
  //     owner: deployer.address,
  //     card_factory: "0x0",
  //     base_uri: "pinata.com/testurl/"
  //   },
  // });
  await deployContract({
    contract: "CardCollectionFactory",
    constructorArgs: {
      owner: deployer.address,
      card_collection_class_hash: "0x068f26bed9f5fe2eebc28ce574660695781f623632ac426032d1806f0919e355",
      random_oracle_contract_address: "0x60c69136b39319547a4df303b6b3a26fab8b2d78de90b6bd215ce82e9cb515c",
      eth_address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      random_oracle_callback_fee_limit: 100_000_000_000_000_0,
      max_random_oracle_callback_fee_deposit: 500_000_000_000_000_0,
    },
  });
};

deployScript()
  .then(async () => {
    executeDeployCalls()
      .then(() => {
        exportDeployments();
        console.log(green("All Setup Done"));
      })
      .catch((e) => {
        console.error(e);
        process.exit(1); // exit with error so that non subsequent scripts are run
      });
  })
  .catch(console.error);
