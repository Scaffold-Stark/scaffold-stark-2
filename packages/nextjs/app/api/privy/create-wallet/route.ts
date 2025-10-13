import { NextResponse } from "next/server";
import { getPrivyClient } from "~~/app/api/privy/_lib/privyClient";
import {
  withAuth,
  WithAuthRequest,
} from "~~/app/api/privy/_lib/authMiddleware";

export const runtime = "nodejs";

export const POST = withAuth(async (req: WithAuthRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const authUserId = (req as any).auth?.userId as string | undefined;
    const { chainType, ownerId } = (body || {}) as any;
    const privy = getPrivyClient();
    const payload: any = {
      chainType: chainType || "starknet",
      ...(ownerId || authUserId
        ? { owner: { userId: ownerId || authUserId } }
        : {}),
    };
    const result = await privy.walletApi.createWallet(payload);
    return NextResponse.json({ wallet: result }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating Privy wallet:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Privy wallet" },
      { status: 500 },
    );
  }
});
