export const STORAGE_KEYS = {
  walletId: "starknet_wallet_id",
  walletAddress: "starknet_wallet_address",
  publicKey: "starknet_public_key",
  deployedWalletId: "starknet_deployed_wallet_id",
  userId: "privy_user_id",
  token: "privy:token",
} as const;

// Helper functions for localStorage operations
const getItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setItem = (key: string, value: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const removeItem = (key: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const storeWallet = (
  walletId: string,
  address?: string,
  publicKey?: string,
): boolean => {
  try {
    setItem(STORAGE_KEYS.walletId, walletId);
    if (address) setItem(STORAGE_KEYS.walletAddress, address);
    if (publicKey) setItem(STORAGE_KEYS.publicKey, publicKey);
    return true;
  } catch {
    return false;
  }
};

export const getWallet = () => ({
  walletId: getItem(STORAGE_KEYS.walletId),
  walletAddress: getItem(STORAGE_KEYS.walletAddress),
  publicKey: getItem(STORAGE_KEYS.publicKey),
  deployedWalletId: getItem(STORAGE_KEYS.deployedWalletId),
  userId: getItem(STORAGE_KEYS.userId),
});

export const removeWallet = (): boolean => {
  try {
    removeItem(STORAGE_KEYS.walletId);
    removeItem(STORAGE_KEYS.walletAddress);
    removeItem(STORAGE_KEYS.publicKey);
    removeItem(STORAGE_KEYS.deployedWalletId);
    return true;
  } catch {
    return false;
  }
};

export const storeUser = (userId: string): boolean => {
  return setItem(STORAGE_KEYS.userId, userId);
};

export const clearAll = (): boolean => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      removeItem(key);
    });
    return true;
  } catch {
    return false;
  }
};

export const getToken = (): string | null => {
  return getItem(STORAGE_KEYS.token);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasWallet = (): boolean => {
  const wallet = getWallet();
  return !!(wallet.walletId && wallet.walletAddress);
};
