const { deployer, deployContract } = require("./deploy_contract");
const deployScript = async () => {
  await deployContract(
    {
      owner: deployer.address, // the deployer address is the owner of the contract
      eth_contract_address: "0x49D36570D4E46F48E99674BD3FCC84644DDD6B96F7C741B1562B82F9E004DC7"
    },
    "YourContract"
  );
  
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);