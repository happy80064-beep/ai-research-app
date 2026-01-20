import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Dimension Recommendations", () => {
  it("should recommend 5-8 relevant dimensions", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    } as TrpcContext);

    const result = await caller.study.recommendDimensions({
      targetAudience: "30-45岁，本科以上学历，一、二线城市工作或居住的互联网企业员工",
      researchGoal: "了解这些人对AI应用、健康智能硬件在效率提升、健康管理和情感陪伴上的需求和痛点",
      scenario: "both",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(5);
    expect(result.length).toBeLessThanOrEqual(8);

    // 验证每个维度都有 name 和 description
    result.forEach((dimension) => {
      expect(dimension).toHaveProperty("name");
      expect(dimension).toHaveProperty("description");
      expect(typeof dimension.name).toBe("string");
      expect(typeof dimension.description).toBe("string");
      expect(dimension.name.length).toBeGreaterThan(0);
      expect(dimension.name.length).toBeLessThan(20); // 8-12字
      expect(dimension.description.length).toBeGreaterThan(0);
      expect(dimension.description.length).toBeLessThan(50); // 20-30字
    });

    console.log("Recommended dimensions:");
    result.forEach((dimension, index) => {
      console.log(`${index + 1}. ${dimension.name}: ${dimension.description}`);
    });
  }, 30000); // 30秒超时，因为 LLM 调用可能需要时间
});
