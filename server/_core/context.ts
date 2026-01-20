import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserByOpenId, upsertUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  language: "zh" | "en";
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Admin Bypass Logic
  if (!user && process.env.ADMIN_BYPASS === 'true') {
    const adminOpenId = "admin-bypass-user";
    try {
      user = await getUserByOpenId(adminOpenId) ?? null;
      if (!user) {
        await upsertUser({
          openId: adminOpenId,
          name: "Administrator",
          email: "admin@example.com",
          role: "admin",
          subscriptionTier: "max",
          tokenBalance: 99999999,
        });
        user = await getUserByOpenId(adminOpenId) ?? null;
      }
    } catch (e) {
      console.warn("[Auth] Failed to setup admin bypass user:", e);
    }
  }

  // Extract language preference from header or query
  const language = (opts.req.headers["accept-language"]?.startsWith("zh") || opts.req.query.lang === "zh") ? "zh" : "en";

  return {
    req: opts.req,
    res: opts.res,
    user,
    language,
  };
}
