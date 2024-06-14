import { deployContract, exportDeployments } from "./deploy-contract";

const deployScript = async (): Promise<void> => {
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
