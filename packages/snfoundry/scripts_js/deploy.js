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
const deployContract = async (contractName) => {
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
  } = await deployContract("HelloStarknet");
  console.log("HelloStarknet Class Hash", helloStarknetClassHash);
  console.log("HelloStarknet ABI", helloStarknetAbi);
  console.log("HelloStarknet Address", ContractAddress);
  const deployOutputPath = path.resolve(
    __dirname,
    "../broadcast/deployOutput.txt"
  );
  const deployOutput = `Class Hash ${helloStarknetClassHash}\nAddress ${ContractAddress}\nABI ${helloStarknetAbi}`;
  fs.writeFileSync(deployOutputPath, deployOutput);
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
