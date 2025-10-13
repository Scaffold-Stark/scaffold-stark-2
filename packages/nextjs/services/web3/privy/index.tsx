import {
  ConnectArgs,
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
  InjectedConnector,
  InjectedConnectorOptions,
  UserRejectedRequestError,
} from "@starknet-react/core";
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
  private currentWalletId?: string;

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
    return !!this.currentAddress;
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
        const created = await api<{ wallet: { id: string } }>(
          "/create-wallet",
          { method: "POST", body: JSON.stringify({ chainType: "starknet" }) },
        );
        this.currentWalletId = created.wallet.id;
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
    this.emit("connect", { account, chainId });

    this.persist();
    return { account, chainId };
  }

  async disconnect(): Promise<void> {
    this.currentAddress = undefined;
    this.currentWalletId = undefined;
    this.persist();
    this.emit("disconnect");
  }

  async request<T extends RpcMessage["type"]>(call: {
    type: T;
    params?: any;
  }): Promise<any> {
    if (!this.currentWalletId) throw new ConnectorNotConnectedError();

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
      if (address) this.currentAddress = address;
      this.persist();
    } catch {}
  }

  private persist() {
    if (!this.currentWalletId) {
      removeWallet();
      return;
    }
    storeWallet(this.currentWalletId, this.currentAddress);
  }
}
