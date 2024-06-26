import fs from "fs";
import path from "path";
import prettier from "prettier";
import { Abi, CompiledSierra } from "starknet";

const TARGET_DIR = path.join(__dirname, "../../../nextjs/contracts");
const deploymentsDir = path.join(__dirname, "../../deployments");
const files = fs.readdirSync(deploymentsDir);

const generatedContractComment = `/**
 * This file is autogenerated by Scaffold-Stark.
 * You should not edit it manually or your changes might be overwritten.
 */`;

const getContractDataFromDeployments = (): Record<
  string,
  Record<string, { address: string; abi: Abi }>
> => {
  const allContractsData: Record<
    string,
    Record<string, { address: string; abi: Abi }>
  > = {};

  files.forEach((file) => {
    if (path.extname(file) === ".json" && file.endsWith("_latest.json")) {
      const filePath = path.join(deploymentsDir, file);
      const content: Record<
        string,
        {
          contract: string;
          address: string;
          classHash: string;
        }
      > = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const chainId = path.basename(file, "_latest.json");

      Object.entries(content).forEach(([contractName, contractData]) => {
        try {
          const abiFilePath = path.join(
            __dirname,
            `../../contracts/target/dev/contracts_${contractData.contract}.contract_class.json`
          );
          const abiContent: CompiledSierra = JSON.parse(
            fs.readFileSync(abiFilePath, "utf8")
          );

          allContractsData[chainId] = {
            ...allContractsData[chainId],
            [contractName]: {
              address: contractData.address,
              abi: abiContent.abi.filter((item) => item.type !== "l1_handler"),
            },
          };
        } catch (e) {}
      });
    }
  });

  return allContractsData;
};

const generateTsAbis = () => {
  const allContractsData = getContractDataFromDeployments();

  const fileContent = Object.entries(allContractsData).reduce(
    (content, [chainId, chainConfig]) => {
      // Use chainId directly as it is already a hex string
      return `${content}${chainId}:${JSON.stringify(chainConfig, null, 2)},`;
    },
    ""
  );

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
  }

  fs.writeFileSync(
    path.join(TARGET_DIR, "deployedContracts.ts"),
    prettier.format(
      `${generatedContractComment}\n\nconst deployedContracts = {${fileContent}} as const;\n\nexport default deployedContracts;`,
      {
        parser: "typescript",
      }
    )
  );

  console.log(
    `📝 Updated TypeScript contract definition file on ${TARGET_DIR}/deployedContracts.ts`
  );
};

generateTsAbis();
