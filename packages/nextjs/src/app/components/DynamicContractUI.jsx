
"use client";
import { useState } from "react";
import result from "../../contracts/result.json";
import { connect, disconnect } from 'starknetkit'
import { Contract } from 'starknet'
import { Button, TextField } from "@radix-ui/themes";


const ContractPlayground = ({ contractDefinition }) => {
  const [inputValues, setInputValues] = useState({});
  const [connection, setConnection] = useState(null);
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [contractInstance, setContractInstance] = useState(null)

  const handleInputChange = (functionName, inputName, value) => {
    setInputValues((prevValues) => ({
      ...prevValues,
      [functionName]: {
        ...prevValues[functionName],
        [inputName]: value,
      },
    }));
  };

  const connectWallet = async() => {
    const { wallet } = await connect();
   
    if(wallet && wallet.isConnected) {
      setConnection(wallet)
      setProvider(wallet.account)
      setAddress(wallet.selectedAddress)
      console.log('Contract address:', contractDefinition.address)
      let contractInstance = new Contract(contractDefinition.abi, contractDefinition.address, wallet.account)
      setContractInstance(contractInstance)
    }
   }

  const handleFunctionCall = (functionName) => {
    // Handle the function call based on the input values
    console.log(`Calling function ${functionName} with inputs:`, inputValues[functionName]);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Contract Playground</h2>
      <Button onClick={connectWallet} color="orange">Connect Wallet</Button>
      {contractDefinition.abi
        .filter((item) => item.type === "interface")
        .flatMap((interfaceItem) => interfaceItem.items)
        .filter((item) => item.type === "function")
        .map((functionItem) => (
          <div key={functionItem.name}>
            <h3>{functionItem.name}</h3>
            {functionItem.inputs.map((input) => (
              <div key={input.name}>
                <label htmlFor={input.name}>{input.name}:</label>
                
                <TextField.Input
                  type="text"
                  id={input.name}
                  onChange={(e) => handleInputChange(functionItem.name, input.name, e.target.value)}
                />
                
              </div>
            ))}
            <Button onClick={() => handleFunctionCall(functionItem.name)}>Call Function</Button>
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