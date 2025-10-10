import { getPrivyClient } from "./privyClient";
import type { WalletApiRequestSignatureInput } from "@privy-io/server-auth";
import { generateAuthorizationSignature } from "@privy-io/server-auth/wallet-api";

// In-memory cache of user authorization keys to avoid regenerating per request.
// Keyed by userId; values include key and expiry.
const userSignerCache = new Map<
  string,
  { authorizationKey: string; expiresAt: number }
>();

export async function getUserAuthorizationKey({
  userJwt,
  userId,
}: {
  userJwt: string;
  userId?: string;
}): Promise<string> {
  const cacheKey = userId || "unknown";
  const cached = userSignerCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 5_000) {
    // 5s safety buffer
    return cached.authorizationKey;
  }
  const privy = getPrivyClient();
  const res = await privy.walletApi.generateUserSigner({
    userJwt: userJwt,
  });
  const authKey = res.authorizationKey;
  const expiresAt = new Date(res.expiresAt as unknown as string).getTime();
  userSignerCache.set(cacheKey, { authorizationKey: authKey, expiresAt });
  return authKey;
}

export function buildAuthorizationSignature({
  input,
  authorizationKey,
}: {
  input: WalletApiRequestSignatureInput;
  authorizationKey: string;
}): string {
  if (!authorizationKey) {
    throw new Error("Missing authorizationKey for Privy wallet-api signature");
  }
  const signature = generateAuthorizationSignature({
    input,
    authorizationPrivateKey: authorizationKey,
  });
  if (!signature) {
    throw new Error("Failed to generate Privy authorization signature");
  }
  return signature;
}
