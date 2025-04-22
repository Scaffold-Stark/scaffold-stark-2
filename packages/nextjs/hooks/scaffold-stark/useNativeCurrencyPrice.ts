import { useEffect, useRef } from "react";
import { useGlobalState } from "~~/services/store/store";
import { priceService } from "~~/services/web3/PriceService";

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
