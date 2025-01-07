import { declareContract } from "./deploy-contract";
import { green } from "./helpers/colorize-log";

/**
 * @returns {Promise<void>}
 */
const declareScript = async (): Promise<void> => {
  await declareContract();
};

declareScript()
  .then(() => {
    console.log(green("Declaration Complete"));
    process.exit(0);
  })
  .catch(console.error);
