import scaffoldConfig from "~~/scaffold.config";

export const fetchPriceFromCoingecko = async (
  symbol: string,
  retries = 3,
): Promise<number> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(`/api/price/${symbol}`);
      const data = await response.json();
      return symbol === "ETH" ? data.ethereum.usd : data.starknet.usd;
    } catch (error) {
      console.error(
        `Attempt ${
          attempt + 1
        } - Error fetching ${symbol} price from Coingecko: `,
        error,
      );
      attempt++;
      if (attempt === retries) {
        console.error(`Failed to fetch price after ${retries} attempts.`);
        return 0;
      }
    }
  }
  return 0;
};

class PriceService {
  private static instance: PriceService;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Map<
    any,
    {
      setNativeCurrencyPrice: (price: number) => void;
      setStrkCurrencyPrice: (price: number) => void;
    }
  > = new Map();
  private currentNativeCurrencyPrice: number = 0;
  private currentStrkCurrencyPrice: number = 0;
  private idCounter: number = 0;

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  public getNextId(): number {
    return ++this.idCounter;
  }

  public startPolling(
    ref: any,
    setNativeCurrencyPrice: (price: number) => void,
    setStrkCurrencyPrice: (price: number) => void,
  ) {
    if (this.listeners.has(ref)) return;
    this.listeners.set(ref, { setNativeCurrencyPrice, setStrkCurrencyPrice });

    if (this.intervalId) {
      setNativeCurrencyPrice(this.currentNativeCurrencyPrice);
      setStrkCurrencyPrice(this.currentStrkCurrencyPrice);
      return;
    }

    this.fetchPrices();
    this.intervalId = setInterval(() => {
      this.fetchPrices();
    }, scaffoldConfig.pollingInterval);
  }

  public stopPolling(ref: any) {
    if (!this.intervalId) return;
    if (!this.listeners.has(ref)) return;

    this.listeners.delete(ref);
    if (this.listeners.size === 0) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getCurrentNativeCurrencyPrice() {
    return this.currentNativeCurrencyPrice;
  }

  public getCurrentStrkCurrencyPrice() {
    return this.currentStrkCurrencyPrice;
  }

  private async fetchPrices() {
    try {
      const ethPrice = await fetchPriceFromCoingecko("ETH");
      const strkPrice = await fetchPriceFromCoingecko("STRK");
      if (ethPrice && strkPrice) {
        this.currentNativeCurrencyPrice = ethPrice;
        this.currentStrkCurrencyPrice = strkPrice;
      }
      this.listeners.forEach((listener) => {
        listener.setNativeCurrencyPrice(
          ethPrice || this.currentNativeCurrencyPrice,
        );
        listener.setStrkCurrencyPrice(
          strkPrice || this.currentStrkCurrencyPrice,
        );
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }
}

export const priceService = PriceService.getInstance();
