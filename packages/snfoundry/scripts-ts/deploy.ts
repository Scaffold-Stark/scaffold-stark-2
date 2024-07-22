import { deployContract, deployer, exportDeployments } from "./deploy-contract";

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
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch((error) => {
    if (
      typeof error.message === "string" &&
      error.message.includes("no such file") &&
      error.message.includes("compiled_contract_class")
    ) {
      const match = error.message.match(
        /\/dev\/(.+?)\.compiled_contract_class/
      );
      const contractName = match ? match[1].split("_").pop() : "Unknown";
      console.error(`The contract "${contractName}" doesn't exist`);
    } else {
      console.error(error);
    }
  });
