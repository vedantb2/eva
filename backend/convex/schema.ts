import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    xp: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastPracticeDate: v.optional(v.string()),
    hearts: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  userMigrations: defineTable({
    clerkUserId: v.string(),
    userId: v.id("users"),
    email: v.string(),
    migratedAt: v.number(),
    migrationStatus: v.union(v.literal("started"), v.literal("completed")),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),

  lessons: defineTable({
    title: v.string(),
    titleMarathi: v.string(),
    description: v.string(),
    unit: v.number(),
    order: v.number(),
    icon: v.string(),
  })
    .index("by_unit", ["unit"])
    .index("by_order", ["order"]),

  questions: defineTable({
    lessonId: v.id("lessons"),
    type: v.union(
      v.literal("translate_to_marathi"),
      v.literal("translate_to_english"),
      v.literal("multiple_choice"),
      v.literal("listen_and_type"),
      v.literal("match_pairs")
    ),
    prompt: v.string(),
    promptMarathi: v.optional(v.string()),
    correctAnswer: v.string(),
    options: v.optional(v.array(v.string())),
    pairs: v.optional(
      v.array(v.object({ english: v.string(), marathi: v.string() }))
    ),
    order: v.number(),
  }).index("by_lesson", ["lessonId"]),

  userProgress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    completed: v.boolean(),
    score: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_lesson", ["userId", "lessonId"]),

  vocabulary: defineTable({
    english: v.string(),
    marathi: v.string(),
    pronunciation: v.string(),
    category: v.string(),
    lessonId: v.optional(v.id("lessons")),
  })
    .index("by_category", ["category"])
    .index("by_lesson", ["lessonId"]),

  userVocabulary: defineTable({
    userId: v.id("users"),
    vocabularyId: v.id("vocabulary"),
    mastery: v.number(),
    lastReviewed: v.number(),
    timesCorrect: v.number(),
    timesIncorrect: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_vocabulary", ["userId", "vocabularyId"]),

  waitlist: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  cultureCards: defineTable({
    title: v.string(),
    titleMarathi: v.string(),
    category: v.union(
      v.literal("history"),
      v.literal("festivals"),
      v.literal("food"),
      v.literal("etiquette")
    ),
    content: v.string(),
    contentMarathi: v.string(),
    icon: v.string(),
    order: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_order", ["order"]),

  festivals: defineTable({
    name: v.string(),
    nameMarathi: v.string(),
    description: v.string(),
    marathiMonth: v.string(),
    tithi: v.string(),
    gregorianDateStart: v.string(),
    gregorianDateEnd: v.optional(v.string()),
    icon: v.string(),
    year: v.number(),
  })
    .index("by_month", ["marathiMonth"])
    .index("by_year", ["year"]),

  marathiMonths: defineTable({
    name: v.string(),
    nameMarathi: v.string(),
    order: v.number(),
    gregorianStart: v.string(),
    gregorianEnd: v.string(),
    year: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_year", ["year"]),

  tithis: defineTable({
    date: v.string(),
    tithi: v.string(),
    tithiMarathi: v.string(),
    paksha: v.union(v.literal("shukla"), v.literal("krishna")),
    marathiMonth: v.string(),
    year: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_month_year", ["marathiMonth", "year"]),

  userCultureProgress: defineTable({
    userId: v.id("users"),
    cultureCardId: v.id("cultureCards"),
    read: v.boolean(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_card", ["userId", "cultureCardId"]),
});

export default schema;
