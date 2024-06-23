import { deployContract, deployer, exportDeployments } from "./deploy-contract";

const deployScript = async (): Promise<void> => {
  //  await deployContract(
  //    {
  //      owner: deployer.address, // the deployer address is the owner of the contract
  //    },
  //    "YourContract"
  //  );
  //await deployContract(null, "PragmaPrice");
  //await deployContract(null, "StarkPrice");
  await deployContract(
    {
      owner:
        "0x034114DA641525543F43BBe8f931EA48158a90bd5c8af869d3eecf8364e04965",
      end_date: 1719147600000,
      vote_date_limit: 1719147600000,
      reference_token_price: 652086109850,
      pragmaAddress:
        "0x36031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a",
    },
    "BitcoinPrice"
  );
  await deployContract(
    {
      owner:
        "0x034114DA641525543F43BBe8f931EA48158a90bd5c8af869d3eecf8364e04965",
      end_date: 1719147600000,
      vote_date_limit: 1719147600000,
      reference_token_price: 349956000000,
      pragmaAddress:
        "0x36031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a",
    },
    "EtherPrice"
  );
  await deployContract(
    {
      owner:
        "0x034114DA641525543F43BBe8f931EA48158a90bd5c8af869d3eecf8364e04965",
      end_date: 1719147600000,
      vote_date_limit: 1719147600000,
      reference_token_price: 96051271,
      pragmaAddress:
        "0x36031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a",
    },
    "StarkPrice"
  );
  //await deployContract(null, "EtherPrice");
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
