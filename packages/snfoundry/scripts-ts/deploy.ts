import { deployContract, deployer, exportDeployments } from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  await deployContract(
    {
      owner: deployer.address, // the deployer address is the owner of the contract
    },
    "YourContract",
    "YourContract1"
  );
  await deployContract(
    {
      owner: deployer.address, // the deployer address is the owner of the contract
    },
    "YourContract",
    "YourContract2"
  );
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
