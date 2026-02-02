import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Auto Interview Router - AI Agent conducts automated interviews with all personas
 */
export const autoInterviewRouter = router({
  /**
   * Start automated interview for all personas in a study
   * The AI agent will conduct deep interviews based on JTBD framework
   */
  start: protectedProcedure
    .input(z.object({
      studyId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const study = await db.getStudyById(input.studyId);
      if (!study || study.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const personas = await db.getPersonasByStudyId(input.studyId);
      if (personas.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No personas found for this study" });
      }

      // Update study status
      await db.updateStudy(input.studyId, { status: "interviewing" });

      return {
        success: true,
        personaCount: personas.length,
        message: "Automated interview started",
      };
    }),

  /**
   * Conduct interview with a single persona (called by frontend in sequence)
   */
  interviewPersona: protectedProcedure
    .input(z.object({
      studyId: z.number(),
      personaId: z.number(),
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

      // Create or get interview record
      let interview = await db.getInterviewByPersonaId(input.personaId);
      if (!interview) {
        await db.createInterview({
          studyId: input.studyId,
          personaId: input.personaId,
          status: "in_progress",
          startedAt: new Date(),
        });
        interview = await db.getInterviewByPersonaId(input.personaId);
        if (!interview) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const personality = typeof persona.personality === 'string'
        ? JSON.parse(persona.personality)
        : persona.personality;
      const behaviorPatterns = typeof persona.behaviorPatterns === 'string'
        ? JSON.parse(persona.behaviorPatterns)
        : persona.behaviorPatterns;

      // Parse research questions
      const researchQuestions = typeof study.researchQuestions === 'string'
        ? JSON.parse(study.researchQuestions)
        : study.researchQuestions;

      //      // Interviewer System Prompt
      const isZh = ctx.language === "zh";
      const interviewerPrompt = isZh
        ? `你是一位专业的 JTBD（Jobs-to-be-Done）研究员，正在进行深度访谈。

研究项目：${study.title}
研究目标：${study.researchObjective}

**JTBD 框架核心：**
当 [情境] 时，我想要 [动机]，以便于 [达成结果]。

**访谈策略：**
- 从关于最近经历的开放式问题开始
- 通过“为什么？”和“请详细说说”深入挖掘
- 询问具体场景，而非假设性问题
- 探索决策时刻和权衡取舍
- 识别痛点和未被满足的需求
- 进行 5-7 轮深度提问

**您正在访谈的人物：**
- 姓名：${persona.name}
- 年龄：${persona.age}，性别：${persona.gender}
- 职业：${persona.occupation}，地区：${persona.location}
- 背景故事：${persona.backstory}
- 性格特征：${personality?.traits?.join('、') || '未知'}
- 行为模式：${behaviorPatterns?.shoppingHabits?.join('、') || '未知'}

生成一系列访谈问题和预期回答。以 JSON 格式返回，结构如下：
{
  "rounds": [
    {
      "question": "访谈者问题",
      "response": "人物的真实回答",
      "jtbd_insight": "提取的 Job Story 或关键洞察",
      "next_question_rationale": "为什么要问这个后续问题"
    }
  ],
  "summary": {
    "key_job_stories": ["当...时，我想要...，以便于..."],
    "pain_points": ["识别的痛点"],
    "emotional_triggers": ["情感因素"],
    "decision_factors": ["关键决策标准"]
  }
}`
        : `You are a professional JTBD (Jobs-to-be-Done) researcher conducting a deep interview. based on the Jobs-to-be-Done (JTBD) framework.

**Study Context:**
- Research Objective: ${study.researchObjective}
- Target Audience: ${study.targetAudience}
- Research Questions: ${Array.isArray(researchQuestions) ? researchQuestions.join('; ') : 'General research'}

**JTBD Framework:**
Your goal is to uncover "When [situation], I want to [motivation], so I can [desired outcome]" patterns.

Focus on:
1. **Situational Context**: What triggers the need? What's happening in their life/work?
2. **Functional Jobs**: What practical tasks are they trying to accomplish?
3. **Emotional Jobs**: How do they want to feel? What anxieties/desires drive them?
4. **Social Jobs**: How do they want to be perceived by others?
5. **Constraints & Trade-offs**: What stops them? What are they willing to sacrifice?

**Interview Strategy:**
- Start with open-ended questions about recent experiences
- Dig deeper with "Why?" and "Tell me more about that"
- Ask about specific scenarios, not hypotheticals
- Explore decision-making moments and trade-offs
- Identify pain points and unmet needs
- Conduct 5-7 rounds of deep questioning

**Persona You're Interviewing:**
- Name: ${persona.name}
- Age: ${persona.age}, Gender: ${persona.gender}
- Occupation: ${persona.occupation}, Location: ${persona.location}
- Backstory: ${persona.backstory}
- Personality: ${personality?.traits?.join(', ') || 'Unknown'}
- Behavior Patterns: ${behaviorPatterns?.shoppingHabits?.join(', ') || 'Unknown'}

Generate a series of interview questions and expected responses. Return as JSON with this structure:
{
  "rounds": [
    {
      "question": "interviewer question",
      "response": "persona's authentic response",
      "jtbd_insight": "extracted Job Story or key insight",
      "next_question_rationale": "why this follow-up question"
    }
  ],
  "summary": {
    "key_job_stories": ["When..., I want..., so I can..."],
    "pain_points": ["identified pain points"],
    "emotional_triggers": ["emotional factors"],
    "decision_factors": ["key decision criteria"]
  }
}`;

      // Persona System Prompt
      const personaPrompt = `You are ${persona.name}, a ${persona.age}-year-old ${persona.gender} ${persona.occupation} from ${persona.location}.

Your backstory: ${persona.backstory}

Your personality traits: ${personality?.traits?.join(', ') || 'Unknown'}
Your values: ${personality?.values?.join(', ') || 'Unknown'}
Your motivations: ${personality?.motivations?.join(', ') || 'Unknown'}
Your pain points: ${personality?.painPoints?.join(', ') || 'Unknown'}

Your behavioral patterns:
- Shopping habits: ${behaviorPatterns?.shoppingHabits?.join(', ') || 'Unknown'}
- Media consumption: ${behaviorPatterns?.mediaConsumption?.join(', ') || 'Unknown'}
- Decision factors: ${behaviorPatterns?.decisionFactors?.join(', ') || 'Unknown'}

Respond naturally and authentically as this person would. Share specific examples from your life. Show emotions, hesitations, and real decision-making processes.`;

      try {
        // Generate interview conversation
        const response = await invokeLLM({
          messages: [
            { role: "system", content: interviewerPrompt },
            { role: "user", content: isZh ? `对这个人物进行深度 JTBD 访谈。生成 5-7 轮问题和回答。` : `Conduct a deep JTBD interview with this persona. Generate 5-7 rounds of questions and responses.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "interview_transcript",
              schema: {
                type: "object",
                properties: {
                  rounds: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        response: { type: "string" },
                        jtbd_insight: { type: "string" },
                        next_question_rationale: { type: "string" },
                      },
                      required: ["question", "response", "jtbd_insight", "next_question_rationale"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      key_job_stories: {
                        type: "array",
                        items: { type: "string" },
                      },
                      pain_points: {
                        type: "array",
                        items: { type: "string" },
                      },
                      emotional_triggers: {
                        type: "array",
                        items: { type: "string" },
                      },
                      decision_factors: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: ["key_job_stories", "pain_points", "emotional_triggers", "decision_factors"],
                    additionalProperties: false,
                  },
                },
                required: ["rounds", "summary"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content as string;
        // Clean markdown code blocks if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(cleanContent);
        const tokensUsed = response.usage?.total_tokens || 2000;

        // Save interview messages
        for (const round of data.rounds) {
          await db.createInterviewMessage({
            interviewId: interview.id,
            role: "interviewer",
            content: round.question,
          });

          await db.createInterviewMessage({
            interviewId: interview.id,
            role: "persona",
            content: round.response,
          });
        }

        // Update interview status
        await db.updateInterview(interview.id, {
          status: "completed",
          completedAt: new Date(),
        });

        // Update persona interview status
        await db.updatePersona(input.personaId, {
          interviewCompleted: true,
        });

        // Update tokens
        await db.updateStudy(input.studyId, {
          tokensUsed: study.tokensUsed + tokensUsed,
        });
        await db.updateUserTokens(ctx.user.id, tokensUsed);

        return {
          success: true,
          transcript: data,
          personaName: persona.name,
        };
      } catch (error) {
        console.error("Auto interview error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to conduct automated interview" });
      }
    }),

  /**
   * Get interview progress for a study
   */
  getProgress: protectedProcedure
    .input(z.object({ studyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const study = await db.getStudyById(input.studyId);
      if (!study || study.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const personas = await db.getPersonasByStudyId(input.studyId);
      const completedCount = personas.filter(p => p.interviewCompleted).length;

      return {
        total: personas.length,
        completed: completedCount,
        inProgress: study.status === "interviewing",
        personas: personas.map(p => ({
          id: p.id,
          name: p.name,
          completed: p.interviewCompleted,
        })),
      };
    }),
});
