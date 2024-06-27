// import { deployContract, deployer, exportDeployments } from "./deploy-contract";

// const deployScript = async (): Promise<void> => {
//   await deployContract(
//     {
//       owner: deployer.address, // the deployer address is the owner of the contract
//     },
//     "YourContract"
//   );
// };

// deployScript()
//   .then(() => {
//     exportDeployments();
//     console.log("All Setup Done");
//   })
//   .catch(console.error);
import { deployContract, deployer, provider, exportDeployments } from "./deploy-contract";
import { CallData, hash } from "starknet-dev";

const checkWalletDeployed = async (walletAddress: string): Promise<boolean> => {
  try {
    const accountInfo = await provider.getAccount(walletAddress);
    return accountInfo !== null;
  } catch (error) {
    console.error("Error checking wallet status:", error);
    return false;
  }
};

const deployScript = async (): Promise<void> => {
  const walletAddress = deployer.address;
  const isWalletDeployed = await checkWalletDeployed(walletAddress);

  if (!isWalletDeployed) {
    console.error("StarkNet wallet is not deployed. Please initialize and deploy your wallet before proceeding.");
    console.log("To deploy your wallet, follow these steps:");
    console.log("1. Initialize your StarkNet wallet.");
    console.log("2. Deploy the initialized wallet.");
    console.log("3. Retry the contract deployment.");
    return;
  }

  try {
    await deployContract(
      {
        owner: walletAddress, // the deployer address is the owner of the contract
      },
      "YourContract"
    );
    exportDeployments();
    console.log("Contract deployment successful. All setup done.");
  } catch (error) {
    console.error("Contract deployment failed:", error);
  }
};

deployScript().catch(console.error);


