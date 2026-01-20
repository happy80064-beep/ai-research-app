CREATE TABLE `deep_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studyId` integer NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'generating' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`interviewId` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`sentiment` text,
	`topics` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studyId` integer NOT NULL,
	`personaId` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`summary` text,
	`keyInsights` text,
	`emotionalTriggers` text,
	`cognitiveBiases` text,
	`startedAt` integer,
	`completedAt` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studyId` integer NOT NULL,
	`name` text NOT NULL,
	`avatarUrl` text,
	`age` integer,
	`gender` text,
	`location` text,
	`occupation` text,
	`income` text,
	`personality` text,
	`behaviorPatterns` text,
	`backstory` text,
	`interviewCompleted` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studyId` integer NOT NULL,
	`title` text NOT NULL,
	`executiveSummary` text,
	`keyFindings` text,
	`audienceInsights` text,
	`behavioralAnalysis` text,
	`recommendations` text,
	`chartData` text,
	`status` text DEFAULT 'generating' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`researchObjective` text,
	`targetAudience` text,
	`researchQuestions` text,
	`demographicCriteria` text,
	`personaCount` integer DEFAULT 5 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`tokensUsed` integer DEFAULT 0 NOT NULL,
	`isPublic` integer DEFAULT 0 NOT NULL,
	`isFeatured` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`stripeSubscriptionId` text NOT NULL,
	`stripePriceId` text NOT NULL,
	`tier` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`currentPeriodStart` integer,
	`currentPeriodEnd` integer,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `token_purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`stripePaymentIntentId` text NOT NULL,
	`amount` integer NOT NULL,
	`tokensGranted` integer NOT NULL,
	`bonusTokens` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`subscriptionTier` text DEFAULT 'free' NOT NULL,
	`tokenBalance` integer DEFAULT 1000000 NOT NULL,
	`stripeCustomerId` text,
	`stripeSubscriptionId` text,
	`createdAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`lastSignedIn` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);