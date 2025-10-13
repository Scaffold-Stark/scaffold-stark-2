import { NextResponse } from "next/server";
import {
  withAuth,
  WithAuthRequest,
} from "~~/app/api/privy/_lib/authMiddleware";
import { getStarknetWallet } from "~~/app/api/privy/_lib/wallet";
import { getReadyAccount } from "~~/app/api/privy/_lib/ready";
import { CallData } from "starknet";

export const runtime = "nodejs";

export const POST = withAuth(async (req: WithAuthRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { walletId, call, calls, wait } = (body || {}) as any;
    if (!walletId)
      return NextResponse.json(
        { error: "walletId is required" },
        { status: 400 },
      );
    const classHash = process.env.READY_CLASSHASH;
    if (!classHash)
      return NextResponse.json(
        { error: "READY_CLASSHASH not configured" },
        { status: 500 },
      );

    const auth = (req as any).auth;
    const origin =
      (req.headers.get("origin") as string | undefined) ||
      process.env.CLIENT_URL;
    const userJwt: string | undefined = auth?.token;
    const authUserId: string | undefined = auth?.userId;
    if (!userJwt || !authUserId) {
      return NextResponse.json(
        { error: "Authentication required to execute transactions" },
        { status: 401 },
      );
    }

    const { publicKey } = await getStarknetWallet(walletId);
    const { account, address } = await getReadyAccount({
      walletId,
      publicKey,
      classHash,
      userJwt,
      userId: authUserId,
      origin,
    });

    const normalizeOne = (c: any) => {
      if (!c || !c.contract_address || !c.entry_point)
        throw new Error("call must include contract_address and entry_point");
      let calldata: any = c.calldata ?? [];
      if (
        calldata &&
        !Array.isArray(calldata) &&
        typeof calldata === "object"
      ) {
        calldata = CallData.compile(calldata);
      }
      return {
        contractAddress: c.contract_address,
        entrypoint: c.entry_point,
        calldata: calldata || [],
      };
    };
    const execCalls = calls
      ? (calls as any[]).map(normalizeOne)
      : call
        ? normalizeOne(call)
        : null;
    if (!execCalls)
      return NextResponse.json(
        { error: "call or calls is required" },
        { status: 400 },
      );

    const result: any = await account.execute(execCalls as any);
    if (wait) {
      try {
        await account.waitForTransaction(result.transaction_hash);
      } catch {}
    }
    return NextResponse.json(
      { walletId, address, transactionHash: result?.transaction_hash, result },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error executing transaction:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute transaction" },
      { status: 500 },
    );
  }
});
