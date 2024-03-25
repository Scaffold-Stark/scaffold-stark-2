const { json } = require("starknet");

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const networks = require("./helpers/networks");
dotenv.config();
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;

const networkName = argv.network;
console.log("Network Name", networkName);
const { provider, deployer } = networks[networkName];
const deployContract = async (contractName, exportContractName) => {
  const compiledContractCasm = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../target/dev/contracts_${contractName}.compiled_contract_class.json`
        )
      )
      .toString("ascii")
  );

  const compiledContractSierra = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../target/dev/contracts_${contractName}.contract_class.json`
        )
      )
      .toString("ascii")
  );

  let classHash;
  let existingClass;
  let contractAddress;
  console.log("Deploying Contract ", contractName);
  try {
    const tryDeclareAndDeploy = await deployer.declareAndDeploy(
      {
        contract: compiledContractSierra,
        casm: compiledContractCasm,
      },
      {
        maxFee: 999999999999990n,
      }
    );
    await provider.waitForTransaction(
      tryDeclareAndDeploy.deploy.transaction_hash
    );
    classHash = tryDeclareAndDeploy.declare.class_hash;
    existingClass = await provider.getClassByHash(classHash);
    contractAddress = tryDeclareAndDeploy.deploy.address;
  } catch (e) {
    console.log("Error", e);
  }
  console.log("Deployed contract ", contractName, " at: ", contractAddress);

  const chainId = await provider.getChainId();
  const chainIdPath = path.resolve(__dirname, `../deployments/${chainId}.json`);
  let deployments = {};
  if (fs.existsSync(chainIdPath)) {
    deployments = JSON.parse(fs.readFileSync(chainIdPath).toString());
  }

  let finalContractName = exportContractName || contractName;

  deployments[finalContractName] = {
    classHash: classHash,
    address: contractAddress,
    contract: contractName,
  };

  fs.writeFileSync(chainIdPath, JSON.stringify(deployments, null, 2));

  return {
    classHash: classHash,
    abi: JSON.stringify(existingClass.abi),
    address: contractAddress,
  };
};

const deployScript = async () => {
  const {
    classHash: helloStarknetClassHash,
    abi: helloStarknetAbi,
    address: ContractAddress,
  } = await deployContract("HelloStarknet"); // can pass another argument for the exported contract name
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
