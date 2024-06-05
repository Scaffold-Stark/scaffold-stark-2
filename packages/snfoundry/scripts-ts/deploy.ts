import { deployContract, deployer, exportDeployments } from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  try {
    await deployContract(
      {
        owner: deployer.address, // the deployer address is the owner of the contract
      },
      "YourContract"
    );
  } catch (error) {
    console.log(error.message);
    if (error.message.includes("fetch failed")) {
      console.error(
        "Couldn't deploy. Did you forget to run yarn chain? Or you can change target network in scaffold.config.ts"
      );
    }

    throw error;
  }
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
