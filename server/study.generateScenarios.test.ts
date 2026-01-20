import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Scenario Descriptions Generation", () => {
  it("should generate scenario descriptions for all three scenarios", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    } as TrpcContext);

    const result = await caller.study.generateScenarioDescriptions({
      targetAudience: "30-45岁，本科以上学历，一、二线城市工作或居住的互联网企业员工",
      researchGoal: "了解这些人对AI应用、健康智能硬件在效率提升、健康管理和情感陪伴上的需求和痛点",
    });

    expect(result).toBeDefined();
    expect(result.work).toBeDefined();
    expect(result.personal).toBeDefined();
    expect(result.both).toBeDefined();

    // 验证每个描述都是非空字符串
    expect(typeof result.work).toBe("string");
    expect(result.work.length).toBeGreaterThan(0);
    expect(result.work.length).toBeLessThan(50); // 应该是简洁的描述

    expect(typeof result.personal).toBe("string");
    expect(result.personal.length).toBeGreaterThan(0);
    expect(result.personal.length).toBeLessThan(50);

    expect(typeof result.both).toBe("string");
    expect(result.both.length).toBeGreaterThan(0);
    expect(result.both.length).toBeLessThan(50);

    console.log("Generated scenario descriptions:");
    console.log("- Work:", result.work);
    console.log("- Personal:", result.personal);
    console.log("- Both:", result.both);
  }, 30000); // 30秒超时，因为 LLM 调用可能需要时间
});
