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
  await deployContract(
      {
        contract: "YourContract",
        contractName: "YourContractExportName",
        constructorArgs: {
          owner: deployer.address,
        },
        options: {
          //maxFee: BigInt(1000000000000)
        }
      }
  );

  await deployContract(
    {
      contract: "BetMaker",
      contractName: "BetMaker",
      constructorArgs: {
        owner: deployer.address,
      },
      options: {
        //maxFee: BigInt(1000000000000)
      }
    }
);


  // await deployContract({
  //   contract: "BetCryptoMaker",
  //   constructorArgs: {
  //     owner: deployer.address,
  //     pragma_address:
  //       "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
  //   },
  // });
};

deployScript()
  .then(async () => {
    await executeDeployCalls();
    exportDeployments();

    console.log(green("All Setup Done"));
  })
  .catch(console.error);


// ETH reference_token_price: 349956000000,
// BTC reference_token_price: 652086109850,
// STRK reference_token_price: 96051271,