const fs = require("fs");
const path = require("path");
const networks = require("./helpers/networks");
const argv = require("yargs/yargs")(process.argv.slice(2)).argv;

const { TransactionStatus } = require("starknet");
const { hash } = require("starknet");

const { CallData } = require("starknet-dev");
const deployContract = require("./deploy_contract");

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
    "SimpleStorage"
  );

  // await deployContract(
  //   {
  //     name: "MARQUIS",
  //     symbol: "MARQ",
  //     recipient: deployer.address,
  //     fixed_supply: 100,
  //   },
  //   "Challenge1"
  // );

  // await deployContract(
  //   {
  //     name: 1,
  //     symbol: 2,
  //     fixed_supply: 10,
  //     recipient:
  //       "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E",
  //   },
  //   "Challenge1"
  // );

  // await deployContract(
  //   {
  //     base_uri: CallData.byteArrayFromString("https://example.com/"),
  //     // recipient:
  //     //   "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E",
  //     // token_ids: 2,
  //     // values: 100,
  //   },
  //   "Challenge2"
  // );

  // await deployContract(
  //   {
  //     public_key:
  //       "0x6e4fd4f9d6442e10cf8e20a799be3533be3756c5ea4d13e16a297d7d2717039",
  //   },
  //   "Challenge3"
  // );

  // await deployContract(
  //   {
  //     voter_1:
  //       "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E",
  //     voter_2:
  //       "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E",
  //     voter_3:
  //       "0x06072Bb27d275a0bC1deBf1753649b8721CF845B681A48443Ac46baF45769f8E",
  //   },
  //   "Vote"
  // );
  // await deployContract(
  //   {
  //     initial_owner:
  //       "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
  //   },
  //   "Ownable"
  // ); // simple storage receives an argument in the constructor
};

deployScript()
  .then(() => {
    console.log("All Setup Done");
  })
  .catch(console.error);
