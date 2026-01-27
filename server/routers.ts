import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { autoInterviewRouter } from "./routers_auto_interview";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Study management
  study: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        researchObjective: z.string(),
        targetAudience: z.string(),
        researchQuestions: z.array(z.string()),
        demographicCriteria: z.object({
          ageRange: z.string().optional(),
          gender: z.string().optional(),
          location: z.string().optional(),
          income: z.string().optional(),
          occupation: z.string().optional(),
          interests: z.array(z.string()).optional(),
        }),
        personaCount: z.number().min(1).max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const study = await db.createStudy({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          researchObjective: input.researchObjective,
          targetAudience: input.targetAudience,
          researchQuestions: input.researchQuestions as any,
          demographicCriteria: input.demographicCriteria as any,
          personaCount: input.personaCount,
          status: "draft",
        });
        return study;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const study = await db.getStudyById(input.id);
        if (!study) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Study not found" });
        }
        return {
          ...study,
          researchQuestions: typeof study.researchQuestions === 'string' 
            ? JSON.parse(study.researchQuestions) 
            : study.researchQuestions,
          demographicCriteria: typeof study.demographicCriteria === 'string'
            ? JSON.parse(study.demographicCriteria)
            : study.demographicCriteria,
        };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getStudiesByUserId(ctx.user.id);
    }),

    listPublic: publicProcedure.query(async () => {
      return db.getPublicStudies();
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const study = await db.getStudyById(input.id);
        if (!study || study.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteStudy(input.id);
        return { success: true };
      }),

    recommendResearchPlan: protectedProcedure
      .input(z.object({
        targetAudience: z.string(),
        researchGoal: z.string(),
        scenario: z.string(),
        dimensions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const prompt = `你是一位专业的商业调研分析师。请基于以下信息，推荐最佳的调研计划：

**目标人群**：${input.targetAudience}
**调研目标**：${input.researchGoal}
**研究场景**：${input.scenario === "work" ? "工作场景" : input.scenario === "personal" ? "个人/家庭场景" : "两个场景都关注"}
**关注维度**：${input.dimensions.join("、")}

请为该调研项目推荐：
1. **访谈数量**：建议的最小和最大访谈数量（考虑维度复杂度、目标人群多样性）
2. **访谈时长**：每次访谈的建议时长（分钟）
3. **问题类型**：开放式/半结构化/结构化
4. **推荐理由**：简要说明为什么这样推荐（50-80字）

请以 JSON 格式返回：
{
  "interviewCount": {
    "min": 最小访谈数量,
    "max": 最大访谈数量
  },
  "duration": 访谈时长（分钟）,
  "questionType": "问题类型",
  "rationale": "推荐理由"
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位专业的商业调研分析师。" },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "research_plan_recommendation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  interviewCount: {
                    type: "object",
                    properties: {
                      min: { type: "integer", description: "最小访谈数量" },
                      max: { type: "integer", description: "最大访谈数量" },
                    },
                    required: ["min", "max"],
                    additionalProperties: false,
                  },
                  duration: { type: "integer", description: "访谈时长（分钟）" },
                  questionType: { type: "string", description: "问题类型" },
                  rationale: { type: "string", description: "推荐理由" },
                },
                required: ["interviewCount", "duration", "questionType", "rationale"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to recommend research plan" });
        }

        const result = JSON.parse(content as string);
        return result;
      }),

    recommendDimensions: protectedProcedure
      .input(z.object({
        targetAudience: z.string(),
        researchGoal: z.string(),
        scenario: z.string(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `你是一位专业的商业调研分析师。请基于以下信息，推荐 5-8 个最相关的调研维度：

**目标人群**：${input.targetAudience}
**调研目标**：${input.researchGoal}
**研究场景**：${input.scenario === "work" ? "工作场景" : input.scenario === "personal" ? "个人/家庭场景" : "两个场景都关注"}

请为每个维度提供：
1. **维度名称**：简洁的标题（8-12字）
2. **维度说明**：具体描述该维度的调研内容（20-30字）

请以 JSON 格式返回：
[
  {
    "name": "维度名称",
    "description": "维度说明"
  }
]`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位专业的商业调研分析师。" },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "dimension_recommendations",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "维度名称" },
                        description: { type: "string", description: "维度说明" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["dimensions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to recommend dimensions" });
        }

        const result = JSON.parse(content as string);
        return result.dimensions;
      }),

    generateScenarioDescriptions: protectedProcedure
      .input(z.object({
        targetAudience: z.string(),
        researchGoal: z.string(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `你是一位专业的商业调研分析师。请基于以下信息，为三个研究场景生成有针对性的描述：

**目标人群**：${input.targetAudience}
**调研目标**：${input.researchGoal}

请为以下三个场景生成简洁的描述（15-25字）：
1. **工作场景**：描述该人群在工作中使用产品/服务的具体场景
2. **个人/家庭场景**：描述该人群在个人生活中使用产品/服务的具体场景
3. **两个场景都关注**：描述综合研究两个场景的价值

请以 JSON 格式返回：
{
  "work": "工作场景描述",
  "personal": "个人/家庭场景描述",
  "both": "两个场景都关注描述"
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位专业的商业调研分析师。" },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "scenario_descriptions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  work: { type: "string", description: "工作场景描述" },
                  personal: { type: "string", description: "个人/家庭场景描述" },
                  both: { type: "string", description: "两个场景都关注描述" },
                },
                required: ["work", "personal", "both"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate scenario descriptions" });
        }

        const result = JSON.parse(content as string);
        return result;
      }),

    analyzeIndustry: protectedProcedure
      .input(z.object({
        targetAudience: z.string(),
        researchGoal: z.string(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `你是一位专业的商业调研分析师。请基于以下信息，生成简洁的行业背景分析：

**目标人群**：${input.targetAudience}
**调研目标**：${input.researchGoal}

请提供：
1. 3-5 个关键发现（每个 20-30 字）
2. 每个发现必须标注引用来源（如：《XXX报告》、2024年）

请以 JSON 格式返回：
{
  "findings": [
    {
      "text": "发现内容",
      "source": "来源名称",
      "year": "2024"
    }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位专业的商业调研分析师。" },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "industry_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "发现内容" },
                        source: { type: "string", description: "来源名称" },
                        year: { type: "string", description: "发布年份" },
                      },
                      required: ["text", "source", "year"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["findings"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate analysis" });
        }

        const result = JSON.parse(content as string);
        return result;
      }),
  }),

  // Persona generation
  persona: router({
    generate: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const study = await db.getStudyById(input.studyId);
        if (!study || study.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.updateStudy(input.studyId, { status: "generating_personas" });

        const demographicCriteria = typeof study.demographicCriteria === 'string'
          ? JSON.parse(study.demographicCriteria)
          : study.demographicCriteria;

        const personaCount = study.personaCount || 5;
        const isZh = ctx.language === "zh";
        const prompt = isZh 
          ? `为研究项目生成 ${personaCount} 个多样化的 AI 人物画像。

研究标题：${study.title}
目标受众：${study.targetAudience}
研究目标：${study.researchObjective}

人口统计学标准：
- 年龄范围：${demographicCriteria.ageRange || '不限'}
- 性别：${demographicCriteria.gender || '不限'}
- 地区：${demographicCriteria.location || '不限'}
- 收入：${demographicCriteria.income || '不限'}
- 职业：${demographicCriteria.occupation || '不限'}
- 兴趣：${demographicCriteria.interests?.join('、') || '多样化'}

为每个画像提供：
1. 姓名（请务必使用接近真人社交媒体昵称或真实姓名，避免"AI感"过强的名字。例如：使用"李明"、"Alex_Wang"、"小雅"、"Traveler_Joe"等，不要使用"用户A"、"AI助理"等）
2. 年龄（具体数字）
3. 性别
4. 地区（城市/地区）
5. 职业（具体职位）
6. 收入（大致范围）
7. 性格（包含 traits、values、motivations、painPoints 数组的对象）
8. 行为模式（包含 shoppingHabits、mediaConsumption、decisionFactors 数组的对象）
9. 背景故事（2-3句话）

以 JSON 数组形式返回，包含结构化的性格和行为数据。`
          : `Generate ${personaCount} diverse AI personas for a research study.

Study Title: ${study.title}
Target Audience: ${study.targetAudience}
Research Objective: ${study.researchObjective}

Demographic Criteria:
- Age Range: ${demographicCriteria.ageRange || 'Any'}
- Gender: ${demographicCriteria.gender || 'Any'}
- Location: ${demographicCriteria.location || 'Any'}
- Income: ${demographicCriteria.income || 'Any'}
- Occupation: ${demographicCriteria.occupation || 'Any'}
- Interests: ${demographicCriteria.interests?.join(', ') || 'Various'}

For each persona, provide:
1. Name (Must be realistic or social-media style usernames. e.g., "Alex_Wang", "SummerDream", "Sarah J.", "Mike_Travels". Avoid generic AI names like "Persona 1", "User A")
2. Age (specific number)
3. Gender
4. Location (city/region)
5. Occupation (specific job title)
6. Income (approximate range)
7. Personality (object with traits, values, motivations, painPoints arrays)
8. Behavioral patterns (object with shoppingHabits, mediaConsumption, decisionFactors arrays)
9. Backstory (2-3 sentences)

Return as a JSON array of personas with structured personality and behavior data.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: isZh ? "你是一位创建真实消费者画像的市场研究专家。" : "You are an expert in creating realistic consumer personas for market research." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "personas",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    personas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          age: { type: "integer" },
                          gender: { type: "string" },
                          location: { type: "string" },
                          occupation: { type: "string" },
                          income: { type: "string" },
                          personality: {
                            type: "object",
                            properties: {
                              traits: { type: "array", items: { type: "string" } },
                              values: { type: "array", items: { type: "string" } },
                              motivations: { type: "array", items: { type: "string" } },
                              painPoints: { type: "array", items: { type: "string" } },
                            },
                            required: ["traits", "values", "motivations", "painPoints"],
                            additionalProperties: false,
                          },
                          behaviorPatterns: {
                            type: "object",
                            properties: {
                              shoppingHabits: { type: "array", items: { type: "string" } },
                              mediaConsumption: { type: "array", items: { type: "string" } },
                              decisionFactors: { type: "array", items: { type: "string" } },
                            },
                            required: ["shoppingHabits", "mediaConsumption", "decisionFactors"],
                            additionalProperties: false,
                          },
                          backstory: { type: "string" },
                        },
                        required: ["name", "age", "gender", "location", "occupation", "income", "personality", "behaviorPatterns", "backstory"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["personas"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content as string;
          if (!content) throw new Error("No response from LLM");

          const data = JSON.parse(content);
          const tokensUsed = response.usage?.total_tokens || 5000;

          for (const personaData of data.personas) {
            await db.createPersona({
              studyId: input.studyId,
              name: personaData.name,
              age: personaData.age,
              gender: personaData.gender,
              location: personaData.location,
              occupation: personaData.occupation,
              income: personaData.income,
              personality: personaData.personality as any,
              behaviorPatterns: personaData.behaviorPatterns as any,
              backstory: personaData.backstory,
            });
          }

          await db.updateStudy(input.studyId, {
            status: "interviewing",
            tokensUsed: study.tokensUsed + tokensUsed,
          });

          await db.updateUserTokens(ctx.user.id, tokensUsed);

          return { success: true, count: data.personas.length };
        } catch (error) {
          await db.updateStudy(input.studyId, { status: "draft" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate personas" });
        }
      }),

    listByStudy: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .query(async ({ input }) => {
        return db.getPersonasByStudyId(input.studyId);
      }),
  }),

  // Automated interview (AI agent conducts interviews)
  autoInterview: autoInterviewRouter,

  // Interview chat
  interview: router({
    getByStudyId: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const study = await db.getStudyById(input.studyId);
        if (!study || study.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const interviews = await db.getInterviewsByStudyId(input.studyId);
        const result = [];

        for (const interview of interviews) {
          const persona = await db.getPersonaById(interview.personaId);
          if (!persona) continue;

          let conversationData = interview.conversationData;
          
          // If conversationData is empty, fetch from interviewMessages table
          if (!conversationData) {
            const messages = await db.getInterviewMessages(interview.id);
            if (messages.length > 0) {
              conversationData = JSON.stringify({
                messages: messages.map(m => ({
                  role: m.role === 'interviewer' ? 'user' : 'assistant',
                  content: m.content
                }))
              });
            }
          }

          result.push({
            ...interview,
            conversationData,
            persona: {
              ...persona,
              personality: typeof persona.personality === 'string' ? JSON.parse(persona.personality) : persona.personality,
              behaviorPatterns: typeof persona.behaviorPatterns === 'string' ? JSON.parse(persona.behaviorPatterns) : persona.behaviorPatterns,
            }
          });
        }

        return result;
      }),

    chat: protectedProcedure
      .input(z.object({
        studyId: z.number(),
        personaId: z.number(),
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(["interviewer", "persona"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const study = await db.getStudyById(input.studyId);
        if (!study || study.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const persona = await db.getPersonaById(input.personaId);
        if (!persona) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Persona not found" });
        }

        let interview = await db.getInterviewByPersonaId(input.personaId);
        if (!interview) {
          const newInterview = await db.createInterview({
            studyId: input.studyId,
            personaId: input.personaId,
            status: "in_progress",
            startedAt: new Date(),
          });
          interview = await db.getInterviewByPersonaId(input.personaId);
          if (!interview) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create interview" });
        }

        const personality = typeof persona.personality === 'string'
          ? JSON.parse(persona.personality)
          : persona.personality;
        const behaviorPatterns = typeof persona.behaviorPatterns === 'string'
          ? JSON.parse(persona.behaviorPatterns)
          : persona.behaviorPatterns;

        const systemPrompt = `You are ${persona.name}, a ${persona.age}-year-old ${persona.gender} ${persona.occupation} from ${persona.location}.

Your backstory: ${persona.backstory}

Your personality traits: ${Array.isArray(personality) ? personality.join(', ') : 'Unknown'}
Your behavioral patterns: ${Array.isArray(behaviorPatterns) ? behaviorPatterns.join(', ') : 'Unknown'}

You are being interviewed for a research study about: ${study.researchObjective}

Respond naturally and authentically as this person would. Show your personality, emotions, and decision-making patterns. Be conversational and honest.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...input.history.map(h => ({
            role: h.role === "interviewer" ? "user" as const : "assistant" as const,
            content: h.content,
          })),
          { role: "user" as const, content: input.message },
        ];

        try {
          const response = await invokeLLM({ messages });
          const content = (response.choices[0]?.message?.content as string) || "I'm not sure how to respond to that.";
          const tokensUsed = response.usage?.total_tokens || 500;

          await db.createInterviewMessage({
            interviewId: interview!.id,
            role: "interviewer",
            content: input.message,
          });

          await db.createInterviewMessage({
            interviewId: interview!.id,
            role: "persona",
            content,
          });

          await db.updateStudy(input.studyId, {
            tokensUsed: study.tokensUsed + tokensUsed,
          });

          await db.updateUserTokens(ctx.user.id, tokensUsed);

          return { response: content };
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate response" });
        }
      }),
  }),

  // Report generation
  report: router({
    generate: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const study = await db.getStudyById(input.studyId);
        if (!study || study.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const personas = await db.getPersonasByStudyId(input.studyId);
        const interviews = await db.getInterviewsByStudyId(input.studyId);

        const prompt = `Generate a comprehensive research report based on the following study data.

Study Title: ${study.title}
Research Objective: ${study.researchObjective}
Target Audience: ${study.targetAudience}

Number of Personas Interviewed: ${personas.length}
Number of Interviews Conducted: ${interviews.length}

Analyze the data and provide:
1. Executive Summary (2-3 paragraphs)
2. Key Findings (5-7 bullet points)
3. Audience Insights (detailed analysis)
4. Behavioral Analysis (patterns, triggers, biases)
5. Recommendations (3-5 actionable recommendations)

Return as structured JSON.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are an expert market research analyst." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "report",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    executiveSummary: { type: "string" },
                    keyFindings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          confidence: { type: "number" },
                        },
                        required: ["title", "description", "confidence"],
                        additionalProperties: false,
                      },
                    },
                    audienceInsights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          segment: { type: "string" },
                          characteristics: { type: "array", items: { type: "string" } },
                          preferences: { type: "array", items: { type: "string" } },
                          painPoints: { type: "array", items: { type: "string" } },
                        },
                        required: ["segment", "characteristics", "preferences", "painPoints"],
                        additionalProperties: false,
                      },
                    },
                    behavioralAnalysis: {
                      type: "object",
                      properties: {
                        emotionalTriggers: { type: "array", items: { type: "string" } },
                        cognitiveBiases: { type: "array", items: { type: "string" } },
                        culturalFactors: { type: "array", items: { type: "string" } },
                        decisionDrivers: { type: "array", items: { type: "string" } },
                      },
                      required: ["emotionalTriggers", "cognitiveBiases", "culturalFactors", "decisionDrivers"],
                      additionalProperties: false,
                    },
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "string" },
                          recommendation: { type: "string" },
                          rationale: { type: "string" },
                        },
                        required: ["priority", "recommendation", "rationale"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["executiveSummary", "keyFindings", "audienceInsights", "behavioralAnalysis", "recommendations"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content as string;
          if (!content) throw new Error("No response from LLM");

          const data = JSON.parse(content);
          const tokensUsed = response.usage?.total_tokens || 10000;

          const report = await db.createReport({
            studyId: input.studyId,
            title: `${study.title} - Research Report`,
            executiveSummary: data.executiveSummary,
            keyFindings: data.keyFindings as any,
            audienceInsights: data.audienceInsights as any,
            behavioralAnalysis: data.behavioralAnalysis as any,
            recommendations: data.recommendations as any,
            status: "completed",
          });

          await db.updateStudy(input.studyId, {
            status: "completed",
            tokensUsed: study.tokensUsed + tokensUsed,
          });

          await db.updateUserTokens(ctx.user.id, tokensUsed);

          return report;
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate report" });
        }
      }),

    getByStudy: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .query(async ({ input }) => {
        const report = await db.getReportByStudyId(input.studyId);
        if (!report) return null;
        
        return report;
      }),

    getDeepReport: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .query(async ({ input }) => {
        const report = await db.getDeepReportByStudyId(input.studyId);
        if (!report) {
          return null;
        }
        
        return {
          id: report.id,
          studyId: report.studyId,
          content: report.content,
          createdAt: report.createdAt,
        };
      }),

    generateDeep: protectedProcedure
      .input(z.object({ studyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const study = await db.getStudyById(input.studyId);
        if (!study || study.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const personas = await db.getPersonasByStudyId(input.studyId);
        const interviews = await db.getInterviewsByStudyId(input.studyId);

        // Aggregate all interview content from messages
        const allInterviewContent: string[] = [];
        const allKeyInsights: string[] = [];

        for (const interview of interviews) {
          const messages = await db.getInterviewMessages(interview.id);
          const conversationText = messages
            .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Persona'}: ${m.content}`)
            .join('\n');
          allInterviewContent.push(conversationText);

          if (interview.keyInsights) {
            allKeyInsights.push(...interview.keyInsights);
          }
        }

        const language = ctx.language || 'zh-CN';
        const isEnglish = language === 'en';

        const systemPrompt = isEnglish
          ? `You are a senior insight researcher from atypica.AI. Generate a research report that embodies "McKinsey meets Anthropological Field Notes" — the rigor of top-tier consulting with the authenticity of human ethnography.

**Design Philosophy**:
"Use the most rigorous commercial research professionalism to present the most authentic human insights."

This is an **insight-driven research report** that must demonstrate:
1. **McKinsey-level professionalism**: Symmetrical layout, clear information hierarchy, logically rigorous structure
2. **Anthropological authenticity**: Documentary-style real user stories, architectural photography-like geometric aesthetics
3. **Editorial restraint**: Build hierarchy through font weight, size, and spacing — NOT through color

**Visual Standards (Extreme Minimalism)**:
- **Color Palette**: Black, white, gray as absolute dominants. Single deep blue or deep gray for key data/findings ONLY.
- **Typography Hierarchy**: Large bold titles (authority) → Medium bold insights (attention) → Regular gray body (readability) → Small bold data labels (precision)
- **Layout**: Highly structured, rigorously aligned, strong sense of order. High information density but not crowded. Clear grouping with breathing space.
- **Separation**: Use thin lines, spacing, font weight differences — NEVER color blocks.

**Content Structure (Six Chapters, Logically Progressive)**:
1. **Research Background & Objectives** (Set context, establish importance)
2. **Target Audience Profiles** (Real people with names, ages, roles, "struggling moments")
3. **Core Findings & Insights** (JTBD framework: struggles, pain points, expectations; multi-layered with 1.1, 1.2, 1.3 sub-sections)
4. **AI Tool Needs & Barriers** (Feature priorities, trust thresholds, privacy concerns)
5. **Core Demands** (Goal priorities, product preferences, decision-making psychology)
6. **Business Opportunities & Action Recommendations** (Opportunity identification, product design, market strategy)

**Information Presentation Techniques**:
- **User Stories**: Open with real interview excerpts
- **Data Comparison**: Present key numbers side-by-side, emphasize critical data in deep color
- **Priority Matrix**: Four-quadrant chart showing urgency vs. satisfaction
- **Decision Flow**: Flowchart showing user journey from anxiety to action
- **Key Quotes**: Highlight user verbatim with quotes + gray background box
- **Citation Sources**: Every core viewpoint, data point, and argument MUST be cited. Format: [Number] Interviewee Name, Age, Role — "Quote" (Interview Date)
- **Chapter Endings**: Provide clear "Key Insights" or "Action Recommendations"

**Atmosphere**:
- **Professional & Credible**: Through rigorous layout, authoritative data, clear logic
- **Human Warmth**: Through real stories, emotional language, user voices
- **Action-Oriented**: Every chapter ends with clear takeaways

**Report Title Format**: "[Metaphorical Main Title] - Deep Insights into [Audience] [Core Need]"

**Title Examples** (Reference Style):
- "Guardians in the Age of Silver Anxiety - Deep Insights into AI Tools & Health Management Needs of 40-65 Year-Old State-Owned Enterprise Executives"
- "Ferrymen of Digital Transformation - Deep Insights into Smart Tool Adoption by Traditional Manufacturing Managers"
- "Efficiency Seekers Under Knowledge Anxiety - Deep Insights into AI Assistant Tool Needs of New Generation Professionals"

**Title Creation Requirements**:
- Main title MUST have metaphorical quality, emotional resonance, and humanistic care
- Avoid plain descriptive titles
- Use an image or scene to encapsulate core insights
- Subtitle clearly states target audience and core needs

**Tone**: Empathetic yet rigorous, narrative yet data-driven, professional yet warm.`
          : `你是 atypica.AI 的资深洞察研究专家。请生成一份体现“McKinsey遇见人类学田野笔记”风格的研究报告——用顶级咨询公司的严谨性，呈现人类学田野调查的真实性。

**设计哲学**：
“用最严谨的商业调研专业性，呈现最真实的人性洞察。”

这是一份**洞察型研究报告**，必须体现：
1. **McKinsey式的专业严谨**：对称对齐的版式、清晰的信息层级、逻辑严密的结构
2. **人类学田野笔记的真实感**：纪实摄影般的真实用户故事、建筑摄影般的几何美学
3. **编辑设计的克制美学**：通过字重、尺寸、间距建立层级，而非依赖色彩

**视觉标准（极致简约）**：
- **色彩方案**：黑白灰为绝对主导。仅用单一深蓝色或深灰色标注关键数据和重要发现。
- **字体层级**：大号粗体标题（权威）→ 中号加粗洞察（吸引注意）→ 常规灰色正文（易读）→ 小号加粗数据标注（精准）
- **排版**：高度结构化，严谨对齐，秩序感强。信息密度高但不拥挤。清晰分组，适度留白。
- **分隔方式**：用细线、间距、字重差异区分层级，绝不用色块分隔。

**内容结构（六章，逻辑递进）**：
1. **研究背景与目标**（设定context，建立重要性）
2. **目标人群画像**（真实的人：姓名、年龄、身份、“挣扎时刻”）
3. **核心发现与洞察**（JTBD框架：“挣扎时刻”、痛点、期待；多层次结构 1.1、1.2、1.3）
4. **AI工具需求与障碍**（功能优先级、信任门槛、隐私顾虑）
5. **核心诉求**（目标优先级、产品偏好、消费决策）
6. **商业机会与行动建议**（机会点识别、产品设计建议、市场策略）

**信息呈现技巧**：
- **用户故事**：用真实访谈片段开篇
- **数据对比**：并列呈现关键数字，用深色强调重要数据
- **优先级矩阵**：用四象限图展示需求紧迫度vs满足度
- **决策流程**：用流程图展示用户从焦虑到行动的心理路径
- **关键引用**：每个核心观点、数据、论据必须紧跟真实用户引用。格式：“引用内容” —— 受访者姓名，年龄，职业。示例：“我需要的不是看起来年轻，而是感觉自己还能像十年前一样高效运转。” —— 张毅，45岁，央企部门副总
- **章节结尾**：提供清晰的"关键启示"或"行动建议"

**氛围营造**：
- **专业可信**：通过严谨排版、权威数据、清晰逻辑传递
- **人性温度**：通过真实故事、情感化语言、用户原声呈现
- **行动导向**：每章结尾提供清晰的关键启示或行动建议

**标题创作要求**：
1. **报告标题**：必须使用两行分离的纪实文学风格标题：
   - **第一行（mainTitle）**：隐喻性主标题，具有情感张力和人文关怀。示例："银发焦虑时代的守护者"、"数字化转型的摆渡人"、"知识焦虑下的效率追寻者"
   - **第二行（subtitle）**：具体的目标人群和需求描述。示例："国央企中高层AI健康管理与抗衰康养需求深度洞察"、"传统制造业管理者智能工具采纳深度洞察"
2. **标题设计原则**：
- 主标题必须具有隐喻性、情感张力和人文关怀
- 避免平铺直叙的描述性标题
- 用一个意象或场景概括核心洞察
- 副标题清晰说明目标人群和核心需求

**语调**：共情但严谨，叙事但数据化，专业但温暖。`;

        const userPrompt = isEnglish
          ? `Generate a deep analysis report based on the following research data:

**Study Information**:
- Title: ${study.title}
- Research Objective: ${study.researchObjective}
- Target Audience: ${study.targetAudience}

**Interview Data**:
- Number of Personas: ${personas.length}
- Number of Interviews: ${interviews.length}
- Total Key Insights: ${allKeyInsights.length}

**Interview Content Sample**:
${allInterviewContent.slice(0, 2).join('\n\n---\n\n')}

**Key Insights**:
${JSON.stringify(allKeyInsights.slice(0, 15))}

Please generate a comprehensive 6-chapter report with:

**Required Elements**:
1. **Report Title**: MUST use format "[Metaphorical Main Title] - Deep Insights into [Audience] [Core Need]", with main title having emotional resonance and humanistic care (Reference example: "Guardians in the Age of Silver Anxiety - Deep Insights into AI Tools & Health Management Needs of 40-65 Year-Old State-Owned Enterprise Executives")
2. **Documentary-style chapter titles**: Each chapter and section must have evocative, metaphorical titles
3. **Key Quotes**: Every core viewpoint, data point, and argument MUST be immediately followed by real user quotes embedded in the text. Format: "Quote text" — Interviewee Name, Age, Role. Example: "I don't need to look young, I need to feel like I can still operate as efficiently as I did ten years ago." — Zhang Yi, 45, Deputy Director of State-Owned Enterprise Department
4. **Layered structure**: Each core finding should have 2-3 sub-sections (e.g., 1.1, 1.2, 1.3)
5. **Key Insight boxes**: Highlight 1-2 breakthrough insights per major section
6. **Scenario descriptions**: Start each finding with a vivid "struggling moment" scenario
7. **Data integration**: Weave quantitative data naturally into narrative (e.g., "About 40% of...")
8. **Risk warnings**: Include specific risks with emoji markers (🚨⚠⚡)
9. **Humanistic conclusion**: End with a warm, metaphorical closing that echoes the opening

Return as structured JSON.`
          : `基于以下研究数据生成深度分析报告：

**调研信息**：
- 标题：${study.title}
- 研究目标：${study.researchObjective}
- 目标受众：${study.targetAudience}

**访谈数据**：
- 受访者人数：${personas.length}
- 访谈次数：${interviews.length}
- 关键洞察总数：${allKeyInsights.length}

**访谈内容示例**：
${allInterviewContent.slice(0, 2).join('\n\n---\n\n')}

**关键洞察**：
${JSON.stringify(allKeyInsights.slice(0, 15))}



请生成一份完整的六章报告，**必须包含**：

**必备元素**：
1. **报告标题**：必须使用格式《[隐喻性主标题]-[目标人群][核心需求]深度洞察》，主标题要有情感张力和人文关怀（参考示例：《银发焦虑时代的守护者-40-65岁国央企中高层AI工具与健康管理需求深度洞察》）
2. **纪实文学式章节标题**：每个章节和小节都要有富有情感张力的隐喻标题
3. **用户引用**：每个核心观点、数据、论据必须紧跟真实用户引用，嵌入在正文中。格式：“引用内容” —— 姓名，年龄，身份。示例：“我需要的不是看起来年轻，而是感觉自己还能像十年前一样高效运转。” —— 张毅，45岁，央企部门副总。包含至少 5-8 条真实用户原话。
4. **分层结构**：每个核心发现必须有 2-3 个子节（如 1.1、1.2、1.3）
5. **关键洞察框**：每个主要章节突出 1-2 个突破性洞察
6. **场景描述**：每个发现开头用生动的“挣扎时刻”场景
7. **数据融合**：将定量数据自然编织入叙事（如“约 40% 的...”），信息密度高但不拥挤
8. **优先级矩阵**：在第五章使用四象限图展示需求紧迫度vs满足度
9. **决策流程**：用流程图展示用户从焦虑到行动的心理路径
10. **风险警示**：在第六章包含具体风险及 emoji 标记（🚨最高优先级、⚠中等、⚡操作性）
11. **章节结尾**：每章结尾提供清晰的“关键启示”或“行动建议”
12. **人文结尾**：报告最后用温暖的、隐喻的语言结尾，回扣开篇

请务必严格按照以下 JSON 结构返回数据（不要更改键名）：

\`\`\`json
{
  "reportTitle": {
    "mainTitle": "隐喻性主标题",
    "subtitle": "副标题"
  },
  "chapter1": {
    "title": "章节标题",
    "subtitle": "章节副标题",
    "background": "研究背景叙述",
    "objectives": ["研究目标1", "研究目标2"],
    "methodology": "研究方法描述"
  },
  "chapter2": {
    "title": "章节标题",
    "profiles": [
      {
        "name": "画像名称",
        "demographics": "人口统计特征",
        "background": "背景故事",
        "quote": "代表性语录"
      }
    ]
  },
  "chapter3": {
    "title": "章节标题",
    "keyFindings": [
      {
        "finding": "核心发现标题",
        "evidence": "详细证据描述",
        "userQuote": "真实用户原话引用"
      }
    ],
    "jobStories": ["Job Story 1", "Job Story 2"]
  },
  "chapter4": {
    "title": "章节标题",
    "needs": ["需求1", "需求2"],
    "barriers": ["障碍1", "障碍2"],
    "trustFactors": ["信任要素1", "信任要素2"]
  },
  "chapter5": {
    "title": "章节标题",
    "priorities": [
      {
        "priority": "优先级名称",
        "importance": 8,
        "urgency": 9
      }
    ],
    "decisionProcess": "决策流程描述"
  },
  "chapter6": {
    "title": "章节标题",
    "opportunities": [
      {
        "opportunity": "机会点名称",
        "rationale": "推荐理由",
        "impact": "预期影响"
      }
    ],
    "recommendations": [
      {
        "action": "行动建议",
        "rationale": "理由",
        "priority": "High/Medium/Low"
      }
    ]
  }
}
(JSON_STRUCTURE_END)`;

        try {
          const response = await invokeLLM({
            model: "gemini-2.0-flash",
            messages: [
              { role: "system", content: systemPrompt + "\n\nIMPORTANT: Respond with a raw JSON object only. Do not wrap it in markdown code blocks." },
              { role: "user", content: userPrompt },
            ],
            response_format: {
              type: "json_object"
            }
          });

          let content = response.choices[0]?.message?.content as string;
          if (!content) throw new Error("No response from LLM");

          // Clean up potential markdown code blocks if the model adds them despite instructions
          content = content.replace(/^`{3}json\s*/, "").replace(/^`{3}\s*/, "").replace(/\s*`{3}$/, "");

          const data = JSON.parse(content);
          const tokensUsed = response.usage?.total_tokens || 15000;

          // Delete old deep report if exists
          await db.deleteDeepReportsByStudyId(input.studyId);

          // Save to deep_reports table with complete JSON structure
          const report = await db.createDeepReport({
            studyId: input.studyId,
            content: data,
            status: "completed",
          });

          await db.updateStudy(input.studyId, {
            status: "completed",
            tokensUsed: study.tokensUsed + tokensUsed,
          });

          await db.updateUserTokens(ctx.user.id, tokensUsed);

          return { reportId: report.id, data };
        } catch (error) {
          console.error("Deep report generation error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate deep report" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
