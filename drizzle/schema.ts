import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  // Subscription tier: free, pro, max
  subscriptionTier: text("subscriptionTier", { enum: ["free", "pro", "max"] }).default("free").notNull(),
  // Token balance for AI operations
  tokenBalance: integer("tokenBalance", { mode: "number" }).default(1000000).notNull(), // 1M free tokens
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Research studies table - stores user-created research projects
 */
export const studies = sqliteTable("studies", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull(),
  // Basic info
  title: text("title").notNull(),
  description: text("description"),
  // Research configuration
  researchObjective: text("researchObjective"),
  targetAudience: text("targetAudience"),
  researchQuestions: text("researchQuestions", { mode: "json" }).$type<string[]>(),
  demographicCriteria: text("demographicCriteria", { mode: "json" }).$type<{
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    occupation?: string;
    interests?: string[];
  }>(),
  // Persona configuration
  personaCount: integer("personaCount", { mode: "number" }).default(5).notNull(),
  // Status
  status: text("status", { enum: ["draft", "generating_personas", "interviewing", "analyzing", "completed"] }).default("draft").notNull(),
  // Token usage
  tokensUsed: integer("tokensUsed", { mode: "number" }).default(0).notNull(),
  // Visibility
  isPublic: integer("isPublic", { mode: "boolean" }).default(0).notNull(),
  isFeatured: integer("isFeatured", { mode: "boolean" }).default(0).notNull(),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Study = typeof studies.$inferSelect;
export type InsertStudy = typeof studies.$inferInsert;

/**
 * AI Personas table - stores generated AI personas for each study
 */
export const personas = sqliteTable("personas", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  studyId: integer("studyId", { mode: "number" }).notNull(),
  // Persona identity
  name: text("name").notNull(),
  avatarUrl: text("avatarUrl"),
  // Demographics
  age: integer("age", { mode: "number" }),
  gender: text("gender"),
  location: text("location"),
  occupation: text("occupation"),
  income: text("income"),
  // Psychographics
  personality: text("personality", { mode: "json" }).$type<{
    traits: string[];
    values: string[];
    motivations: string[];
    painPoints: string[];
  }>(),
  behaviorPatterns: text("behaviorPatterns", { mode: "json" }).$type<{
    shoppingHabits: string[];
    mediaConsumption: string[];
    decisionFactors: string[];
  }>(),
  // Background story
  backstory: text("backstory"),
  // Interview status
  interviewCompleted: integer("interviewCompleted", { mode: "boolean" }).default(0).notNull(),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

/**
 * Interviews table - stores interview sessions with personas
 */
export const interviews = sqliteTable("interviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  studyId: integer("studyId", { mode: "number" }).notNull(),
  personaId: integer("personaId", { mode: "number" }).notNull(),
  // Interview status
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  // Summary and insights
  summary: text("summary"),
  keyInsights: text("keyInsights", { mode: "json" }).$type<string[]>(),
  emotionalTriggers: text("emotionalTriggers", { mode: "json" }).$type<string[]>(),
  cognitiveBiases: text("cognitiveBiases", { mode: "json" }).$type<string[]>(),
  // Timestamps
  startedAt: integer("startedAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

/**
 * Interview messages table - stores individual messages in interviews
 */
export const interviewMessages = sqliteTable("interview_messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  interviewId: integer("interviewId", { mode: "number" }).notNull(),
  // Message content
  role: text("role", { enum: ["interviewer", "persona"] }).notNull(),
  content: text("content").notNull(),
  // Metadata
  sentiment: text("sentiment"),
  topics: text("topics", { mode: "json" }).$type<string[]>(),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type InterviewMessage = typeof interviewMessages.$inferSelect;
export type InsertInterviewMessage = typeof interviewMessages.$inferInsert;

/**
 * Reports table - stores generated research reports
 */
export const reports = sqliteTable("reports", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  studyId: integer("studyId", { mode: "number" }).notNull(),
  // Report content
  title: text("title").notNull(),
  executiveSummary: text("executiveSummary"),
  keyFindings: text("keyFindings", { mode: "json" }).$type<{
    title: string;
    description: string;
    confidence: number;
  }[]>(),
  audienceInsights: text("audienceInsights", { mode: "json" }).$type<{
    segment: string;
    characteristics: string[];
    preferences: string[];
    painPoints: string[];
  }[]>(),
  behavioralAnalysis: text("behavioralAnalysis", { mode: "json" }).$type<{
    emotionalTriggers: string[];
    cognitiveBiases: string[];
    culturalFactors: string[];
    decisionDrivers: string[];
  }>(),
  recommendations: text("recommendations", { mode: "json" }).$type<{
    priority: string;
    recommendation: string;
    rationale: string;
  }[]>(),
  // Visualization data
  chartData: text("chartData", { mode: "json" }).$type<Record<string, unknown>>(),
  // Report status
  status: text("status", { enum: ["generating", "completed", "failed"] }).default("generating").notNull(),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Deep Reports table - stores generated deep analysis reports
 */
export const deepReports = sqliteTable("deep_reports", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  studyId: integer("studyId", { mode: "number" }).notNull(),
  // Report content (stored as JSON)
  content: text("content", { mode: "json" }).$type<{
    reportTitle: {
      mainTitle: string;
      subtitle: string;
    };
    chapter1: Record<string, unknown>;
    chapter2: Record<string, unknown>;
    chapter3: Record<string, unknown>;
    chapter4: Record<string, unknown>;
    chapter5: Record<string, unknown>;
    chapter6: Record<string, unknown>;
  }>().notNull(),
  // Report status
  status: text("status", { enum: ["generating", "completed", "failed"] }).default("generating").notNull(),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type DeepReport = typeof deepReports.$inferSelect;
export type InsertDeepReport = typeof deepReports.$inferInsert;

/**
 * Subscriptions table - stores subscription history and payments
 */
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull(),
  // Stripe info
  stripeSubscriptionId: text("stripeSubscriptionId").notNull(),
  stripePriceId: text("stripePriceId").notNull(),
  // Subscription details
  tier: text("tier", { enum: ["pro", "max"] }).notNull(),
  status: text("status", { enum: ["active", "canceled", "past_due", "incomplete"] }).default("active").notNull(),
  // Billing period
  currentPeriodStart: integer("currentPeriodStart", { mode: "timestamp" }),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Token purchases table - stores one-time token purchases
 */
export const tokenPurchases = sqliteTable("token_purchases", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull(),
  // Stripe info
  stripePaymentIntentId: text("stripePaymentIntentId").notNull(),
  // Purchase details
  amount: integer("amount", { mode: "number" }).notNull(), // Amount in cents
  tokensGranted: integer("tokensGranted", { mode: "number" }).notNull(),
  bonusTokens: integer("bonusTokens", { mode: "number" }).default(0).notNull(),
  // Status
  status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending").notNull(),
  // Timestamps
  createdAt: integer("createdAt", { mode: "timestamp" }).defaultNow().notNull(),
});

export type TokenPurchase = typeof tokenPurchases.$inferSelect;
export type InsertTokenPurchase = typeof tokenPurchases.$inferInsert;
