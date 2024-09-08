import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
} from "./deploy-contract";
import { green, red } from "./helpers/colorize-log";

const deployScript = async (): Promise<void> => {
  try {
    await deployContract(
      {
        owner: deployer.address,
      },
      "YourContract"
    );
  } catch (error) {
    console.log(red(error.message));
    if (error.message.includes("fetch failed")) {
      console.error(
        red(
          "Couldn't deploy. Did you forget to run yarn chain? Or you can change target network in scaffold.config.ts"
        )
      );
    }

    throw error;
  }
};

deployScript()
  .then(() => {
    executeDeployCalls().then(() => {
      exportDeployments();
    });
    console.log(green("All Setup Done"));
  })
  .catch((e) => console.error(red(e)));
