import { NextResponse } from "next/server";
import { getPrivyClient } from "~~/app/api/privy/_lib/privyClient";
import { computeReadyAddress } from "~~/app/api/privy/_lib/ready";

export const runtime = "nodejs";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    if (!userId)
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    const privy = getPrivyClient();
    const user: any = await privy.getUserById(userId);
    const accounts = user?.linkedAccounts || user?.linked_accounts || [];
    const starkWallets = accounts.filter(
      (acc: any) => acc?.type === "wallet" && acc?.chain_type === "starknet",
    );
    const wallets = await Promise.all(
      starkWallets.map(async (acc: any) => {
        try {
          const w: any = await privy.walletApi.getWallet({ id: acc.id });
          const publicKey: string | undefined = w.public_key || w.publicKey;
          const address =
            w.address ||
            (publicKey ? computeReadyAddress(publicKey) : undefined);
          return {
            id: w.id,
            address,
            chainType: w.chain_type || w.chainType,
            publicKey,
          };
        } catch {
          return {
            id: acc.id,
            address: acc.address,
            chainType: acc.chain_type || "starknet",
          };
        }
      }),
    );
    return NextResponse.json({ wallets }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user wallets:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user wallets" },
      { status: 500 },
    );
  }
};
