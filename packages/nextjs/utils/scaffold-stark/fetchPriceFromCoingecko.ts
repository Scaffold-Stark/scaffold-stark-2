import { ChainWithAttributes } from "~~/utils/scaffold-stark";

// Cache object to store the last fetched prices based on currency symbols
const priceCache: Record<string, number> = {};

export const fetchPriceFromCoingecko = async (
  targetNetwork: ChainWithAttributes,
  retryCount = 3,
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

  return updatePriceCache(symbol, retryCount);
};

const updatePriceCache = async (
  symbol: string,
  retries = 3,
): Promise<number> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`,
      );
      const data = await response.json();
      const price = data.ethereum.usd;
      priceCache[symbol] = price;
      console.log(`Price updated for ${symbol}: ${price}`);
      return price;
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} - Error fetching ${symbol} price from Coingecko: `,
        error,
      );
      attempt++;
      if (attempt === retries) {
        console.error(`Failed to fetch price after ${retries} attempts.`);
        return priceCache[symbol] || 0;
      }
    }
  }
  return priceCache[symbol] || 0;
};

setInterval(() => {
  Object.keys(priceCache).forEach((symbol) => {
    console.log(`Updating price for ${symbol}`);
    updatePriceCache(symbol);
  });
}, 300000);
