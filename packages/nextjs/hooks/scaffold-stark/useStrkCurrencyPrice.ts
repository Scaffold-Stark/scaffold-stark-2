import { useEffect } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useInterval } from "usehooks-ts";
import scaffoldConfig from "~~/scaffold.config";
import { fetchStrkPriceFromCoingecko } from "~~/utils/scaffold-stark/fetchStrkPriceFromCoingecko";
import { useGlobalState } from "~~/services/store/store";

/**
 * Get the price of strk Currency based on strk Token/DAI trading pair from Uniswap SDK
 */
export const useStrkCurrencyPrice = () => {
  const { targetNetwork } = useTargetNetwork();
  const strkCurrencyPrice = useGlobalState((state) => state.strkCurrencyPrice);
  const setStrkCurrencyPrice = useGlobalState(
    (state) => state.setStrkCurrencyPrice,
  );
  // Get the price of STRK from Coingecko on mount
  useEffect(() => {
    (async () => {
      if (strkCurrencyPrice == 0) {
        const price = await fetchStrkPriceFromCoingecko("STRK");
        setStrkCurrencyPrice(price);
      }
    })();
  }, [targetNetwork]);

  // Get the price of STRK from Coingecko at a given interval
  useInterval(async () => {
    const price = await fetchStrkPriceFromCoingecko("STRK");
    setStrkCurrencyPrice(price);
  }, scaffoldConfig.pollingInterval);

  //return strkCurrencyPrice;
};
