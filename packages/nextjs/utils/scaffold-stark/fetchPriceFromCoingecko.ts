import { ChainWithAttributes } from "~~/utils/scaffold-stark";

// Cache object to store the last fetched prices based on currency symbols
const priceCache: Record<string, number> = {};

export const fetchPriceFromCoingecko = async (
  targetNetwork: ChainWithAttributes,
  retryCount = 3, // Maximum retry attempts
): Promise<number> => {
  const { symbol } = targetNetwork.nativeCurrency;
  if (
    symbol !== "ETH" &&
    symbol !== "SEP" &&
    !targetNetwork.nativeCurrencyTokenAddress
  ) {
    return 0;
  }

  // Check cache first
  if (priceCache[symbol] !== undefined) {
    console.log(`Returning cached price for ${symbol}`);
    return priceCache[symbol];
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`,
    );
    const data = await response.json();
    const price = data.ethereum.usd;
    priceCache[symbol] = price; // Update cache with new price
    return price;
  } catch (error) {
    console.error(
      `useNativeCurrencyPrice - Error fetching ${symbol} price from Coingecko: `,
      error,
    );
    if (retryCount > 0) {
      console.log("Retrying after 1 second...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
      return fetchPriceFromCoingecko(targetNetwork, retryCount - 1);
    }
    return 0;
  }
};
