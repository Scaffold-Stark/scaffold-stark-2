const { deployer, deployContract } = require("./deploy-contract");
const deployScript = async () => {
  await deployContract(null, "HelloStarknet");
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
