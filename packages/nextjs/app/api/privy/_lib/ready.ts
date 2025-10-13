import {
  Account,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  hash,
  num,
} from "starknet";
import { getRpcProvider, setupPaymaster } from "./provider";
import { RawSigner } from "./rawSigner";
import {
  buildAuthorizationSignature,
  getUserAuthorizationKey,
} from "./authorization";
import { type WalletApiRequestSignatureInput } from "@privy-io/server-auth";

function buildReadyConstructor(publicKey: string) {
  const signerEnum = new CairoCustomEnum({ Starknet: { pubkey: publicKey } });
  const guardian = new CairoOption(CairoOptionVariant.None);
  return CallData.compile({ owner: signerEnum, guardian });
}

/**
 * Compute the Ready account address for a given public key.
 * Uses READY_CLASSHASH from environment for the class hash.
 */
export function computeReadyAddress(publicKey: string) {
  const calldata = buildReadyConstructor(publicKey);
  return hash.calculateContractAddressFromHash(
    publicKey,
    process.env.READY_CLASSHASH as string,
    calldata,
    0,
  );
}

/**
 * Check if a Ready account is already deployed on the network.
 * Returns true if deployed, false if not deployed.
 */
export async function isReadyAccountDeployed(
  address: string,
): Promise<boolean> {
  try {
    const provider = getRpcProvider();
    await provider.getClassHashAt(address);

    return true;
  } catch (error) {
    // If we get an error (like "Contract not found"), the account is not deployed
    return false;
  }
}

export async function buildReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
  paymasterRpc,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
  paymasterRpc?: any;
}): Promise<{ account: Account; address: string }> {
  const provider = getRpcProvider();
  const constructorCalldata = buildReadyConstructor(publicKey);
  const address = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    constructorCalldata,
    0,
  );
  const account = new Account({
    provider,
    address,
    signer: new (class extends RawSigner {
      async signRaw(messageHash: string): Promise<[string, string]> {
        const sig = await rawSign(walletId, messageHash, {
          userJwt,
          userId,
          origin,
        });
        const body = sig.slice(2);
        return [`0x${body.slice(0, 64)}`, `0x${body.slice(64)}`];
      }
    })(),
    ...(paymasterRpc ? { paymaster: paymasterRpc } : {}),
  });
  return { account, address };
}

export async function rawSign(
  walletId: string,
  messageHash: string,
  opts: { userJwt: string; userId?: string; origin?: string },
) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) throw new Error("Missing PRIVY_APP_ID");
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appSecret) throw new Error("Missing PRIVY_APP_SECRET");
  // Use the documented Wallet API path and keep it consistent for signing and fetch
  const url = `https://api.privy.io/v1/wallets/${walletId}/raw_sign`;
  const body = { params: { hash: messageHash } };

  // Generate or fetch a user-specific authorization key
  const authorizationKey = await getUserAuthorizationKey({
    userJwt: opts.userJwt,
    userId: opts.userId,
  });

  // Build signature for this request per Privy docs
  const sigInput: WalletApiRequestSignatureInput = {
    version: 1,
    method: "POST",
    url,
    body,
    headers: {
      "privy-app-id": appId,
    },
  };
  const signature = buildAuthorizationSignature({
    input: sigInput,
    authorizationKey,
  });

  const headers: Record<string, string> = {
    "privy-app-id": appId,
    "privy-authorization-signature": signature,
    "Content-Type": "application/json",
  };
  // App authentication for Wallet API
  headers["Authorization"] = `Basic ${Buffer.from(
    `${appId}:${appSecret}`,
  ).toString("base64")}`;

  if (opts.origin) headers["Origin"] = opts.origin;
  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }

  if (!resp.ok)
    throw new Error(data?.error || data?.message || `HTTP ${resp.status}`);
  const sig: string | undefined =
    data?.signature ||
    data?.result?.signature ||
    data?.data?.signature ||
    data?.result?.data?.signature ||
    (typeof data === "string" ? data : undefined);
  if (!sig || typeof sig !== "string")
    throw new Error("No signature returned from Privy");
  return sig.startsWith("0x") ? sig : `0x${sig}`;
}

export async function deployReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
}) {
  const provider = getRpcProvider();
  const { paymasterRpc, isSponsored, gasToken } = await setupPaymaster();

  // Initialize Paymaster RPC with proper options structure
  // Using paymasterRpc from setupPaymaster; gasToken defined in default mode

  const constructorCalldata = buildReadyConstructor(publicKey);
  const contractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    constructorCalldata,
    0,
  );

  // Paymaster deployment data requires hex-encoded calldata
  const constructorHex: string[] = (
    Array.isArray(constructorCalldata)
      ? (constructorCalldata as any[])
      : ([] as any[])
  ).map((v: any) => num.toHex(v));

  const deploymentData = {
    class_hash: classHash,
    salt: publicKey,
    calldata: constructorHex,
    address: contractAddress,
    version: 1,
  } as const;

  const { account } = await buildReadyAccount({
    walletId,
    publicKey,
    classHash,
    userJwt,
    userId,
    origin,
    paymasterRpc,
  });

  // Prepare paymaster fee details with correct structure
  if (!isSponsored && !gasToken) {
    throw new Error("Missing GAS_TOKEN for default paymaster mode");
  }
  const paymasterDetails = {
    feeMode: isSponsored
      ? { mode: "sponsored" as const }
      : { mode: "default" as const, gasToken: gasToken as string },
    deploymentData,
  };

  console.log(
    `Deploying account with paymaster in ${
      isSponsored ? "sponsored" : "default"
    } mode...`,
  );

  let maxFee = undefined;

  // Estimate fees if not sponsored, then apply a 1.5x safety margin to maxFee
  if (!isSponsored) {
    console.log("Estimating deployment fees...");
    const feeEstimation = await account.estimatePaymasterTransactionFee(
      [], // No calls, just deployment
      paymasterDetails,
    );
    const suggested = feeEstimation.suggested_max_fee_in_gas_token;
    console.log("Estimated deployment fee:", suggested.toString());
    const withMargin15 = (v: any) => {
      const bi = BigInt(v.toString());
      return (bi * 3n + 1n) / 2n; // ceil(1.5x)
    };
    maxFee = withMargin15(suggested);
  }

  // Execute deployment with paymaster (no additional calls)
  console.log("Executing account deployment...");
  const res = await account.executePaymasterTransaction(
    [], // No calls, just deployment
    paymasterDetails,
    maxFee,
  );

  console.log("Deployment transaction hash:", res.transaction_hash);

  return res;
}

export async function getReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
}): Promise<{ account: Account; address: string }> {
  return buildReadyAccount({
    walletId,
    publicKey,
    classHash,
    userJwt,
    userId,
    origin,
  });
}
