import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    subscriptionTier: "free",
    tokenBalance: 1000000,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("study router", () => {
  it("should create a new study", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.study.create({
      title: "Test Study",
      description: "Test Description",
      researchObjective: "Test Objective",
      targetAudience: "Test Audience",
      researchQuestions: ["Question 1", "Question 2"],
      demographicCriteria: {
        ageRange: "25-35",
        gender: "All",
        location: "US",
        income: "$50k-$100k",
        occupation: "Software Engineer",
        interests: ["Technology", "AI"],
      },
      personaCount: 5,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list user studies", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.study.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should list public studies", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.study.listPublic();

    expect(Array.isArray(result)).toBe(true);
  });
});
