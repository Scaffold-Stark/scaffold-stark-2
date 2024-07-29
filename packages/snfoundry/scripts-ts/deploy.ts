import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
} from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  await deployContract(
    "YourContract",
    "YourContract",
    {
      owner: deployer.address, // the deployer address is the owner of the contract
    },
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
