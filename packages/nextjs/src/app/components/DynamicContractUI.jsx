"use client";
import { useEffect, useState } from "react";
import result from "../../contracts/result.json";
import { connect, disconnect } from "starknetkit";
import { Contract } from "starknet";
import { Button, TextField } from "@radix-ui/themes";
import { useUser } from "@/contexts/userContenxt";
import { constants, RpcProvider } from "starknet";
import { Reload } from "@radix-ui/themes";

const provider = new RpcProvider({
  nodeUrl:
    "https://starknet-goerli.infura.io/v3/c45bd0ce3e584ba4a5e6a5928c9c0b0f",
  chainId: constants.StarknetChainId.SN_GOERLI,
});
const ContractPlayground = ({ contractDefinition }) => {
  const [inputValues, setInputValues] = useState({});
 
  const [contractInstance, setContractInstance] = useState(null);
  const userContext = useUser();

  const handleInputChange = (functionName, inputName, value) => {
    setInputValues((prevValues) => ({
      ...prevValues,
      [functionName]: {
        ...prevValues[functionName],
        [inputName]: value,
      },
    }));
    console.log("inputValues", inputValues);
  };

  useEffect(() => {
    if (userContext.account) {
      console.log("Contract address:", contractDefinition.address);
      let contractInstance = new Contract(
        contractDefinition.abi,
        contractDefinition.address,
        userContext.account
      );
      setContractInstance(contractInstance);
    }
  }, [userContext.isLoggedIn, contractDefinition]);

  const handleFunctionCall = async (functionName) => {
    if (!contractInstance) {
      console.error(
        "Contract instance is undefined. Please connect the wallet first."
      );
      return;
    }

    console.log("Calling function:", functionName);

    const functionAbi = contractDefinition.abi
      .filter((item) => item.type === "interface")
      .flatMap((interfaceItem) => interfaceItem.items)
      .find((item) => item.type === "function" && item.name === functionName);

    if (!functionAbi) {
      console.error(`Function ${functionName} not found in the contract ABI.`);
      return;
    }

    {
      /* Check that user is connected */
    }
    if (!userContext.account) {
      console.error("User is not connected. Please connect the wallet first.");
      return;
    }

    const functionInputs = inputValues[functionName] || {};

    if (functionAbi.state_mutability === "view") {
      try {
        const result = await contractInstance[functionName](
          ...Object.values(functionInputs)
        );
        console.log(`Result of ${functionName}:`, result);
      } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
      }
    } else {
      try {
        console.log("contractDefinition.address", contractDefinition.address);
        console.log("functionName", functionName);
        console.log("functionInputs", functionInputs);
        const tx = await userContext.account.execute(
          {
            contractAddress: contractDefinition.address,
            entrypoint: functionName,
            calldata: Object.values(functionInputs),
          },
          undefined,
          { maxFee: constants.DEFAULT_MAX_FEE }
        );
        await provider.waitForTransaction(tx.transaction_hash);
        console.log(
          `Transaction hash of ${functionName}:`,
          tx.transaction_hash
        );
      } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
      }
    }
  };

  return (
        <div className="card w-96 bg-base-100 shadow-xl text-justify-center ">

      <div className="flex row">
        <h2 className="text-2xl font-bold ba card-title">Contract Playground</h2>
      </div>

      <p>
        Connected to wallet:{" "}
        {userContext.address
          ? `${userContext.address.substring(0, 4)}...${userContext.address.substring(
              userContext.address.length - 4
            )}`
          : "Not connected"}
      </p>
      {contractDefinition.abi
        .filter((item) => item.type === "interface")
        .flatMap((interfaceItem) => interfaceItem.items)
        .filter((item) => item.type === "function")
        .map((functionItem) => (
          <div key={functionItem.name} style={{ display: 'flex',justifyContent: 'space-between', gap: '5px', flexDirection: 'column' }}>
<h3>{functionItem.name}</h3>
            {functionItem.inputs.map((input) => (
              <div key={input.name}>
                <h3 htmlFor={input.name} className="badge-ghost badge">{input.name}</h3>

                <TextField.Input
                  type="text"
                  id={input.name}
                  onChange={(e) =>
                    handleInputChange(
                      functionItem.name,
                      input.name,
                      e.target.value
                    )
                  }
                />
              </div>
            ))}
              <Button className= "btn-sm bg-primary flex space-x-4" onClick={() => handleFunctionCall(functionItem.name)}>{functionItem.inputs == 0 ? "Consult" : "Transact"}</Button>
          </div>
        ))}
    </div>
  );
};

export default function DynamicContractUI() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ContractPlayground contractDefinition={result} />
    </main>
  );
}
