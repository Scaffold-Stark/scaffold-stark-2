const { deployer, deployContract } = require("./deploy_contract");
const deployScript = async () => {
  await deployContract(
    {
      owner: deployer.address, // the deployer address is the owner of the contract
    },
    "Challenge0"
  );
  
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
