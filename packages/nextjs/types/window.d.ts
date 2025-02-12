import {
  ChainInfoWithoutEndpoints,
  Keplr,
  Window as KeplrWindow,
} from "@keplr-wallet/types";

declare global {
  interface Window extends KeplrWindow {
    keplr?: Keplr & {
      ethereum: any;
      getChainInfoWithoutEndpoints: (
        chainId: string,
      ) => Promise<ChainInfoWithoutEndpoints>;
    };
    ethereum?: any;
  }
}
