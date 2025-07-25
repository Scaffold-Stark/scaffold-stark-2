import { useEffect, useRef } from "react";
import { useGlobalState } from "~~/services/store/store";
import { priceService } from "~~/services/web3/PriceService";

/**
 * Fetches the current price of the native currency (ETH/STRK) for the connected network.
 *
 * @returns {Object} An object containing:
 *   - price: The current price of the native currency
 *   - isLoading: Boolean indicating if the price is loading
 *   - error: Any error encountered
 *
 * @see https://scaffoldstark.com/docs/
 */
export const useNativeCurrencyPrice = () => {
  const setNativeCurrencyPrice = useGlobalState(
    (state) => state.setNativeCurrencyPrice,
  );
  const ref = useRef<string>(priceService.getNextId().toString());
  useEffect(() => {
    const id = ref.current;
    priceService.startPolling(id, setNativeCurrencyPrice);
    return () => {
      priceService.stopPolling(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
