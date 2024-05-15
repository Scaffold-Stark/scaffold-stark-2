import { Address } from "@starknet-react/chains";

export async function mintEth(inputAddress: Address, eth: string) {
  await fetch("http://0.0.0.0:5050/mint", {
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
}
