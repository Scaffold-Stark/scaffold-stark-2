"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useAccount, useConnect } from "@starknet-react/core";
import { Contract, CallData, shortString } from "starknet";
import { useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { notification } from "~~/utils/scaffold-stark";

type SignerOption = "" | "add" | "remove";
type TxType = "new" | "pending" | "executed";

interface Transaction {
  id: string;
  to: string;
  selector: string;
  confirmations: number;
  executed: boolean;
  salt: string;
  calldata: string[];
}

const MultisigPage = () => {
  const { account } = useAccount();
  const { connect, connectors } = useConnect();
  const contractName = "CustomMultisigWallet";
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo(contractName);
  
  const [selectedOption, setSelectedOption] = useState<SignerOption>("");
  const [address, setAddress] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const [signers, setSigners] = useState<string[]>([]);
  const [quorum, setQuorum] = useState<number>(0);
  const [loadingSigners, setLoadingSigners] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTxType, setSelectedTxType] = useState<TxType>("pending");
  const [selectedTxId, setSelectedTxId] = useState<string>("");

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SignerOption;
    setSelectedOption(value);
  };

  const handleSignerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
  };

  const handleSignatureChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSignature(e.target.value);
  };

  const handleTxTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTxType(e.target.value as TxType);
    loadTransactions(e.target.value as TxType);
  };

  const handleTxSelect = (id: string) => {
    setSelectedTxId(id === selectedTxId ? "" : id);
  };

  const getContract = () => {
    if (!account || !deployedContractData) throw new Error("No account connected or contract not loaded");
    
    return new Contract(
      deployedContractData.abi,
      deployedContractData.address,
      account
    );
  };

  const loadSigners = async () => {
    if (!account || !deployedContractData) return;

    setLoadingSigners(true);
    try {
      const contract = getContract();
      
      const quorumResult = await contract.get_quorum();
      setQuorum(Number(quorumResult));
      
      const signersResult = await contract.get_signers();
      
      const formattedSigners = signersResult.map((signer: any) => signer.toString());
      setSigners(formattedSigners);
    } catch (err: any) {
      console.error("Error loading signers:", err);
      notification.error("Error loading signers: " + err.message);
    } finally {
      setLoadingSigners(false);
    }
  };

  const loadTransactions = async (type: TxType = "pending") => {
    if (!account || !deployedContractData) return;

    setLoadingTransactions(true);
    try {
      const mockTransactions: Transaction[] = [
        {
          id: "0x123456789",
          to: deployedContractData.address,
          selector: "0x5c587631625b8e19617cebe376ee17e070ca15615606aaad48d9afae7823ad",
          confirmations: 1,
          executed: false,
          salt: "123456789",
          calldata: ["1", address]
        }
      ];
      
      if (type === "pending") {
        setTransactions(mockTransactions.filter(tx => !tx.executed));
      } else if (type === "executed") {
        setTransactions(mockTransactions.filter(tx => tx.executed));
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error("Error loading transactions:", err);
      notification.error("Error loading transactions: " + err.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (account && deployedContractData) {
      loadSigners();
      loadTransactions();
    }
  }, [account, deployedContractData]);

  const createTransaction = async () => {
    if (!account || !deployedContractData) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!address) {
      notification.error("Please enter a valid address");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      const contractAddress = deployedContractData.address;
      const salt = Date.now().toString();
      
      if (selectedOption === "add") {
        const newQuorum = quorum;
        
        const selector = shortString.encodeShortString("add_signer");
        
        const calldata = CallData.compile({
          new_quorum: newQuorum,
          signer_to_add: address
        });
        
        const txIdResponse = await contract.hash_transaction(
          contractAddress,
          selector,
          calldata,
          salt
        );
        
        await contract.submit_transaction(
          contractAddress,
          selector,
          calldata,
          salt
        );
        
        const txIdString = txIdResponse.toString();
        notification.success("Transaction submitted successfully");
        
      } else if (selectedOption === "remove") {
        const newQuorum = Math.min(quorum, signers.length - 1);
        
        const selector = shortString.encodeShortString("remove_signers");
        
        const calldata = CallData.compile({
          new_quorum: newQuorum,
          signers_to_remove: [address]
        });
        
        const txIdResponse = await contract.hash_transaction(
          contractAddress,
          selector,
          calldata,
          salt
        );
        
        await contract.submit_transaction(
          contractAddress,
          selector,
          calldata,
          salt
        );
        
        const txIdString = txIdResponse.toString();
        notification.success("Transaction submitted successfully");
      }
      
      await loadSigners();
      await loadTransactions();
      
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      notification.error(err.message || "Error creating transaction");
    } finally {
      setLoading(false);
    }
  };

  const confirmTransaction = async (txId: string) => {
    if (!account || !deployedContractData) {
      notification.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      
      await contract.confirm_transaction(txId);
      
      notification.success("Transaction confirmed successfully");
      
      await loadTransactions(selectedTxType);
    } catch (err: any) {
      console.error("Error confirming transaction:", err);
      notification.error(err.message || "Error confirming transaction");
    } finally {
      setLoading(false);
    }
  };

  const revokeConfirmation = async (txId: string) => {
    if (!account || !deployedContractData) {
      notification.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      
      await contract.revoke_confirmation(txId);
      
      notification.success("Confirmation revoked successfully");
      
      await loadTransactions(selectedTxType);
    } catch (err: any) {
      console.error("Error revoking confirmation:", err);
      notification.error(err.message || "Error revoking confirmation");
    } finally {
      setLoading(false);
    }
  };

  const executeTransaction = async (tx: Transaction) => {
    if (!account || !deployedContractData) {
      notification.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const contract = getContract();
      
      await contract.execute_transaction(
        tx.to,
        tx.selector,
        tx.calldata,
        tx.salt
      );
      
      notification.success("Transaction executed successfully");
      
      await loadTransactions(selectedTxType);
      await loadSigners();
    } catch (err: any) {
      console.error("Error executing transaction:", err);
      notification.error(err.message || "Error executing transaction");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <section className="max-w-screen-2xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Multisig Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Current Signers</h3>
            <div className="text-sm mb-4">
              Required Signatures: {loadingSigners ? "Loading..." : `${quorum}/${signers.length}`}
            </div>
            
            {loadingSigners ? (
              <div className="text-gray-400">Loading signers...</div>
            ) : signers.length === 0 ? (
              <div className="text-gray-400">No signers found</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {signers.map((address, index) => (
                  <div key={index} className="text-sm p-3 rounded bg-gray-700 flex justify-between items-center">
                    <span className="break-all">{address}</span>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={loadSigners}
              disabled={loadingSigners || !account || !deployedContractData}
              className="mt-4 w-full rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loadingSigners ? "Loading..." : "Refresh"}
            </button>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Create Transaction</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Select method</label>
                <select
                  value={selectedOption}
                  onChange={handleSelectChange}
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select an option</option>
                  <option value="add">Add Signer</option>
                  <option value="remove">Remove Signer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Signer address</label>
                <input
                  type="text"
                  value={address}
                  onChange={handleSignerChange}
                  placeholder="Signer address"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button 
                onClick={createTransaction}
                disabled={loading || !selectedOption || !address || !account || !deployedContractData}
                className="w-full rounded-md py-2 font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Create TX"}
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Transactions</h3>
              
              <select
                value={selectedTxType}
                onChange={handleTxTypeChange}
                className="px-3 py-1 rounded-md bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="executed">Executed</option>
              </select>
            </div>
            
            {loadingTransactions ? (
              <div className="text-gray-400 my-4">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-gray-400 my-4">No transactions found</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className={`p-3 rounded ${selectedTxId === tx.id ? 'bg-blue-900' : 'bg-gray-700'} cursor-pointer hover:bg-gray-600`}
                    onClick={() => handleTxSelect(tx.id)}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">ID: {formatAddress(tx.id)}</span>
                      <span className={`text-xs px-2 py-1 rounded ${tx.executed ? 'bg-green-800' : 'bg-yellow-800'}`}>
                        {tx.executed ? 'Executed' : `${tx.confirmations}/${quorum} confirmations`}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-300">
                      To: {formatAddress(tx.to)}
                    </div>
                    <div className="text-xs text-gray-300">
                      Function: {tx.selector}
                    </div>
                    
                    {selectedTxId === tx.id && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmTransaction(tx.id);
                          }}
                          disabled={tx.executed || loading}
                          className="flex-1 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          Confirm
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            revokeConfirmation(tx.id);
                          }}
                          disabled={tx.executed || loading}
                          className="flex-1 py-1 text-xs rounded bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          Revoke
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            executeTransaction(tx);
                          }}
                          disabled={tx.executed || tx.confirmations < quorum || loading}
                          className="flex-1 py-1 text-xs rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          Execute
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => loadTransactions(selectedTxType)}
              disabled={loadingTransactions || !account || !deployedContractData}
              className="mt-4 w-full rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loadingTransactions ? "Loading..." : "Refresh"}
            </button>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Confirm by Transaction ID</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={signature}
                  onChange={handleSignatureChange}
                  placeholder="Enter transaction ID"
                  className="block w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => confirmTransaction(signature)}
                  disabled={loading || !signature || !account || !deployedContractData}
                  className="flex-1 rounded-md py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
                
                <button 
                  onClick={() => revokeConfirmation(signature)}
                  disabled={loading || !signature || !account || !deployedContractData}
                  className="flex-1 rounded-md py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Revoke"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultisigPage;