import {
    deployContract,
    executeDeployCalls,
    exportDeployments,
    deployer,
  } from "./deploy-contract";
  import { green } from "./helpers/colorize-log";
  
  const deployResetScript = async (): Promise<void> => {
    await deployContract({
      contract: "YourContract",
      constructorArgs: {
        owner: deployer.address,
      },
    });
  };
  
  deployResetScript()
    .then(async () => {
      await executeDeployCalls();
      exportDeployments(true); // Pass true to reset deployments
      console.log(green("All Setup Done (Reset)"));
    })
    .catch(console.error);