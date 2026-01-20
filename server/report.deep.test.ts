import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";
import * as db from "./db";

describe("Deep Report Generation", () => {
  let testUserId: number;
  let testStudyId: number;
  let testPersonaId: number;
  let testInterviewId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-deep-report-user",
      name: "Test Deep Report User",
      email: "deepreport@test.com",
      role: "user",
      tokensAvailable: 1000000,
    });
    const user = await db.getUserByOpenId("test-deep-report-user");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create test study
    const study = await db.createStudy({
      userId: testUserId,
      title: "Deep Report Test Study",
      description: "Testing deep report generation",
      researchObjective: "Understand user needs for AI tools",
      targetAudience: "Tech professionals",
      researchQuestions: ["What are the main pain points?", "What features do users want?"],
      demographicCriteria: {
        ageRange: "25-45",
        occupation: "Software Engineer",
      },
      personaCount: 2,
      status: "interviewing",
    });
    testStudyId = study.id;

    // Create test persona
    const persona = await db.createPersona({
      studyId: testStudyId,
      name: "Alex Chen",
      age: 32,
      occupation: "Senior Software Engineer",
      background: "10 years experience in tech",
      goals: ["Improve productivity", "Learn new tools"],
      painPoints: ["Too many tools", "Integration issues"],
      preferences: ["Simple UI", "Good documentation"],
      personality: "Analytical and detail-oriented",
      communicationStyle: "Direct and concise",
    });
    testPersonaId = persona.id;

    // Create test interview
    const interview = await db.createInterview({
      studyId: testStudyId,
      personaId: testPersonaId,
      status: "completed",
      keyInsights: [
        "Users want AI tools that integrate seamlessly",
        "Privacy is a major concern",
        "Pricing must be transparent",
      ],
    });
    testInterviewId = interview.id;

    // Add interview messages
    await db.createInterviewMessage({
      interviewId: testInterviewId,
      role: "interviewer",
      content: "What are your biggest challenges with current AI tools?",
    });

    await db.createInterviewMessage({
      interviewId: testInterviewId,
      role: "persona",
      content: "The main challenge is integration. I use multiple tools and they don't talk to each other.",
    });
  });

  afterAll(async () => {
    // Cleanup: delete in reverse order of creation
    try {
      const dbConn = await db.getDb();
      if (!dbConn) return;

      // Delete interview (cascade will handle messages)
      if (testInterviewId) {
        await dbConn.execute(`DELETE FROM interview WHERE id = ${testInterviewId}`);
      }
      if (testPersonaId) {
        await dbConn.execute(`DELETE FROM persona WHERE id = ${testPersonaId}`);
      }
      if (testStudyId) {
        await dbConn.execute(`DELETE FROM report WHERE study_id = ${testStudyId}`);
        await dbConn.execute(`DELETE FROM studies WHERE id = ${testStudyId}`);
      }
      if (testUserId) {
        await dbConn.execute(`DELETE FROM user WHERE id = ${testUserId}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should generate a deep report with all six chapters", { timeout: 30000 }, async () => {
    const mockContext: TrpcContext = {
      user: {
        id: testUserId,
        openId: "test-deep-report-user",
        name: "Test Deep Report User",
        email: "deepreport@test.com",
        role: "user",
        tokensAvailable: 1000000,
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
      language: "zh-CN",
    };

    const caller = appRouter.createCaller(mockContext);

    const result = await caller.report.generateDeep({
      studyId: testStudyId,
    });

    expect(result).toBeDefined();
    expect(result.reportId).toBeGreaterThan(0);
    expect(result.data).toBeDefined();

    // Verify all six chapters exist
    expect(result.data.chapter1).toBeDefined();
    expect(result.data.chapter1.title).toBeTruthy();
    expect(result.data.chapter1.background).toBeTruthy();
    expect(result.data.chapter1.methodology).toBeTruthy();

    expect(result.data.chapter2).toBeDefined();
    expect(result.data.chapter2.title).toBeTruthy();
    expect(result.data.chapter2.profiles).toBeInstanceOf(Array);

    expect(result.data.chapter3).toBeDefined();
    expect(result.data.chapter3.title).toBeTruthy();
    expect(result.data.chapter3.keyFindings).toBeInstanceOf(Array);
    expect(result.data.chapter3.jobStories).toBeInstanceOf(Array);

    expect(result.data.chapter4).toBeDefined();
    expect(result.data.chapter4.title).toBeTruthy();
    expect(result.data.chapter4.needs).toBeInstanceOf(Array);
    expect(result.data.chapter4.barriers).toBeInstanceOf(Array);
    expect(result.data.chapter4.trustFactors).toBeInstanceOf(Array);

    expect(result.data.chapter5).toBeDefined();
    expect(result.data.chapter5.title).toBeTruthy();
    expect(result.data.chapter5.priorities).toBeInstanceOf(Array);

    expect(result.data.chapter6).toBeDefined();
    expect(result.data.chapter6.title).toBeTruthy();
    expect(result.data.chapter6.opportunities).toBeInstanceOf(Array);
    expect(result.data.chapter6.recommendations).toBeInstanceOf(Array);
  });

  it("should retrieve the generated deep report", { timeout: 10000 }, async () => {
    const mockContext: TrpcContext = {
      user: {
        id: testUserId,
        openId: "test-deep-report-user",
        name: "Test Deep Report User",
        email: "deepreport@test.com",
        role: "user",
        tokensAvailable: 1000000,
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
      language: "zh-CN",
    };

    const caller = appRouter.createCaller(mockContext);

    const report = await caller.report.getDeepReport({
      studyId: testStudyId,
    });

    expect(report).toBeDefined();
    expect(report?.id).toBeGreaterThan(0);
    expect(report?.studyId).toBe(testStudyId);
    expect(report?.content).toBeDefined();
    expect(report?.content.reportTitle).toBeDefined();
    expect(report?.content.reportTitle.mainTitle).toBeTruthy();
    expect(report?.content.reportTitle.subtitle).toBeTruthy();
    expect(report?.content.chapter1).toBeDefined();
    expect(report?.content.chapter2).toBeDefined();
    expect(report?.content.chapter3).toBeDefined();
    expect(report?.content.chapter4).toBeDefined();
    expect(report?.content.chapter5).toBeDefined();
    expect(report?.content.chapter6).toBeDefined();
  });

  it("should return null when no deep report exists", async () => {
    // Create a new study without generating a deep report
    const newStudy = await db.createStudy({
      userId: testUserId,
      title: "Study Without Deep Report",
      description: "Testing null return",
      researchObjective: "Test objective",
      targetAudience: "Test audience",
      researchQuestions: ["Test question"],
      demographicCriteria: {},
      personaCount: 1,
      status: "draft",
    });

    const mockContext: TrpcContext = {
      user: {
        id: testUserId,
        openId: "test-deep-report-user",
        name: "Test Deep Report User",
        email: "deepreport@test.com",
        role: "user",
        tokensAvailable: 1000000,
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
      language: "zh-CN",
    };

    const caller = appRouter.createCaller(mockContext);

    const report = await caller.report.getDeepReport({
      studyId: newStudy.id,
    });

    expect(report).toBeNull();

    // Cleanup
    const dbConn = await db.getDb();
    if (dbConn) {
      await dbConn.execute(`DELETE FROM studies WHERE id = ${newStudy.id}`);
    }
  });

  it("should reject unauthorized access", async () => {
    const unauthorizedContext: TrpcContext = {
      user: {
        id: 99999,
        openId: "unauthorized-user",
        name: "Unauthorized User",
        email: "unauthorized@test.com",
        role: "user",
        tokensAvailable: 1000,
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
      language: "zh-CN",
    };

    const caller = appRouter.createCaller(unauthorizedContext);

    await expect(
      caller.report.generateDeep({
        studyId: testStudyId,
      })
    ).rejects.toThrow();
  });
});
