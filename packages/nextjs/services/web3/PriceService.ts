import scaffoldConfig from "~~/scaffold.config";

export const fetchPrice = async (retries = 3): Promise<number> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await fetch(`/api/price`);
      const data = await response.json();
      return data.starknet.usd;
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} - Error fetching STRK price from Coingecko: `,
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
    }
  > = new Map();
  private currentNativeCurrencyPrice: number = 0;
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
  ) {
    if (this.listeners.has(ref)) return;
    this.listeners.set(ref, { setNativeCurrencyPrice });

    if (this.intervalId) {
      setNativeCurrencyPrice(this.currentNativeCurrencyPrice);
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

  private async fetchPrices() {
    try {
      const strkPrice = await fetchPrice();
      if (strkPrice) {
        this.currentNativeCurrencyPrice = strkPrice;
      }
      this.listeners.forEach((listener) => {
        listener.setNativeCurrencyPrice(
          strkPrice || this.currentNativeCurrencyPrice,
        );
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }
}

export const priceService = PriceService.getInstance();
