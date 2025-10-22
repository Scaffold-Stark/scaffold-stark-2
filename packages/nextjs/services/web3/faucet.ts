import { Address } from "@starknet-react/chains";
import { getRpcUrl } from "./provider";

/**
 * Mint STRK tokens using devnet_mint RPC method
 * @param inputAddress - The address to mint tokens to
 * @param strk - The amount of STRK to mint (in STRK units)
 * @returns Promise with the mint result or error
 */
export async function mintStrk(inputAddress: Address, strk: string) {
  try {
    const rpcUrl = getRpcUrl("devnet");

    const response = await fetch(`${rpcUrl}/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "devnet_mint",
        params: {
          address: inputAddress,
          amount: parseFloat(strk) * 10 ** 18,
          unit: "FRI",
        },
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "RPC call failed");
    }

    return data.result;
  } catch (error) {
    console.error("There was a problem with the mint operation:", error);
    throw error;
  }
}
