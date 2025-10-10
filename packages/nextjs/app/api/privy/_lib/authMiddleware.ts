import { NextRequest } from "next/server";
import { getPrivyClient } from "./privyClient";

export type WithAuthRequest = NextRequest & { auth?: any };

export function withAuth<
  H extends (req: WithAuthRequest, ctx: any) => Response | Promise<Response>,
>(handler: H) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const header = req.headers.get("authorization") || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (token) {
        try {
          const privy = getPrivyClient();
          const claims = await privy.verifyAuthToken(token);
          (req as WithAuthRequest).auth = { ...claims, token };
        } catch {
          // non-fatal: proceed without auth
        }
      }
    } catch {
      // swallow and continue
    }
    return handler(req as WithAuthRequest, ctx);
  };
}
