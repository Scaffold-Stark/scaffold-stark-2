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
  await deployContract(
    {
      owner:
        "0x034114DA641525543F43BBe8f931EA48158a90bd5c8af869d3eecf8364e04965",
      end_date: 4102444800,
      vote_date_limit: 4102444800,
      reference_token_price: 6525086109850,
      pragmaAddress:
        "0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b",
    },
    "BitcoinPrice"
  );
  //await deployContract(null, "EtherPrice");
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
