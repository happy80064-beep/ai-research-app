import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Industry Analysis", () => {
  it("should generate industry analysis with sources", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    } as TrpcContext);

    const result = await caller.study.analyzeIndustry({
      targetAudience: "30-45岁，本科以上学历，一、二线城市工作或居住的互联网企业员工",
      researchGoal: "了解这些人对AI应用、健康智能硬件在效率提升、健康管理和情感陪伴上的需求和痛点",
    });

    expect(result).toBeDefined();
    expect(result.findings).toBeDefined();
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.findings.length).toBeGreaterThanOrEqual(3);
    expect(result.findings.length).toBeLessThanOrEqual(5);

    // 验证每个发现都有必需的字段
    result.findings.forEach((finding) => {
      expect(finding.text).toBeDefined();
      expect(typeof finding.text).toBe("string");
      expect(finding.text.length).toBeGreaterThan(0);

      expect(finding.source).toBeDefined();
      expect(typeof finding.source).toBe("string");
      expect(finding.source.length).toBeGreaterThan(0);

      expect(finding.year).toBeDefined();
      expect(typeof finding.year).toBe("string");
      expect(finding.year.length).toBeGreaterThan(0);
    });
  }, 30000); // 30秒超时，因为 LLM 调用可能需要时间
});
