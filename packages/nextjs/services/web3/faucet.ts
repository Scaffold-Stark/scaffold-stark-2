import { Address } from "@starknet-react/chains";

export async function mintEth(inputAddress: Address, eth: string) {
  try {
    const response = await fetch("http://0.0.0.0:5050/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: inputAddress,
        amount: parseFloat(eth) * 10 ** 18,
        unit: "WEI",
      }),
    });
    console.log(response);
    if (!response.ok) {
      throw new Error(`${response.statusText}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("There was a problem with the operation", error);
    return error;
  }
}
