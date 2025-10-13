import { NextResponse } from "next/server";
import { getPrivyClient } from "~~/app/api/privy/_lib/privyClient";

export const runtime = "nodejs";

export const POST = async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { walletId } = (body || {}) as any;
    if (!walletId)
      return NextResponse.json(
        { error: "walletId is required" },
        { status: 400 },
      );
    const privy = getPrivyClient();
    const wallet = await privy.walletApi.getWallet({ id: walletId });
    return NextResponse.json(
      {
        public_key: (wallet as any).public_key || (wallet as any).publicKey,
        wallet,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching Privy wallet:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Privy wallet" },
      { status: 500 },
    );
  }
};
