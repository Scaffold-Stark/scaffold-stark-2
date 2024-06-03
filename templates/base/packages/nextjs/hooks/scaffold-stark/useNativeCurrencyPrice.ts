import { useEffect } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useInterval } from "usehooks-ts";
import scaffoldConfig from "~~/scaffold.config";
import { fetchPriceFromCoingecko } from "~~/utils/scaffold-stark";
import { useGlobalState } from "~~/services/store/store";

/**
 * Get the price of Native Currency based on Native Token/DAI trading pair from Uniswap SDK
 */
export const useNativeCurrencyPrice = () => {
  const { targetNetwork } = useTargetNetwork();
  const nativeCurrencyPrice = useGlobalState(
    (state) => state.nativeCurrencyPrice,
  );
  const setNativeCurrencyPrice = useGlobalState(
    (state) => state.setNativeCurrencyPrice,
  );
  // Get the price of ETH from Coingecko on mount
  useEffect(() => {
    (async () => {
      if (nativeCurrencyPrice == 0) {
        const price = await fetchPriceFromCoingecko(targetNetwork);
        setNativeCurrencyPrice(price);
      }
    })();
  }, [targetNetwork]);

  // Get the price of ETH from Coingecko at a given interval
  useInterval(async () => {
    const price = await fetchPriceFromCoingecko(targetNetwork);
    setNativeCurrencyPrice(price);
  }, scaffoldConfig.pollingInterval);

  //return nativeCurrencyPrice;
};
