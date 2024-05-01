const { deployContract } = require("./deploy_contract");

const deployScript = async () => {

  await deployContract(
    { }, 
    "TestTypes"
  );

};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);