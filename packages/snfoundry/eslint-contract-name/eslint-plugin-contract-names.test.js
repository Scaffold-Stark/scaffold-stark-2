const {RuleTester} = require("eslint");
const contractNameRule = require("./eslint-plugin-contract-names");

const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 2015 }
});

ruleTester.run(
    "eslint-plugin-contract-names",
    contractNameRule,
    {
        valid: [{
            code: "deployContract({owner: deployer.address},'YourContract');"
        }],
        invalid: [{
            code: "deployContract({owner: deployer.address},'InvalidContractName');",
            errors: 1
        }]
    }
);

console.log("All tests passed!");