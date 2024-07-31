import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
} from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  await deployContract(
    {
      owner: deployer.address, // the deployer address is the owner of the contract
    },
    "YourContract"
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
