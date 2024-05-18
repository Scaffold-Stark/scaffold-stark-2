import { deployContract, deployer } from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  await deployContract(null,
    "HelloStarknet",
  );
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
