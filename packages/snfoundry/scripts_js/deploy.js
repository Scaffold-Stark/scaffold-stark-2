const fs = require("fs");
const path = require("path");
const networks = require("./helpers/networks");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;

const networkName = argv.network;

const { provider, deployer } = networks[networkName];
const deployContract = async (
  constructorArgs,
  contractName,
  exportContractName
) => {
  const compiledContractCasm = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../contracts/target/dev/contracts_${contractName}.compiled_contract_class.json`
        )
      )
      .toString("ascii")
  );

  const compiledContractSierra = JSON.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../contracts/target/dev/contracts_${contractName}.contract_class.json`
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
        constructorCalldata: constructorArgs,
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
    contractAddress = "0x" + contractAddress.slice(2).padStart(64, "0");
  } catch (e) {
    console.log("Error", e);
  }
  console.log("Deployed contract ", contractName, " at: ", contractAddress);
  const chainIdPath = path.resolve(
    __dirname,
    `../deployments/${networkName}.json`
  );
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
  } = await deployContract([], "HelloStarknet"); // can pass another argument for the exported contract name
  await deployContract([1], "SimpleStorage"); // simple storage receives an argument in the constructor
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
