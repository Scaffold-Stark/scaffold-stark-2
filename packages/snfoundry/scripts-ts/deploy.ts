import { deployContract, deployer, exportDeployments } from "./deploy-contract";

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
  await deployContract({
    owner: deployer.address,
      pragma_address:
      "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
  }, "BetCryptoMaker");
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
