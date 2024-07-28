import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
} from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  await deployContract({}, "Vars");
  await deployContract({}, "Structs");
  // await deployContract({}, "Tuples");
  await deployContract({}, "Complex");
  await deployContract({}, "ArraysSpans");
};

deployScript()
  .then(() => {
    exportDeployments();
    executeDeployCalls().then(() => {});
    console.log("All Setup Done");
  })
  .catch(console.error);
