import {
  ConnectArgs,
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
  InjectedConnector,
  InjectedConnectorOptions,
  UserRejectedRequestError,
} from "@starknet-react/core";
import { WalletAccount } from "starknet";
import type { RpcMessage } from "get-starknet-core";
import scaffoldConfig from "~~/scaffold.config";
import {
  getWallet,
  storeWallet,
  removeWallet,
  isAuthenticated,
  getToken,
} from "./storage";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`/api/privy${path}`, { ...init, headers });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data as T;
}

export class PrivyConnector extends InjectedConnector {
  private __options: InjectedConnectorOptions;
  private currentAddress?: string;
  private currentPublicKey?: string;
  private currentWalletId?: string;
  private _connected: boolean = false;
  private _account?: WalletAccount;

  constructor() {
    const options: InjectedConnectorOptions = {
      id: "privy",
      name: "Privy Wallet",
      icon: "data:image/svg+xml;base64,", // optional placeholder
    };
    super({ options });
    this.__options = options;
    const walletData = getWallet();
    this.currentWalletId = walletData.walletId || undefined;
    this.currentAddress = walletData.walletAddress || undefined;
    this.currentPublicKey = walletData.publicKey || undefined;
    this._connected = !!(
      this.currentWalletId &&
      this.currentAddress &&
      this.currentPublicKey &&
      isAuthenticated()
    );
  }

  get id() {
    return this.__options.id;
  }

  get name() {
    return this.__options.name || "Privy Wallet";
  }

  get icon() {
    return this.__options.icon || "";
  }

  available() {
    // Privy is available when feature-flagged or always enabled
    return true;
  }

  async ready(): Promise<boolean> {
    return this._connected && !!this.currentAddress;
  }

  async account(
    provider?: any,
    paymasterProvider?: any,
  ): Promise<WalletAccount> {
    if (!this._connected || !this.currentAddress) {
      throw new ConnectorNotConnectedError();
    }

    if (!this._account) {
      // For Privy, we need to create a custom account implementation
      // Since we don't have a traditional wallet object, we'll create a minimal implementation
      this._account = {
        address: this.currentAddress,
        chainId: await this.chainId(),
        // Implement the required methods for WalletAccount
        execute: async (calls: any) => {
          const response = await this.request({
            type: "wallet_addInvokeTransaction",
            params: { calls, wait: false },
          });
          return response;
        },
        // Add getChainId method that useTransactor expects
        getChainId: async () => {
          return await this.chainId();
        },
        // Add other required methods as needed
      } as any;
    }

    return this._account!;
  }

  async chainId(): Promise<bigint> {
    const chainHex = scaffoldConfig.targetNetworks[0].id as unknown as string;
    return BigInt(chainHex);
  }

  async connect(
    _args: ConnectArgs = {},
  ): Promise<{ account: string; chainId: bigint }> {
    const token = getToken();
    if (!token) {
      throw new UserRejectedRequestError("Please login with Privy first");
    }

    // Attempt to reuse stored wallet
    if (!this.currentWalletId) {
      // Create a new wallet via API
      try {
        const created = await api<{
          wallet: { id: string; address?: string; public_key?: string };
        }>("/create-wallet", {
          method: "POST",
          body: JSON.stringify({ chainType: "starknet" }),
        });
        this.currentWalletId = created.wallet.id;

        // If we got address and public key from creation, store them
        if (created.wallet.address) {
          this.currentAddress = created.wallet.address;
        }
        if (created.wallet.public_key) {
          this.currentPublicKey = created.wallet.public_key;
        }
        this.persist();
      } catch {
        throw new UserRejectedRequestError();
      }
    }

    // Try to resolve address (may require deployment)
    await this.resolveAddress();
    if (!this.currentAddress) {
      // Try to auto-deploy if token present
      try {
        await api("/deploy-wallet", {
          method: "POST",
          body: JSON.stringify({ walletId: this.currentWalletId }),
        });
      } catch {
        // If cannot deploy automatically, surface a rejection
        throw new UserRejectedRequestError();
      }
      await this.resolveAddress();
    }

    const account = this.currentAddress;
    if (!account) throw new ConnectorNotFoundError();

    const chainId = await this.chainId();
    this._connected = true;
    this.emit("connect", { account, chainId });

    this.persist();
    return { account, chainId };
  }

  async disconnect(): Promise<void> {
    this.currentAddress = undefined;
    this.currentWalletId = undefined;
    this._connected = false;
    this._account = undefined;
    this.persist();
    this.emit("disconnect");
  }

  async request<T extends RpcMessage["type"]>(call: {
    type: T;
    params?: any;
  }): Promise<any> {
    if (!this._connected || !this.currentWalletId)
      throw new ConnectorNotConnectedError();

    switch (call.type) {
      case "wallet_requestAccounts": {
        if (!this.currentAddress) await this.resolveAddress();
        const account = this.currentAddress;
        if (!account) throw new ConnectorNotConnectedError();
        return [account];
      }
      case "wallet_requestChainId": {
        const chainHex = scaffoldConfig.targetNetworks[0]
          .id as unknown as string;
        return chainHex;
      }
      case "wallet_addInvokeTransaction": {
        const { calls, wait } = call.params || {};
        const resp = await api<{ transactionHash: string }>("/execute", {
          method: "POST",
          body: JSON.stringify({ walletId: this.currentWalletId, calls, wait }),
        });
        return resp;
      }
      default: {
        throw new Error(`Unsupported request type: ${call.type}`);
      }
    }
  }

  private async resolveAddress() {
    if (!this.currentWalletId) return;
    try {
      const data = await api<{ wallet: any; public_key?: string }>(
        "/public-key",
        {
          method: "POST",
          body: JSON.stringify({ walletId: this.currentWalletId }),
        },
      );
      const wallet: any = data.wallet;
      const address: string | undefined = wallet?.address;
      const publicKey: string | undefined =
        data.public_key || wallet?.public_key || wallet?.publicKey;

      if (address) this.currentAddress = address;
      if (publicKey) this.currentPublicKey = publicKey;

      this.persist();
    } catch {}
  }

  private persist() {
    if (!this.currentWalletId) {
      removeWallet();
      return;
    }
    storeWallet(
      this.currentWalletId,
      this.currentAddress,
      this.currentPublicKey,
    );
  }
}
