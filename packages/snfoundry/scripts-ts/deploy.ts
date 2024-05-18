import {
  deployContract,
  deployer,
  resetDeploymentState,
} from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  resetDeploymentState();

  await deployContract(
    {
      owner: deployer.address, // the deployer address is the owner of the contract
    },
    "YourContract"
  );
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
