import { deployContract, deployer, exportDeployments } from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  //  await deployContract(
  //    {
  //      owner: deployer.address, // the deployer address is the owner of the contract
  //    },
  //    "YourContract"
  //  );
  await deployContract(null, "PragmaPrice");
  await deployContract(null, "StarkPrice");
  await deployContract(null, "BitcoinPrice");
  await deployContract(null, "EtherPrice");
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
