const fs = require("fs");
const path = require("path");
const networks = require("./helpers/networks");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;

const {
  ContractAddress,
  getChecksumAddress,
  CallData,
  TransactionStatus,
  addAddressPadding,
} = require("starknet");
const { hash } = require("starknet");

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
    const tryDeclareAndDeploy = await deployer.declareAndDeploy({
      contract: compiledContractSierra,
      casm: compiledContractCasm,
      constructorCalldata,
    });
    await provider.waitForTransaction(
      tryDeclareAndDeploy.deploy.transaction_hash,
      {
        successStates: [TransactionStatus.ACCEPTED_ON_L2],
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

const deployScript = async () => {
  const {
    classHash: helloStarknetClassHash,
    abi: helloStarknetAbi,
    address: ContractAddress,
  } = await deployContract(null, "HelloStarknet"); // can pass another argument for the exported contract name
  await deployContract(
    {
      name: 1,
    },
    "Challenge0"
  ); // simple storage receives an argument in the constructor
  await deployContract(
    {
      voter_1: addAddressPadding(
        "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E"
      ),
      voter_2: addAddressPadding(
        "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E"
      ),
      voter_3: addAddressPadding(
        "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E"
      ),
    },
    "Vote"
  );
  await deployContract(
    {
      initial_owner: addAddressPadding(
        "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
      ),
    },
    "Ownable"
  ); // simple storage receives an argument in the constructor
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
