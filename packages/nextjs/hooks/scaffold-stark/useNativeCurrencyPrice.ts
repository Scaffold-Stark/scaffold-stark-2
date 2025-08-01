import { useEffect, useRef } from "react";
import { useGlobalState } from "~~/services/store/store";
import { priceService } from "~~/services/web3/PriceService";

/**
 * Manages native currency price polling and updates global state.
 * This hook starts polling for the native currency price and updates the global state
 * with price changes. It automatically cleans up the polling when the component unmounts.
 *
 * @returns {void} This hook doesn't return any value
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
