import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { TrpcContext } from "./_core/context";

describe("study.recommendResearchPlan", () => {
  it("should recommend research plan based on target audience, goal, scenario and dimensions", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test", name: "Test User", role: "user" },
    } as TrpcContext);

    const result = await caller.study.recommendResearchPlan({
      targetAudience: "30-45岁互联网企业员工",
      researchGoal: "了解AI应用和健康智能硬件需求",
      scenario: "both",
      dimensions: [
        "AI应用对工作效率的提升与痛点",
        "健康智能硬件的使用现状与满意度",
        "健康管理需求与AI/硬件的结合",
        "数据隐私与安全顾虑的感知",
      ],
    });

    // 验证返回结构
    expect(result).toHaveProperty("interviewCount");
    expect(result.interviewCount).toHaveProperty("min");
    expect(result.interviewCount).toHaveProperty("max");
    expect(result).toHaveProperty("duration");
    expect(result).toHaveProperty("questionType");
    expect(result).toHaveProperty("rationale");

    // 验证访谈数量合理性
    expect(result.interviewCount.min).toBeGreaterThan(0);
    expect(result.interviewCount.max).toBeGreaterThanOrEqual(result.interviewCount.min);
    expect(result.interviewCount.max).toBeLessThanOrEqual(30); // 最多不超过30次

    // 验证访谈时长合理性
    expect(result.duration).toBeGreaterThan(0);
    expect(result.duration).toBeLessThanOrEqual(120); // 最多不超过120分钟

    // 验证问题类型
    expect(["开放式", "半结构化", "结构化"]).toContain(result.questionType);

    // 验证推荐理由长度
    expect(result.rationale.length).toBeGreaterThan(20);
    expect(result.rationale.length).toBeLessThan(200);

    console.log("Recommended research plan:", JSON.stringify(result, null, 2));
  });
});
