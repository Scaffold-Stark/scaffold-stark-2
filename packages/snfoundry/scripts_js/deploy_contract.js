const fs = require("fs");
const path = require("path");
const networks = require("./helpers/networks");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;
const { hash, TransactionStatus } = require("starknet");
const { CallData } = require("starknet-dev");

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

  const precomputedClassHash = hash.computeSierraContractClassHash(
    compiledContractSierra
  );
  const contractCalldata = new CallData(compiledContractSierra.abi);
  const constructorCalldata = constructorArgs
    ? contractCalldata.compile("constructor", constructorArgs)
    : [];
  console.log("Deploying Contract ", contractName);

  let totalFee = 0n;

  try {
    const { suggestedMaxFee: estimatedFeeDeclare } =
      await deployer.estimateDeclareFee(
        {
          contract: compiledContractSierra,
          casm: compiledContractCasm,
        },
        {}
      );
    totalFee = estimatedFeeDeclare * 2n;
  } catch (e) {
    const { suggestedMaxFee: estimatedFeeDeploy } =
      await deployer.estimateDeployFee({
        classHash: precomputedClassHash,
        constructorCalldata,
      });
    totalFee = estimatedFeeDeploy * 2n;
  }

  try {
    const tryDeclareAndDeploy = await deployer.declareAndDeploy(
      {
        contract: compiledContractSierra,
        casm: compiledContractCasm,
        constructorCalldata,
      },
      {
        maxFee: totalFee * 20n, // this optional max fee serves when error AccountValidation Failed or small fee on public networks , try 5n , 10n, 20n, 50n, 100n
      }
    );
    const debug = await provider.waitForTransaction(
      tryDeclareAndDeploy.deploy.transaction_hash,
      {
        successStates: [TransactionStatus.ACCEPTED_ON_L2],
        // retryInterval: 10000, // we can retry in 10 seconds
      }
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

module.exports = {
  deployContract, deployer
};
