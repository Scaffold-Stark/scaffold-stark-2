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
  //  await deployContract(
  //    {
  //      owner: deployer.address, // the deployer address is the owner of the contract
  //    },
  //    "YourContract"
  //  );
  //await deployContract(null, "PragmaPrice");
  //await deployContract(null, "StarkPrice");
  /* await deployContract(
    {
      owner: deployer.address,
      end_date: 1720211400000,
      vote_date_limit: 1720211400000,
      reference_token_price: 652086109850,
      pragmaAddress:
        "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
    },
    "BitcoinPrice"
  );
  await deployContract(
    {
      owner: deployer.address,
      end_date: 1720211400000,
      vote_date_limit: 1720211400000,
      reference_token_price: 349956000000,
      pragmaAddress:
        "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
    },
    "EtherPrice"
  );
  await deployContract(
    {
      owner: deployer.address,
      end_date: 1720211400000,
      vote_date_limit: 1720211400000,
      reference_token_price: 96051271,
      pragmaAddress:
        "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
    },
    "StarkPrice"
  ); */
  /* await deployContract({
    owner: deployer.address,
      pragma_address:
      "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
  }, "BetCryptoMaker"); */

  await deployContract({
    contract: "BetCryptoMaker",
    constructorArgs: {
      owner: deployer.address,
      pragma_address:
        "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
    },
  });
};

deployScript()
  .then(async () => {
    await executeDeployCalls();
    exportDeployments();

    console.log(green("All Setup Done"));
  })
  .catch(console.error);
