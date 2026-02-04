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

// 默认本地用户（无需 OAuth 配置）
const DEFAULT_LOCAL_USER = {
  openId: "local-user",
  name: "Local User",
  email: "user@localhost",
  role: "user" as const,
  subscriptionTier: "max" as const,
  tokenBalance: 99999999,
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

  // 如果没有 OAuth 用户，使用默认本地用户
  if (!user) {
    // 优先使用环境变量配置（如果有）
    const useLocalUser = process.env.USE_LOCAL_USER !== 'false'; // 默认启用
    const adminBypass = process.env.ADMIN_BYPASS === 'true';

    if (useLocalUser || adminBypass) {
      const userId = adminBypass ? "admin-bypass-user" : DEFAULT_LOCAL_USER.openId;
      const userName = adminBypass ? "Administrator" : DEFAULT_LOCAL_USER.name;
      const userRole = adminBypass ? "admin" : DEFAULT_LOCAL_USER.role;

      try {
        user = await getUserByOpenId(userId) ?? null;
        if (!user) {
          await upsertUser({
            openId: userId,
            name: userName,
            email: DEFAULT_LOCAL_USER.email,
            role: userRole,
            subscriptionTier: DEFAULT_LOCAL_USER.subscriptionTier,
            tokenBalance: DEFAULT_LOCAL_USER.tokenBalance,
          });
          user = await getUserByOpenId(userId) ?? null;
          console.log(`[Auth] Created local user: ${userName} (${userId})`);
        }
      } catch (e) {
        console.warn("[Auth] Failed to setup local user:", e);
      }
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
