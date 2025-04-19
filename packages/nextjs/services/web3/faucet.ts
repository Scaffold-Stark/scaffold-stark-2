import { Address } from "@starknet-react/chains";

export async function mintStrk(inputAddress: Address, strk: string) {
  try {
    const response = await fetch("http://127.0.0.1:5050/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: inputAddress,
        amount: parseFloat(strk) * 10 ** 18,
        unit: "FRI",
      }),
    });
    if (!response.ok) {
      throw new Error(`${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem with the operation", error);
    return error;
  }
}
