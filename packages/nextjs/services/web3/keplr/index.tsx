import {
  ConnectArgs,
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
  InjectedConnector,
  InjectedConnectorOptions,
  UserRejectedRequestError,
} from "@starknet-react/core";
import {
  Permission,
  RequestFnCall,
  RpcMessage,
  RpcTypeToMessageMap,
} from "get-starknet-core";
import { getKeplrFromWindowSync } from "./getKeplrFromWindow";
import { Keplr } from "@keplr-wallet/types";
import { ConnectorData } from "@starknet-react/core/src/connectors/base";
import { WalletEventListener } from "@starknet-io/types-js";
import { keplrWalletIcon } from "./consts";
import { keplrWalletName } from "./consts";
import { keplrWalletId } from "./consts";
import { shortString } from "starknet";

export class KeplrConnector extends InjectedConnector {
  private __wallet?: Keplr;
  private __options: InjectedConnectorOptions;

  constructor() {
    const options: InjectedConnectorOptions = {
      id: keplrWalletId,
      name: keplrWalletName,
      icon: keplrWalletIcon,
    };
    super({
      options,
    });
    this.__options = options;
  }

  get id() {
    return this.__options.id;
  }

  get name() {
    return keplrWalletName;
  }

  get icon() {
    return keplrWalletIcon;
  }

  available() {
    return !!getKeplrFromWindowSync();
  }

  async chainId(): Promise<bigint> {
    this._ensureWallet();
    const locked = await this._isLocked();

    if (!this.__wallet || locked) {
      throw new ConnectorNotConnectedError();
    }

    try {
      return this._requestChainId();
    } catch {
      throw new ConnectorNotFoundError();
    }
  }

  async ready(): Promise<boolean> {
    this._ensureWallet();

    if (!this.__wallet) return false;

    const permissions: Permission[] = await this.request({
      type: "wallet_getPermissions",
    });

    return permissions?.includes(Permission.ACCOUNTS);
  }

  async connect(_args: ConnectArgs = {}): Promise<ConnectorData> {
    this._ensureWallet();

    if (!this.__wallet) {
      throw new ConnectorNotFoundError();
    }
    const { chainIdHint } = _args;
    let accounts: string[];
    try {
      const chainId = await this._requestChainId();
      if (chainIdHint && chainId !== chainIdHint) {
        await this.__wallet.starknet.request({
          type: "wallet_switchStarknetChain",
          params: [
            {
              chainId: `starknet:${shortString.decodeShortString(chainIdHint + "")}`,
            },
          ],
        });
      }
      accounts = await this.request({
        type: "wallet_requestAccounts",
      });
    } catch {
      throw new UserRejectedRequestError();
    }

    if (!accounts) {
      throw new UserRejectedRequestError();
    }

    (this.__wallet.starknet.on as WalletEventListener)(
      "accountsChanged",
      async (accounts) => {
        await this._onAccountsChanged(accounts);
      },
    );

    (this.__wallet.starknet.on as WalletEventListener)(
      "networkChanged",
      async (chainId, accounts) => {
        await this._onNetworkChanged(chainId, accounts);
      },
    );

    const [account] = accounts;

    const chainId = await this._requestChainId();
    this.emit("connect", { account, chainId });

    return {
      account,
      chainId,
    };
  }

  async disconnect(): Promise<void> {
    this._ensureWallet();

    if (!this.__wallet) {
      throw new ConnectorNotFoundError();
    }

    this.emit("disconnect");
  }

  async request<T extends RpcMessage["type"]>(
    call: RequestFnCall<T>,
  ): Promise<RpcTypeToMessageMap[T]["result"]> {
    this._ensureWallet();
    if (!this.__wallet) {
      throw new ConnectorNotConnectedError();
    }

    return this.__wallet.starknet.request(call);
  }

  private _ensureWallet() {
    this.__wallet = getKeplrFromWindowSync();
  }

  private async _isLocked() {
    const accounts = await this.request({
      type: "wallet_requestAccounts",
      params: { silent_mode: true },
    });

    return accounts.length === 0;
  }

  private async _requestChainId(): Promise<bigint> {
    const chainIdHex = await this.request({ type: "wallet_requestChainId" });
    return BigInt(chainIdHex);
  }

  private async _onAccountsChanged(accounts?: string[]): Promise<void> {
    if (!accounts) {
      this.emit("disconnect");
    } else {
      const [account] = accounts;

      if (account) {
        const chainId = await this._requestChainId();
        this.emit("change", { account, chainId });
      } else {
        this.emit("disconnect");
      }
    }
  }

  private _onNetworkChanged(chainIdHex?: string, accounts?: string[]): void {
    if (chainIdHex) {
      const chainId = BigInt(chainIdHex);
      const [account] = accounts || [];
      this.emit("change", { chainId, account });
    } else {
      this.emit("change", {});
    }
  }
}
