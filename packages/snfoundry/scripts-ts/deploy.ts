import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  deployContract_NotWait,
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
  // await deployContract({
  //   contract: "CardCollection",
  //   constructorArgs: {
  //     owner: deployer.address,
  //     card_factory: "0x0",
  //     base_uri: "https://bronze-well-bandicoot-776.mypinata.cloud/ipfs/QmbAEreDkVLyCuYwMXCzFLFNe6zaYtfr3LCxQutJSr82p2/"
  //   },
  // });
  await deployContract({
    contract: "PackAtemu",
    constructorArgs: {
      owner: deployer.address,
    },
  });
  await deployContract({
    contract: "CardCollectionFactory",
    constructorArgs: {
      owner: deployer.address,
      card_collection_class_hash: "0x7b2323590bdef4d4cd25e081eff3902a819b4798bd596dc9e5c62cdce688b9d",
      random_oracleless_contract_address: "0x02da9C98a2E5B60EA441C14371d062395cFB3864f1b6Fead23CE8Bc47b3d2ECD",
    },
  });
  // await deployContract_NotWait({
  //   salt: "0x7b2323590bdef4d4cd25e081eff3902a819b4798bd596dc9e5c62cdce688b9d",
  //   classHash: "0x07ddaaa4b8dc38c67481ae52968381f17b895f685cd976e10ab22be1572f72dd", // sepolia
  //   constructorCalldata: [],
  // });
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
