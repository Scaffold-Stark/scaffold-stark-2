import { ChainWithAttributes } from "~~/utils/scaffold-stark";

export const fetchPriceFromCoingecko = async (
  targetNetwork: ChainWithAttributes,
): Promise<number> => {
  if (
    targetNetwork.nativeCurrency.symbol !== "ETH" &&
    targetNetwork.nativeCurrency.symbol !== "SEP" &&
    !targetNetwork.nativeCurrencyTokenAddress
  ) {
    return 0;
  }

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    );
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.error(
      `useNativeCurrencyPrice - Error fetching ${targetNetwork.nativeCurrency.symbol} price from Coingecko: `,
      error,
    );
    return 0;
  }
};
