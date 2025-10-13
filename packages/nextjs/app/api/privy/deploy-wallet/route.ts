import { NextResponse } from "next/server";
import {
  withAuth,
  WithAuthRequest,
} from "~~/app/api/privy/_lib/authMiddleware";
import { getStarknetWallet } from "~~/app/api/privy/_lib/wallet";
import {
  deployReadyAccount,
  isReadyAccountDeployed,
} from "~~/app/api/privy/_lib/ready";

export const runtime = "nodejs";

export const POST = withAuth(async (req: WithAuthRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { walletId } = (body || {}) as any;
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
        { error: "Authentication required to deploy wallet" },
        { status: 401 },
      );
    }

    const { address, publicKey } = await getStarknetWallet(walletId);
    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }
    // Check if the account is already deployed
    const isDeployed = await isReadyAccountDeployed(address);

    if (isDeployed) {
      // Account is already deployed, return success without deploying
      return NextResponse.json(
        {
          walletId,
          address,
          publicKey,
          transactionHash: null,
          message: "Account already deployed",
        },
        { status: 200 },
      );
    }

    // Account is not deployed, proceed with deployment
    const deployResult: any = await deployReadyAccount({
      walletId,
      publicKey,
      classHash,
      userJwt,
      userId: authUserId,
      origin,
    });
    return NextResponse.json(
      {
        walletId,
        address,
        publicKey,
        transactionHash: deployResult?.transaction_hash,
        message: "Account deployed successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deploying Ready account:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to deploy Ready account" },
      { status: 500 },
    );
  }
});
