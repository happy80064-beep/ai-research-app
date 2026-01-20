import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { 
  InsertUser, 
  users, 
  studies, 
  personas, 
  interviews, 
  interviewMessages, 
  reports,
  deepReports,
  subscriptions,
  tokenPurchases 
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = createClient({ url: process.env.DATABASE_URL });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Study queries
export async function createStudy(data: typeof studies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(studies).values(data).returning({ id: studies.id });
  return { id: Number(result[0].id) };
}

export async function getStudyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studies).where(eq(studies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStudiesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studies).where(eq(studies.userId, userId)).orderBy(desc(studies.createdAt));
}

export async function getPublicStudies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studies).where(eq(studies.isPublic, 1)).orderBy(desc(studies.createdAt)).limit(50);
}

export async function updateStudy(id: number, data: Partial<typeof studies.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(studies).set(data).where(eq(studies.id, id));
}

export async function deleteStudy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(studies).where(eq(studies.id, id));
}

// Persona queries
export async function createPersona(data: typeof personas.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(personas).values(data).returning({ id: personas.id });
  return { id: Number(result[0].id) };
}

export async function getPersonasByStudyId(studyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personas).where(eq(personas.studyId, studyId));
}

export async function getPersonaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePersona(id: number, data: Partial<typeof personas.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(personas).set(data).where(eq(personas.id, id));
}

// Interview queries
export async function createInterview(data: typeof interviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interviews).values(data).returning({ id: interviews.id });
  return { id: Number(result[0].id) };
}

export async function getInterviewsByStudyId(studyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviews).where(eq(interviews.studyId, studyId));
}

export async function getInterviewByPersonaId(personaId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(interviews).where(eq(interviews.personaId, personaId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInterview(id: number, data: Partial<typeof interviews.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(interviews).set(data).where(eq(interviews.id, id));
}

// Interview message queries
export async function createInterviewMessage(data: typeof interviewMessages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interviewMessages).values(data).returning({ id: interviewMessages.id });
  return { id: Number(result[0].id) };
}

export async function getInterviewMessages(interviewId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewMessages).where(eq(interviewMessages.interviewId, interviewId)).orderBy(interviewMessages.createdAt);
}

// Report queries
export async function createReport(data: typeof reports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reports).values(data).returning({ id: reports.id });
  return { id: Number(result[0].id) };
}

export async function getReportByStudyId(studyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.studyId, studyId)).orderBy(desc(reports.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReport(id: number, data: Partial<typeof reports.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set(data).where(eq(reports.id, id));
}

// Token management
export async function updateUserTokens(userId: number, tokensUsed: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  
  const newBalance = user.tokenBalance - tokensUsed;
  if (newBalance < 0) {
    throw new Error("Insufficient tokens");
  }
  
  await db.update(users).set({ tokenBalance: newBalance }).where(eq(users.id, userId));
  return newBalance;
}

// Deep Reports
export async function createDeepReport(data: {
  studyId: number;
  content: any;
  status?: "generating" | "completed" | "failed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(deepReports).values({
    studyId: data.studyId,
    content: data.content,
    status: data.status || "completed",
  }).returning({ id: deepReports.id });

  return {
    id: Number(result[0].id),
    studyId: data.studyId,
    content: data.content,
    status: data.status || "completed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getDeepReportByStudyId(studyId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(deepReports)
    .where(eq(deepReports.studyId, studyId))
    .orderBy(desc(deepReports.createdAt))
    .limit(1);

  return results[0] || null;
}

export async function deleteDeepReportsByStudyId(studyId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(deepReports).where(eq(deepReports.studyId, studyId));
}
