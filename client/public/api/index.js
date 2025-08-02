var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLogs: () => adminLogs,
  admins: () => admins,
  apiUsage: () => apiUsage,
  couponUsage: () => couponUsage,
  coupons: () => coupons,
  insertAdminLogSchema: () => insertAdminLogSchema,
  insertAdminSchema: () => insertAdminSchema,
  insertApiUsageSchema: () => insertApiUsageSchema,
  insertCouponSchema: () => insertCouponSchema,
  insertReadingDateSchema: () => insertReadingDateSchema,
  insertReadingProgressSchema: () => insertReadingProgressSchema,
  insertStorySchema: () => insertStorySchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertUserSchema: () => insertUserSchema,
  readingDates: () => readingDates,
  readingProgress: () => readingProgress,
  stories: () => stories,
  subscriptions: () => subscriptions,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, date, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, stories, readingProgress, readingDates, apiUsage, admins, coupons, couponUsage, subscriptions, adminLogs, insertUserSchema, insertStorySchema, insertReadingProgressSchema, insertReadingDateSchema, insertApiUsageSchema, insertAdminSchema, insertCouponSchema, insertSubscriptionSchema, insertAdminLogSchema;
var init_schema = __esm({
  "../shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").unique(),
      email: varchar("email"),
      password: text("password"),
      googleId: text("google_id").unique(),
      profileImageUrl: text("profile_image_url"),
      babyName: text("baby_name"),
      babyDueDate: timestamp("baby_due_date"),
      relationship: text("relationship"),
      timezone: text("timezone"),
      language: text("language").default("en"),
      createdAt: timestamp("created_at")
    });
    stories = pgTable("stories", {
      id: integer("id").primaryKey(),
      // bigint in DB
      storyUuid: uuid("story_uuid").defaultRandom().notNull().unique(),
      // UUID for secure story access
      uniqueId: text("unique_id"),
      titleKo: text("title_ko"),
      titleEn: text("title_en"),
      contentKo: text("content_ko"),
      contentEn: text("content_en"),
      excerptKo: text("excerpt_ko"),
      excerptEn: text("excerpt_en"),
      tagsKo: jsonb("tags_ko"),
      tagsEn: jsonb("tags_en"),
      imageUrl: text("image_url"),
      readingTime: integer("reading_time").default(5),
      // bigint in DB
      isDaily: boolean("is_daily").default(false),
      isCreated: boolean("is_created").default(false),
      status: text("status").default("published"),
      createdAt: timestamp("created_at").defaultNow(),
      // timestamp with time zone in DB
      creatorId: text("creator_id"),
      jisuAudioUrl: text("jisu_audio_url"),
      eunwooAudioUrl: text("eunwoo_audio_url"),
      emmaAudioUrl: text("emma_audio_url"),
      noahAudioUrl: text("noah_audio_url")
    });
    readingProgress = pgTable("reading_progress", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      storyId: integer("story_id").references(() => stories.id).notNull(),
      readAt: timestamp("read_at"),
      firstReadAt: timestamp("first_read_at"),
      // 사용자가 처음 읽은 날짜 (TFT 날짜 표시용)
      isRead: boolean("is_read").default(false),
      isFavorite: boolean("is_favorite").default(false)
    });
    readingDates = pgTable("reading_dates", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      storyId: integer("story_id").references(() => stories.id).notNull(),
      readDate: date("read_date").notNull()
      // DATE 타입으로 날짜만 저장
    }, (table) => [
      // 사용자별 날짜별 인덱스 (월별 캘린더용)
      index("idx_reading_dates_user_date").on(table.userId, table.readDate)
    ]);
    apiUsage = pgTable("api_usage", {
      id: serial("id").primaryKey(),
      provider: text("provider").notNull(),
      // 'gemini', 'openai', etc.
      operation: text("operation").notNull(),
      // 'story_generation', 'image_generation', etc.
      model: text("model").notNull(),
      // Model name used
      cost: text("cost").notNull(),
      // Estimated cost as string
      metadata: jsonb("metadata"),
      // Additional data like duration, tokens, etc.
      createdAt: timestamp("created_at").defaultNow()
    });
    admins = pgTable("admins", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      role: text("role").default("admin"),
      // 'admin', 'super_admin'
      permissions: jsonb("permissions"),
      // JSON array of permissions
      createdAt: timestamp("created_at").defaultNow(),
      createdBy: integer("created_by").references(() => users.id)
    });
    coupons = pgTable("coupons", {
      id: serial("id").primaryKey(),
      code: text("code").unique().notNull(),
      name: text("name").notNull(),
      description: text("description"),
      discountType: text("discount_type").notNull(),
      // Required field
      discountValue: text("discount_value").notNull(),
      // Required field - numeric in DB  
      duration: text("duration").notNull(),
      // Required field
      maxUses: integer("max_uses"),
      // null for unlimited
      currentUses: integer("current_uses").default(0),
      validFrom: timestamp("valid_from").notNull(),
      validUntil: timestamp("valid_until").notNull(),
      isActive: boolean("is_active").default(true),
      createdBy: integer("created_by").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      upgradeType: text("upgrade_type").default("duration_based"),
      // Optional with default
      planDuration: text("plan_duration").default("1_month"),
      // Optional with default
      planExpiryDate: timestamp("plan_expiry_date")
      // For expiry_based upgrade type
    });
    couponUsage = pgTable("coupon_usage", {
      id: serial("id").primaryKey(),
      couponId: integer("coupon_id").references(() => coupons.id).notNull(),
      userId: integer("user_id").references(() => users.id).notNull(),
      usedAt: timestamp("used_at").defaultNow()
    });
    subscriptions = pgTable("subscriptions", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").references(() => users.id).notNull(),
      planType: text("plan_type").notNull(),
      // 'free', 'premium_monthly', 'premium_yearly'
      status: text("status").notNull(),
      // 'active', 'cancelled', 'expired', 'pending'
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date"),
      autoRenew: boolean("auto_renew").default(true),
      stripeSubscriptionId: text("stripe_subscription_id"),
      stripeCustomerId: text("stripe_customer_id"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    adminLogs = pgTable("admin_logs", {
      id: serial("id").primaryKey(),
      adminId: integer("admin_id").references(() => admins.id).notNull(),
      action: text("action").notNull(),
      // 'user_created', 'coupon_generated', 'story_approved', etc.
      targetType: text("target_type"),
      // 'user', 'story', 'coupon', etc.
      targetId: integer("target_id"),
      details: jsonb("details"),
      // Additional context
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      email: true,
      password: true,
      googleId: true,
      profileImageUrl: true,
      babyName: true,
      babyDueDate: true,
      relationship: true,
      timezone: true,
      language: true
    }).extend({
      babyDueDate: z.string().optional().transform((val) => val ? new Date(val) : void 0)
    });
    insertStorySchema = createInsertSchema(stories).pick({
      uniqueId: true,
      titleKo: true,
      titleEn: true,
      contentKo: true,
      contentEn: true,
      excerptKo: true,
      excerptEn: true,
      imageUrl: true,
      readingTime: true,
      tagsKo: true,
      tagsEn: true,
      isDaily: true,
      isCreated: true,
      status: true,
      creatorId: true,
      createdAt: true
    });
    insertReadingProgressSchema = createInsertSchema(readingProgress).pick({
      userId: true,
      storyId: true,
      isRead: true,
      isFavorite: true
    });
    insertReadingDateSchema = createInsertSchema(readingDates).pick({
      userId: true,
      storyId: true,
      readDate: true
    });
    insertApiUsageSchema = createInsertSchema(apiUsage).pick({
      provider: true,
      operation: true,
      model: true,
      cost: true,
      metadata: true
    });
    insertAdminSchema = createInsertSchema(admins).pick({
      userId: true,
      role: true,
      permissions: true,
      createdBy: true
    });
    insertCouponSchema = createInsertSchema(coupons).pick({
      name: true,
      description: true,
      discountType: true,
      discountValue: true,
      duration: true,
      upgradeType: true,
      planDuration: true,
      planExpiryDate: true,
      maxUses: true,
      validFrom: true,
      validUntil: true,
      isActive: true,
      createdBy: true
    }).extend({
      discountType: z.string().default("upgrade"),
      discountValue: z.string().default("100"),
      // 100% discount for plan upgrade
      duration: z.string().default("1_month"),
      planExpiryDate: z.string().optional().transform((val) => {
        if (!val || val.trim() === "") {
          return null;
        }
        return new Date(val);
      }),
      validFrom: z.string().transform((val) => {
        if (!val || val.trim() === "") {
          return /* @__PURE__ */ new Date();
        }
        return new Date(val);
      }),
      validUntil: z.string().transform((val) => {
        if (!val || val.trim() === "") {
          const tomorrow = /* @__PURE__ */ new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        }
        return new Date(val);
      })
    });
    insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
      userId: true,
      planType: true,
      status: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true
    }).extend({
      startDate: z.string().transform((val) => new Date(val)),
      endDate: z.string().optional().transform((val) => val ? new Date(val) : void 0)
    });
    insertAdminLogSchema = createInsertSchema(adminLogs).pick({
      adminId: true,
      action: true,
      targetType: true,
      targetId: true,
      details: true,
      ipAddress: true,
      userAgent: true
    });
  }
});

// ../server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pgClient: () => pgClient
});
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var client, db, pgClient;
var init_db = __esm({
  "../server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    client = postgres(process.env.DATABASE_URL, {
      // Core connection settings (high-concurrency)
      max: 50,
      // Increased to 50 for 20 concurrent stories
      min: 3,
      // Slightly higher minimum
      idle_timeout: 60,
      // 1 minute timeout (was 30s)
      connect_timeout: 30,
      // Connection timeout
      max_lifetime: 20 * 60,
      // 20min lifetime
      // Performance optimization
      prepare: true,
      // Prepared statements
      transform: postgres.camel,
      // camelCase transform
      fetch_types: false,
      // Skip type fetching
      debug: process.env.NODE_ENV === "development",
      // Debug only in dev
      // Connection reliability
      retry: 3,
      // Retry attempts
      max_backoff: 1e3,
      // Max backoff time
      backoff: (attemptNum) => Math.min(attemptNum * 100, 1e3),
      // Progressive backoff
      // Supabase optimizations
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      keepalive: true,
      // Keep connections alive
      keepalive_idle: 600,
      // 10min keepalive
      // Error handling
      onnotify: () => {
      },
      // NOTIFY/LISTEN handler
      onparameter: () => {
      }
      // Parameter change handler
    });
    db = drizzle(client, { schema: schema_exports });
    pgClient = client;
    if (process.env.NODE_ENV === "development") {
      console.log("\u{1F517} PostgreSQL connection pool initialized:", {
        max: client.options.max,
        min: client.options.min,
        idle_timeout: client.options.idle_timeout,
        connect_timeout: client.options.connect_timeout,
        ssl: !!client.options.ssl
      });
    }
  }
});

// ../shared/legacy-story.ts
function convertToLegacyStory(story, language = "ko") {
  const databaseId = typeof story.id === "string" ? parseInt(story.id) : story.id;
  const supabaseUrl = "https://pcnfcirqviujhynufafr.supabase.co";
  let imageUrl = null;
  if (story.imageUrl) {
    if (story.imageUrl.startsWith("https://")) {
      imageUrl = story.imageUrl;
    } else if (story.imageUrl.startsWith("images/")) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/${story.imageUrl}`;
    } else {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/images/${story.imageUrl}`;
    }
  }
  const jisuAudioUrl = story.jisuAudioUrl ? `${supabaseUrl}/storage/v1/object/public/${story.jisuAudioUrl}` : null;
  const emmaAudioUrl = story.emmaAudioUrl ? `${supabaseUrl}/storage/v1/object/public/${story.emmaAudioUrl}` : null;
  return {
    id: databaseId,
    // Use database id as number for all operations
    storyUuid: story.storyUuid,
    // NEW: Include UUID for secure story access
    title: (language === "ko" ? story.titleKo : story.titleEn) || story.titleKo || story.titleEn || "",
    content: (language === "ko" ? story.contentKo : story.contentEn) || story.contentKo || story.contentEn || "",
    summary: (language === "ko" ? story.excerptKo : story.excerptEn) || story.excerptKo || story.excerptEn || "",
    imageUrl,
    readingTime: story.readingTime || 5,
    tags: (() => {
      const tagsString = (language === "ko" ? story.tagsKo : story.tagsEn) || story.tagsKo || story.tagsEn;
      if (!tagsString) return null;
      if (Array.isArray(tagsString)) return tagsString;
      if (typeof tagsString === "string") {
        try {
          const parsed = JSON.parse(tagsString);
          return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
          return [tagsString];
        }
      }
      return null;
    })(),
    type: story.isCreated ? "uct" : "tft",
    publishedDate: story.createdAt,
    createdAt: story.createdAt,
    createdBy: story.creatorId ? parseInt(story.creatorId) : null,
    jisuAudioUrl,
    emmaAudioUrl,
    readAt: story.readAt || null,
    // 읽은 날짜 정보 포함
    firstReadAt: story.firstReadAt || null
    // 처음 읽은 날짜 정보 포함
  };
}
var init_legacy_story = __esm({
  "../shared/legacy-story.ts"() {
    "use strict";
  }
});

// ../shared/language.ts
var DEFAULT_LANGUAGE;
var init_language = __esm({
  "../shared/language.ts"() {
    "use strict";
    DEFAULT_LANGUAGE = "en";
  }
});

// ../server/cache.ts
import { LRUCache } from "lru-cache";
var PerformanceCache, performanceCache;
var init_cache = __esm({
  "../server/cache.ts"() {
    "use strict";
    PerformanceCache = class {
      todaysStoriesCache;
      userStatsCache;
      recentlyReadCache;
      storyCache;
      userCache;
      allDailyStoriesCache;
      readStoryIdsCache;
      // Cache durations (in milliseconds) - optimized for speed and security balance
      TODAY_STORIES_TTL = 30 * 1e3;
      // 30 seconds - ultra fast refresh
      USER_STATS_TTL = 10 * 60 * 1e3;
      // 10 minutes - reasonable cache
      RECENTLY_READ_TTL = 5 * 60 * 1e3;
      // 5 minutes - faster updates for security
      STORY_TTL = 15 * 60 * 1e3;
      // 15 minutes - moderate cache
      USER_TTL = 15 * 60 * 1e3;
      // 15 minutes - moderate cache for user data
      ALL_STORIES_TTL = 60 * 60 * 1e3;
      // 1 hour - daily stories don't change often
      READ_STORY_IDS_TTL = 5 * 60 * 1e3;
      // 5 minutes - reading progress changes
      constructor() {
        this.todaysStoriesCache = new LRUCache({
          max: 2e3,
          // Support 2000 unique daily story requests
          ttl: this.TODAY_STORIES_TTL,
          updateAgeOnGet: true,
          // Keep frequently accessed items fresh
          allowStale: true
          // Serve stale content while refreshing
        });
        this.userStatsCache = new LRUCache({
          max: 1e3,
          // Cache stats for 1000 active users
          ttl: this.USER_STATS_TTL,
          updateAgeOnGet: true,
          allowStale: true
        });
        this.recentlyReadCache = new LRUCache({
          max: 1e3,
          // Cache recently read for 1000 users
          ttl: this.RECENTLY_READ_TTL,
          updateAgeOnGet: true,
          allowStale: true
        });
        this.storyCache = new LRUCache({
          max: 500,
          // Cache 500 most accessed stories
          ttl: this.STORY_TTL,
          updateAgeOnGet: true,
          allowStale: true
        });
        this.userCache = new LRUCache({
          max: 1e3,
          // Cache 1000 user profiles
          ttl: this.USER_TTL,
          updateAgeOnGet: true,
          allowStale: true
        });
        this.allDailyStoriesCache = new LRUCache({
          max: 10,
          // Very small cache - global daily stories
          ttl: this.ALL_STORIES_TTL,
          updateAgeOnGet: true,
          allowStale: true
        });
        this.readStoryIdsCache = new LRUCache({
          max: 1e3,
          // Cache read story IDs for 1000 users
          ttl: this.READ_STORY_IDS_TTL,
          updateAgeOnGet: true,
          allowStale: true
        });
      }
      // Today's stories cache
      getTodaysStories(key) {
        const cached = this.todaysStoriesCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.TODAY_STORIES_TTL) {
          return cached.stories;
        }
        return null;
      }
      setTodaysStories(key, stories3) {
        this.todaysStoriesCache.set(key, { stories: stories3, timestamp: Date.now() });
      }
      // User stats cache
      getUserStats(key) {
        const cached = this.userStatsCache.get(key);
        if (cached) {
          const ttl = cached.customTtl || this.USER_STATS_TTL;
          if (Date.now() - cached.timestamp < ttl) {
            return cached.stats;
          }
        }
        return null;
      }
      setUserStats(key, stats) {
        const ttl = key.includes("themes") ? 30 * 60 * 1e3 : 5 * 60 * 1e3;
        const timestamp2 = Date.now();
        this.userStatsCache.set(key, { stats, timestamp: timestamp2, customTtl: ttl });
      }
      // Recently read cache
      getRecentlyRead(key) {
        const cached = this.recentlyReadCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.RECENTLY_READ_TTL) {
          return cached.stories;
        }
        return null;
      }
      setRecentlyRead(key, stories3) {
        this.recentlyReadCache.set(key, { stories: stories3, timestamp: Date.now() });
      }
      // Clear recently read cache for a specific user
      clearRecentlyRead(userId) {
        const keys = Array.from(this.recentlyReadCache.keys());
        const userPattern = `recently:${userId}_`;
        keys.forEach((key) => {
          if (key.startsWith(userPattern)) {
            this.recentlyReadCache.delete(key);
            console.log(`Cleared recently read cache key: ${key}`);
          }
        });
      }
      // Individual story cache
      getStory(key) {
        return this.storyCache.get(key) || null;
      }
      setStory(key, story) {
        this.storyCache.set(key, story);
      }
      // User cache
      getUser(key) {
        return this.userCache.get(key) || null;
      }
      setUser(key, user) {
        this.userCache.set(key, user);
      }
      // All daily stories cache (global)
      getAllDailyStories(key) {
        const cached = this.allDailyStoriesCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.ALL_STORIES_TTL) {
          return cached.stories;
        }
        return null;
      }
      setAllDailyStories(key, stories3) {
        this.allDailyStoriesCache.set(key, { stories: stories3, timestamp: Date.now() });
      }
      // Read story IDs cache
      getReadStoryIds(key) {
        const cached = this.readStoryIdsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.READ_STORY_IDS_TTL) {
          return cached.ids;
        }
        return null;
      }
      setReadStoryIds(key, ids) {
        this.readStoryIdsCache.set(key, { ids, timestamp: Date.now() });
      }
      // Clear read story IDs cache for a specific user
      clearReadStoryIds(userId) {
        const key = `read-stories-${userId}`;
        this.readStoryIdsCache.delete(key);
        console.log(`Cleared read story IDs cache for user ${userId}`);
      }
      // Clear today's stories cache for a specific user
      clearTodaysStories(userId) {
        const keys = Array.from(this.todaysStoriesCache.keys());
        const userPattern = `${userId}-`;
        keys.forEach((key) => {
          if (key.startsWith(userPattern)) {
            this.todaysStoriesCache.delete(key);
            console.log(`Cleared today's stories cache key: ${key}`);
          }
        });
      }
      // Cache invalidation methods
      invalidateUserCache(userId) {
        this.userCache.delete(`user:${userId}`);
        this.userStatsCache.delete(`stats:${userId}`);
        this.recentlyReadCache.delete(`recently:${userId}`);
        this.readStoryIdsCache.delete(`read-stories-${userId}`);
      }
      invalidateStoryCache(storyId) {
        this.storyCache.delete(`story:${storyId}`);
      }
      // Cache statistics for monitoring (simplified for production safety)
      getCacheStats() {
        return {
          todaysStories: {
            size: this.todaysStoriesCache.size,
            maxSize: this.todaysStoriesCache.max || 2e3,
            ttl: this.TODAY_STORIES_TTL
          },
          userStats: {
            size: this.userStatsCache.size,
            maxSize: this.userStatsCache.max || 1e3,
            ttl: this.USER_STATS_TTL
          },
          recentlyRead: {
            size: this.recentlyReadCache.size,
            maxSize: this.recentlyReadCache.max || 1e3,
            ttl: this.RECENTLY_READ_TTL
          },
          stories: {
            size: this.storyCache.size,
            maxSize: this.storyCache.max || 500,
            ttl: this.STORY_TTL
          },
          users: {
            size: this.userCache.size,
            maxSize: this.userCache.max || 1e3,
            ttl: this.USER_TTL
          }
        };
      }
      // Clear all caches (for debugging/maintenance)
      clearAll() {
        this.todaysStoriesCache.clear();
        this.userStatsCache.clear();
        this.recentlyReadCache.clear();
        this.storyCache.clear();
        this.userCache.clear();
        this.allDailyStoriesCache.clear();
        this.readStoryIdsCache.clear();
      }
    };
    performanceCache = new PerformanceCache();
  }
});

// ../server/storage.ts
import { eq, and, desc, sql, gte, lt, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
var DatabaseStorage, storage;
var init_storage = __esm({
  "../server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_legacy_story();
    init_language();
    init_cache();
    DatabaseStorage = class {
      language = DEFAULT_LANGUAGE;
      async getUser(id) {
        try {
          const cacheKey = `user:${id}`;
          const cached = performanceCache.getUser(cacheKey);
          if (cached) {
            return cached;
          }
          const [user] = await db.select().from(users).where(eq(users.id, id));
          if (!user) {
            return void 0;
          }
          const [activeSubscription] = await db.select().from(subscriptions).where(
            and(
              eq(subscriptions.userId, id),
              eq(subscriptions.status, "active")
            )
          ).limit(1);
          const userWithSubscription = {
            ...user,
            subscriptionPlan: activeSubscription?.planType === "prena_plan" ? "prena" : "free",
            subscriptionEndDate: activeSubscription?.endDate || null,
            subscriptionStatus: activeSubscription?.status || null
          };
          performanceCache.setUser(cacheKey, userWithSubscription);
          return userWithSubscription;
        } catch (error) {
          console.error("Database error in getUser:", error);
          return void 0;
        }
      }
      async getUserByUsername(username) {
        try {
          const [user] = await db.select().from(users).where(eq(users.username, username));
          return user || void 0;
        } catch (error) {
          console.error("Database error in getUserByUsername:", error);
          return void 0;
        }
      }
      async getUserByEmail(email) {
        try {
          const [user] = await db.select().from(users).where(eq(users.email, email));
          return user || void 0;
        } catch (error) {
          console.error("Database error in getUserByEmail:", error);
          return void 0;
        }
      }
      async updateUserPassword(id, newPassword) {
        try {
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
          const [updatedUser] = await db.update(users).set({
            password: hashedPassword
          }).where(eq(users.id, id)).returning();
          if (!updatedUser) {
            throw new Error(`User with id ${id} not found`);
          }
          performanceCache.invalidateUserCache(id);
        } catch (error) {
          console.error("Database error in updateUserPassword:", error);
          throw error;
        }
      }
      async verifyPassword(userId, password) {
        try {
          const [user] = await db.select().from(users).where(eq(users.id, userId));
          if (!user || !user.password) {
            return false;
          }
          return await bcrypt.compare(password, user.password);
        } catch (error) {
          console.error("Database error in verifyPassword:", error);
          return false;
        }
      }
      async deleteUser(id) {
        try {
          await db.delete(users).where(eq(users.id, id));
        } catch (error) {
          console.error("Database error in deleteUser:", error);
          throw error;
        }
      }
      async getUserByGoogleId(googleId) {
        try {
          const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
          return user || void 0;
        } catch (error) {
          console.error("Database error in getUserByGoogleId:", error);
          return void 0;
        }
      }
      async createUser(insertUser) {
        try {
          let userToInsert = { ...insertUser };
          if (insertUser.password) {
            const saltRounds = 12;
            userToInsert.password = await bcrypt.hash(insertUser.password, saltRounds);
          }
          const [user] = await db.insert(users).values(userToInsert).returning();
          return user;
        } catch (error) {
          console.error("Database error in createUser:", error);
          throw error;
        }
      }
      async updateUser(id, updates) {
        try {
          const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
          performanceCache.invalidateUserCache(id);
          return user;
        } catch (error) {
          console.error("Database error in updateUser:", error);
          throw error;
        }
      }
      // Legacy cache properties removed - now using performanceCache
      async getTodaysStories(userId, browserLanguage, timezone) {
        try {
          let todayDate = /* @__PURE__ */ new Date();
          let userTimezone = timezone;
          if (userId && !userTimezone) {
            const user = await this.getUser(userId);
            userTimezone = user?.timezone || "Asia/Seoul";
          }
          if (userTimezone) {
            todayDate = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: userTimezone }));
          }
          const today = todayDate.toISOString().split("T")[0];
          const cacheKey = `${userId || "anon"}-${browserLanguage || "en"}-${today}`;
          const cached = performanceCache.getTodaysStories(cacheKey);
          if (cached) {
            return cached;
          }
          let userLanguage = DEFAULT_LANGUAGE;
          if (userId) {
            const user = await this.getUser(userId);
            userLanguage = user?.language || DEFAULT_LANGUAGE;
          } else if (browserLanguage?.startsWith("ko")) {
            userLanguage = "ko";
          }
          const allStoriesCacheKey = "all-daily-stories";
          let allStories = performanceCache.getAllDailyStories(allStoriesCacheKey);
          if (!allStories) {
            allStories = await db.select({
              id: stories.id,
              storyUuid: stories.storyUuid,
              // CRITICAL: Include UUID for secure routing
              uniqueId: stories.uniqueId,
              titleKo: stories.titleKo,
              titleEn: stories.titleEn,
              contentKo: stories.contentKo,
              contentEn: stories.contentEn,
              excerptKo: stories.excerptKo,
              excerptEn: stories.excerptEn,
              tagsKo: stories.tagsKo,
              tagsEn: stories.tagsEn,
              imageUrl: stories.imageUrl,
              readingTime: stories.readingTime,
              jisuAudioUrl: stories.jisuAudioUrl,
              eunwooAudioUrl: stories.eunwooAudioUrl,
              emmaAudioUrl: stories.emmaAudioUrl,
              noahAudioUrl: stories.noahAudioUrl
            }).from(stories).where(and(
              eq(stories.isDaily, true),
              eq(stories.status, "active")
            ));
            performanceCache.setAllDailyStories(allStoriesCacheKey, allStories);
          }
          const seed = this.createDateSeed(today, userId || 0);
          let selectedStories = [];
          if (userId) {
            const shuffled = this.shuffleWithSeed([...allStories], seed);
            selectedStories = shuffled.slice(0, 2);
            const relevantStoryIds = selectedStories.map((s) => s.id);
            const allUserProgress = await db.select().from(readingProgress).where(and(
              eq(readingProgress.userId, userId),
              inArray(readingProgress.storyId, relevantStoryIds)
            ));
            const progressMap = new Map(allUserProgress.map((p) => [p.storyId, p]));
            const storiesResult = selectedStories.map((story) => {
              const legacyStory = convertToLegacyStory(story, userLanguage);
              const progress = progressMap.get(story.id);
              legacyStory.isFavorite = progress ? progress.isFavorite : false;
              return legacyStory;
            });
            performanceCache.setTodaysStories(cacheKey, storiesResult);
            return storiesResult;
          } else {
            const shuffled = this.shuffleWithSeed([...allStories], seed);
            selectedStories = shuffled.slice(0, 2);
            const anonResult = selectedStories.map((story) => convertToLegacyStory(story, userLanguage));
            performanceCache.setTodaysStories(cacheKey, anonResult);
            return anonResult;
          }
        } catch (error) {
          console.error("Database error in getTodaysStories:", error);
          return [];
        }
      }
      // Legacy cleanup method removed - now handled by performanceCache LRU system
      // 날짜와 사용자 ID를 조합하여 시드 생성
      createDateSeed(dateString, userId) {
        const dateNum = parseInt(dateString.replace(/-/g, ""));
        const seed = dateNum + userId;
        return seed;
      }
      // 시드 기반 Fisher-Yates 셔플
      shuffleWithSeed(array, seed) {
        const shuffled = [...array];
        let currentIndex = shuffled.length;
        class SeededRandom {
          seed;
          constructor(seed2) {
            this.seed = seed2 % 2147483647;
            if (this.seed <= 0) this.seed += 2147483646;
          }
          next() {
            this.seed = this.seed * 16807 % 2147483647;
            return this.seed;
          }
          nextFloat() {
            return (this.next() - 1) / 2147483646;
          }
        }
        const rng = new SeededRandom(seed);
        while (currentIndex !== 0) {
          const randomIndex = Math.floor(rng.nextFloat() * currentIndex);
          currentIndex--;
          [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
        }
        return shuffled;
      }
      async getStoryById(databaseId, userId) {
        try {
          const [story] = await db.select().from(stories).where(eq(stories.id, databaseId));
          if (!story) return void 0;
          let displayLanguage = DEFAULT_LANGUAGE;
          if (story.isCreated) {
            displayLanguage = story.titleKo ? "ko" : "en";
          } else if (userId) {
            const user = await this.getUser(userId);
            displayLanguage = user?.language || DEFAULT_LANGUAGE;
          }
          const legacyStory = convertToLegacyStory(story, displayLanguage);
          if (userId) {
            const [progress] = await db.select().from(readingProgress).where(and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.storyId, databaseId)
            ));
            legacyStory.isFavorite = progress ? progress.isFavorite : false;
            legacyStory.readAt = progress ? progress.readAt : null;
            legacyStory.providedAt = progress ? progress.readAt : null;
          }
          return legacyStory;
        } catch (error) {
          console.error("Database error in getStoryById:", error);
          return void 0;
        }
      }
      // NEW: Get story by UUID with progress information
      async getStoryByUuidWithProgress(userId, uuid2) {
        try {
          const storyResult = await db.select().from(stories).where(eq(stories.storyUuid, uuid2));
          if (storyResult.length === 0) {
            return { story: null, progress: null };
          }
          const story = storyResult[0];
          let progress = null;
          if (userId) {
            const progressResult = await db.select().from(readingProgress).where(and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.storyId, story.id)
            ));
            progress = progressResult[0] || null;
          }
          return { story, progress };
        } catch (error) {
          console.error("Database error in getStoryByUuidWithProgress:", error);
          return { story: null, progress: null };
        }
      }
      // Add missing getStoryByUuid method for interface compliance
      async getStoryByUuid(uuid2) {
        try {
          const [story] = await db.select().from(stories).where(eq(stories.storyUuid, uuid2));
          if (!story) return void 0;
          let displayLanguage = DEFAULT_LANGUAGE;
          if (story.isCreated) {
            displayLanguage = story.titleKo ? "ko" : "en";
          }
          return convertToLegacyStory(story, displayLanguage);
        } catch (error) {
          console.error("Database error in getStoryByUuid:", error);
          return void 0;
        }
      }
      // NEW: Get user language preference
      async getUserLanguage(userId) {
        if (!userId) return DEFAULT_LANGUAGE;
        try {
          const user = await this.getUser(userId);
          return user?.language || DEFAULT_LANGUAGE;
        } catch (error) {
          console.error("Database error in getUserLanguage:", error);
          return DEFAULT_LANGUAGE;
        }
      }
      async createStory(insertStory) {
        try {
          let storyData = {
            ...insertStory,
            createdAt: insertStory.createdAt || /* @__PURE__ */ new Date()
          };
          if (insertStory.isCreated) {
            const [uctCount] = await db.select({ count: sql`COUNT(*)` }).from(stories).where(eq(stories.isCreated, true));
            const nextUctId = 1001 + (uctCount?.count || 0);
            storyData = { ...storyData, id: nextUctId };
          }
          console.log("Creating story with data:", JSON.stringify(storyData, null, 2));
          const [story] = await db.insert(stories).values(storyData).returning();
          console.log("Story created successfully:", JSON.stringify(story, null, 2));
          return convertToLegacyStory(story, this.language);
        } catch (error) {
          console.error("Database error in createStory:", error);
          throw error;
        }
      }
      async getUserReadingProgress(userId) {
        try {
          const progressList = await db.select().from(readingProgress).where(eq(readingProgress.userId, userId));
          return progressList;
        } catch (error) {
          console.error("Database error in getUserReadingProgress:", error);
          return [];
        }
      }
      async getRecentlyReadStories(userId, limit = 10, language) {
        try {
          console.log(`Fetching recently read stories for user ${userId}`);
          const cacheKey = `recently:${userId}_${limit}_${language || "default"}`;
          try {
            const cached = performanceCache.getRecentlyRead(cacheKey);
            if (cached) {
              console.log(`Cache hit for recently read stories for user ${userId}`);
              return cached;
            }
          } catch (cacheError) {
            console.warn("Cache error in getRecentlyReadStories, proceeding with database query:", cacheError);
          }
          if (!language) {
            const userCacheKey = `user:${userId}`;
            let user = performanceCache.getUser(userCacheKey);
            if (!user) {
              [user] = await db.select().from(users).where(eq(users.id, userId));
              if (user) {
                performanceCache.setUser(userCacheKey, user);
              }
            }
            language = user?.language || "en";
          }
          const progressWithStories = await db.select({
            id: readingProgress.id,
            userId: readingProgress.userId,
            storyId: readingProgress.storyId,
            readAt: readingProgress.readAt,
            firstReadAt: readingProgress.firstReadAt,
            isRead: readingProgress.isRead,
            isFavorite: readingProgress.isFavorite,
            // Select only needed story fields for faster query
            storyId_db: stories.id,
            storyUuid: stories.storyUuid,
            // CRITICAL: Include UUID for secure routing
            uniqueId: stories.uniqueId,
            titleKo: stories.titleKo,
            titleEn: stories.titleEn,
            contentKo: stories.contentKo,
            contentEn: stories.contentEn,
            excerptKo: stories.excerptKo,
            excerptEn: stories.excerptEn,
            tagsKo: stories.tagsKo,
            tagsEn: stories.tagsEn,
            isCreated: stories.isCreated,
            imageUrl: stories.imageUrl
          }).from(readingProgress).innerJoin(stories, eq(readingProgress.storyId, stories.id)).where(and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.isRead, true)
          )).orderBy(desc(readingProgress.readAt)).limit(limit);
          console.log(`Found ${progressWithStories.length} actually read stories for user ${userId}`);
          const result = progressWithStories.map((row) => {
            const displayLanguage = row.isCreated ? row.titleKo ? "ko" : "en" : language;
            const storyData = {
              id: row.storyId_db,
              storyUuid: row.storyUuid,
              // CRITICAL: Include UUID for secure routing
              uniqueId: row.uniqueId,
              titleKo: row.titleKo,
              titleEn: row.titleEn,
              contentKo: row.contentKo,
              contentEn: row.contentEn,
              excerptKo: row.excerptKo,
              excerptEn: row.excerptEn,
              tagsKo: row.tagsKo,
              tagsEn: row.tagsEn,
              isCreated: row.isCreated,
              imageUrl: row.imageUrl,
              readAt: row.readAt,
              // 읽은 날짜 정보 전달
              firstReadAt: row.firstReadAt,
              // 처음 읽은 날짜 정보 전달
              createdAt: /* @__PURE__ */ new Date(),
              // 기본값 설정
              readingTime: 5,
              // 기본값 설정
              status: "active",
              // 기본값 설정
              creatorId: null
              // 기본값 설정
            };
            return {
              id: row.id,
              userId: row.userId,
              storyId: row.storyId,
              readAt: row.readAt,
              firstReadAt: row.firstReadAt,
              isRead: row.isRead,
              isFavorite: row.isFavorite,
              story: convertToLegacyStory(storyData, displayLanguage)
            };
          });
          try {
            performanceCache.setRecentlyRead(cacheKey, result);
            console.log(`Cached recently read stories with key: ${cacheKey}`);
          } catch (cacheError) {
            console.warn("Cache error in setRecentlyRead:", cacheError);
          }
          return result;
        } catch (error) {
          console.error("Database error in getRecentlyReadStories:", error);
          return [];
        }
      }
      async markStoryAsRead(insertProgress) {
        try {
          const [progress] = await db.insert(readingProgress).values({
            userId: insertProgress.userId,
            storyId: insertProgress.storyId,
            isRead: true,
            readAt: /* @__PURE__ */ new Date(),
            firstReadAt: /* @__PURE__ */ new Date(),
            // 처음 읽는 경우 firstReadAt 설정
            isFavorite: false
          }).onConflictDoUpdate({
            target: [readingProgress.userId, readingProgress.storyId],
            set: {
              isRead: true,
              readAt: /* @__PURE__ */ new Date()
              // Always update readAt to current time for Recently read ordering
              // firstReadAt은 업데이트하지 않음 (처음 읽은 날짜 유지)
            }
          }).returning();
          const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          await db.insert(readingDates).values({
            userId: insertProgress.userId,
            storyId: insertProgress.storyId,
            readDate: today
          }).onConflictDoNothing();
          console.log("Story marked as read successfully:", progress);
          console.log(`Invalidating caches for user ${insertProgress.userId}`);
          performanceCache.invalidateUserCache(insertProgress.userId);
          performanceCache.clearRecentlyRead(insertProgress.userId);
          performanceCache.clearReadStoryIds(insertProgress.userId);
          return progress;
        } catch (error) {
          console.error("Database error in markStoryAsRead:", error);
          throw error;
        }
      }
      async toggleFavorite(userId, storyId) {
        try {
          const [result] = await db.insert(readingProgress).values({
            userId,
            storyId,
            isRead: false,
            isFavorite: true,
            readAt: null
          }).onConflictDoUpdate({
            target: [readingProgress.userId, readingProgress.storyId],
            set: {
              isFavorite: sql`NOT ${readingProgress.isFavorite}`
              // Toggle the current value
            }
          }).returning();
          performanceCache.clearRecentlyRead(userId);
          return result;
        } catch (error) {
          console.error("Database error in toggleFavorite:", error);
          throw error;
        }
      }
      async getWeeklyReadingDates(userId) {
        try {
          const oneWeekAgo = /* @__PURE__ */ new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const result = await db.select({
            date: readingDates.readDate
          }).from(readingDates).where(and(
            eq(readingDates.userId, userId),
            gte(readingDates.readDate, oneWeekAgo.toISOString().split("T")[0])
          )).groupBy(readingDates.readDate).orderBy(desc(readingDates.readDate));
          return result.map((row) => new Date(row.date));
        } catch (error) {
          console.error("Database error in getWeeklyReadingDates:", error);
          return [];
        }
      }
      async getAllReadingDates(userId) {
        try {
          const result = await db.select({
            date: readingDates.readDate
          }).from(readingDates).where(eq(readingDates.userId, userId)).groupBy(readingDates.readDate).orderBy(desc(readingDates.readDate));
          return result.map((row) => new Date(row.date));
        } catch (error) {
          console.error("Database error in getAllReadingDates:", error);
          return [];
        }
      }
      async getLibraryStories(userId, filter, page = 1, limit = 20, language) {
        try {
          console.log(`Getting library stories for user ${userId}, filter: ${filter}, page: ${page}, limit: ${limit}`);
          if (!language) {
            const user = await this.getUser(userId);
            language = user?.language || "en";
          }
          const offset = (page - 1) * limit;
          const userProgress = await db.select().from(readingProgress).where(eq(readingProgress.userId, userId));
          const progressMap = new Map(
            userProgress.map((p) => [p.storyId, p])
          );
          const addFavoriteStatus = (story) => {
            const displayLanguage = story.isCreated ? story.titleKo ? "ko" : "en" : language;
            const legacyStory = convertToLegacyStory(story, displayLanguage);
            const storyIdNum = parseInt(story.id);
            const progress = progressMap.get(storyIdNum);
            legacyStory.isFavorite = progress ? progress.isFavorite : false;
            return legacyStory;
          };
          if (filter === "favorites") {
            const favoriteProgress = userProgress.filter((p) => p.isFavorite);
            if (favoriteProgress.length === 0) return { stories: [], hasMore: false, total: 0 };
            const favoriteStoryIds = favoriteProgress.map((p) => p.storyId);
            const favoriteStories = await db.select().from(stories).where(and(
              inArray(stories.id, favoriteStoryIds),
              eq(stories.status, "active")
            ));
            const favoriteProgressWithStories = favoriteStories.map((story) => {
              const progress = favoriteProgress.find((p) => p.storyId === story.id);
              return progress ? { ...story, readAt: progress.readAt } : null;
            }).filter(Boolean);
            const validStories = favoriteProgressWithStories.filter((story) => story !== null).sort((a, b) => {
              if (!b.readAt || !a.readAt) return 0;
              return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
            });
            const total = validStories.length;
            const paginatedStories = validStories.slice(offset, offset + limit);
            const hasMore = offset + limit < total;
            return {
              stories: paginatedStories.map(addFavoriteStatus),
              hasMore,
              total
            };
          } else if (filter === "created") {
            const allCreatedStories = await db.select().from(stories).where(and(
              eq(stories.isCreated, true),
              eq(stories.creatorId, userId.toString()),
              eq(stories.status, "active")
            )).orderBy(desc(stories.createdAt));
            const total = allCreatedStories.length;
            const paginatedStories = allCreatedStories.slice(offset, offset + limit);
            const hasMore = offset + limit < total;
            return {
              stories: paginatedStories.map(addFavoriteStatus),
              hasMore,
              total
            };
          } else if (filter === "today") {
            const readProgress = userProgress.filter((p) => p.isRead);
            if (readProgress.length === 0) return { stories: [], hasMore: false, total: 0 };
            const readProgressWithStories = await Promise.all(
              readProgress.map(async (progress) => {
                const [story] = await db.select().from(stories).where(and(
                  eq(stories.id, progress.storyId),
                  eq(stories.isDaily, true),
                  eq(stories.status, "active")
                ));
                return story ? { ...story, readAt: progress.readAt } : null;
              })
            );
            const validStories = readProgressWithStories.filter((story) => story !== null).sort((a, b) => {
              if (!b.readAt || !a.readAt) return 0;
              return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
            });
            const total = validStories.length;
            const paginatedStories = validStories.slice(offset, offset + limit);
            const hasMore = offset + limit < total;
            return {
              stories: paginatedStories.map(addFavoriteStatus),
              hasMore,
              total
            };
          } else {
            const [readDailyStoriesWithDate, createdStories] = await Promise.all([
              // Read daily stories with their readAt dates
              (async () => {
                const readProgress = await db.select().from(readingProgress).where(and(
                  eq(readingProgress.userId, userId),
                  eq(readingProgress.isRead, true)
                ));
                if (readProgress.length === 0) return [];
                const readDailyStories = await db.select().from(stories).where(and(
                  inArray(stories.id, readProgress.map((p) => p.storyId)),
                  eq(stories.isDaily, true),
                  eq(stories.status, "active")
                ));
                return readDailyStories.map((story) => {
                  const progress = readProgress.find((p) => p.storyId === story.id);
                  const result = progress ? { ...story, readAt: progress.readAt } : null;
                  if (result && progress) {
                    console.log(`Story ${story.id} readAt: ${progress.readAt}`);
                  }
                  return result;
                }).filter(Boolean);
              })(),
              // Created stories
              db.select().from(stories).where(and(
                eq(stories.isCreated, true),
                eq(stories.creatorId, userId.toString()),
                eq(stories.status, "active")
              )).orderBy(desc(stories.createdAt))
            ]);
            const validReadStories = readDailyStoriesWithDate.filter((story) => story !== null);
            const createdStoriesWithDate = createdStories.map((story) => ({
              ...story,
              readAt: story.createdAt
            }));
            const combinedStories = [...validReadStories, ...createdStoriesWithDate];
            combinedStories.sort((a, b) => {
              if (!b.readAt || !a.readAt) return 0;
              return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
            });
            const total = combinedStories.length;
            const paginatedStories = combinedStories.slice(offset, offset + limit);
            const hasMore = offset + limit < total;
            return {
              stories: paginatedStories.map((story) => {
                const displayLanguage = story.isCreated ? story.titleKo ? "ko" : "en" : language;
                const legacyStory = convertToLegacyStory(story, displayLanguage);
                const storyIdNum = parseInt(story.id.toString());
                const progress = progressMap.get(storyIdNum);
                legacyStory.isFavorite = progress ? progress.isFavorite : false;
                legacyStory.readAt = story.readAt;
                return legacyStory;
              }),
              hasMore,
              total
            };
          }
        } catch (error) {
          console.error("Database error in getLibraryStories:", error);
          return { stories: [], hasMore: false, total: 0 };
        }
      }
      // NEW: UUID-based story retrieval with simplified access control
      async getStoryByUuidSimple(storyUuid, userId, language) {
        try {
          const [story] = await db.select({
            id: stories.id,
            storyUuid: stories.storyUuid,
            uniqueId: stories.uniqueId,
            titleKo: stories.titleKo,
            titleEn: stories.titleEn,
            contentKo: stories.contentKo,
            contentEn: stories.contentEn,
            excerptKo: stories.excerptKo,
            excerptEn: stories.excerptEn,
            tagsKo: stories.tagsKo,
            tagsEn: stories.tagsEn,
            imageUrl: stories.imageUrl,
            readingTime: stories.readingTime,
            isCreated: stories.isCreated,
            status: stories.status,
            creatorId: stories.creatorId,
            jisuAudioUrl: stories.jisuAudioUrl,
            eunwooAudioUrl: stories.eunwooAudioUrl,
            emmaAudioUrl: stories.emmaAudioUrl,
            noahAudioUrl: stories.noahAudioUrl
          }).from(stories).where(eq(stories.storyUuid, storyUuid));
          if (!story) {
            return void 0;
          }
          if (story.status !== "active") {
            return void 0;
          }
          if (story.isCreated && userId && story.creatorId !== userId.toString()) {
            return void 0;
          }
          const displayLanguage = story.isCreated ? story.titleKo ? "ko" : "en" : language || DEFAULT_LANGUAGE;
          let progress = null;
          if (userId) {
            [progress] = await db.select().from(readingProgress).where(and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.storyId, story.id)
            ));
          }
          const legacyStory = convertToLegacyStory(story, displayLanguage);
          legacyStory.isFavorite = progress ? progress.isFavorite : false;
          return legacyStory;
        } catch (error) {
          console.error("Database error in getStoryByUuid:", error);
          return void 0;
        }
      }
      // ULTRA-MINIMAL: Only essential security checks (UUID system provides primary security)
      async canUserAccessStory(userId, storyId) {
        if (!userId) return false;
        try {
          const [story] = await db.select({ status: stories.status }).from(stories).where(eq(stories.id, storyId));
          return story?.status === "active";
        } catch {
          return false;
        }
      }
      async canCreateStoryToday(userId) {
        try {
          console.log(`Checking creation limit for user ${userId}`);
          const user = await this.getUser(userId);
          const userTimezone = user?.timezone || "UTC";
          const now = /* @__PURE__ */ new Date();
          const today = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          const todayStories = await db.select({ id: stories.id }).from(stories).where(and(
            eq(stories.creatorId, userId.toString()),
            eq(stories.isCreated, true),
            gte(stories.createdAt, startOfToday),
            lt(stories.createdAt, endOfToday)
          ));
          const hasCreatedToday = todayStories.length > 0;
          console.log(`User ${userId} creation status: hasCreatedToday=${hasCreatedToday}, total stories=${todayStories.length}`);
          return {
            canCreate: !hasCreatedToday,
            hasCreatedToday
          };
        } catch (error) {
          console.error("Database error in canCreateStoryToday:", error);
          return { canCreate: false, hasCreatedToday: false };
        }
      }
      async getCreatedStories(userId) {
        try {
          const supabaseStories = await db.select().from(stories).where(and(
            eq(stories.creatorId, userId.toString()),
            eq(stories.status, "active")
          )).orderBy(desc(stories.createdAt));
          return supabaseStories.map((story) => {
            const originalLanguage = story.titleKo ? "ko" : "en";
            return convertToLegacyStory(story, originalLanguage);
          });
        } catch (error) {
          console.error("Database error in getCreatedStories:", error);
          return [];
        }
      }
      async getUserStats(userId, limit = 5) {
        try {
          const cacheKey = limit > 10 ? `themes:${userId}_${limit}` : `stats:${userId}_${limit}`;
          const cached = performanceCache.getUserStats(cacheKey);
          if (cached) {
            console.log(`Cache hit for user ${limit > 10 ? "themes" : "stats"} for user ${userId}`);
            return cached;
          }
          const user = await this.getUser(userId);
          const userLanguage = user?.language || "en";
          const [readStoriesCount, createdStoriesCount] = await Promise.all([
            db.select({ count: sql`count(*)` }).from(readingProgress).where(and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.isRead, true)
            )),
            db.select({ count: sql`count(*)` }).from(stories).where(and(
              eq(stories.isCreated, true),
              eq(stories.creatorId, userId.toString()),
              eq(stories.status, "active")
            ))
          ]);
          const storiesRead = readStoriesCount[0]?.count || 0;
          const storiesCreated = createdStoriesCount[0]?.count || 0;
          let themes = [];
          if (storiesRead > 0) {
            const readStoriesWithTags = await db.select({
              isCreated: stories.isCreated,
              titleKo: stories.titleKo,
              tagsKo: stories.tagsKo,
              tagsEn: stories.tagsEn
            }).from(readingProgress).innerJoin(stories, eq(readingProgress.storyId, stories.id)).where(and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.isRead, true),
              eq(stories.status, "active")
            ));
            const themeCount = /* @__PURE__ */ new Map();
            let totalThemes = 0;
            for (const story of readStoriesWithTags) {
              let tags = null;
              if (story.isCreated) {
                tags = story.titleKo ? story.tagsKo : story.tagsEn;
              } else {
                tags = userLanguage === "ko" ? story.tagsKo : story.tagsEn;
              }
              if (tags && Array.isArray(tags) && tags.length > 0) {
                for (const tag of tags) {
                  if (tag && tag.trim()) {
                    const cleanTag = tag.trim().toLowerCase();
                    themeCount.set(cleanTag, (themeCount.get(cleanTag) || 0) + 1);
                    totalThemes++;
                  }
                }
              }
            }
            const themeColors = [
              "#8E7CC3",
              "#5CBDB9",
              "#FFB6A3",
              "#7CC39F",
              "#E6C074",
              "#B8A8D9",
              "#7DD4D1",
              "#FFD1C7",
              "#98D1B5",
              "#F0D09B",
              "#C8B9E6",
              "#9EE8E5",
              "#FFE8E1",
              "#B5E0CA",
              "#F5DFB8"
            ];
            themes = Array.from(themeCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count], index2) => ({
              name,
              count,
              percentage: totalThemes > 0 ? Math.round(count / totalThemes * 100) : 0,
              color: themeColors[index2 % themeColors.length]
            }));
          }
          const result = {
            storiesRead,
            storiesCreated,
            themes
          };
          performanceCache.setUserStats(cacheKey, result);
          return result;
        } catch (error) {
          console.error("Error fetching user stats:", error);
          return {
            storiesRead: 0,
            storiesCreated: 0,
            themes: []
          };
        }
      }
      // Admin methods implementation
      async isAdmin(userId) {
        try {
          const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
          return !!admin;
        } catch (error) {
          console.error("Error checking admin status:", error);
          return false;
        }
      }
      async getAdminByUserId(userId) {
        try {
          const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
          return admin;
        } catch (error) {
          console.error("Error getting admin by user ID:", error);
          return void 0;
        }
      }
      async createAdmin(admin) {
        const [newAdmin] = await db.insert(admins).values(admin).returning();
        return newAdmin;
      }
      // User management
      async getAllUsers(page = 1, limit = 20, search) {
        try {
          const offset = (page - 1) * limit;
          const [usersResult, countResult] = await Promise.all([
            db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
            db.select({ count: sql`count(*)` }).from(users)
          ]);
          return {
            users: usersResult,
            total: countResult[0]?.count || 0
          };
        } catch (error) {
          console.error("Error getting all users:", error);
          return { users: [], total: 0 };
        }
      }
      async getUsersWithSubscriptions() {
        try {
          const result = await db.select().from(users).leftJoin(subscriptions, eq(subscriptions.userId, users.id)).orderBy(desc(users.createdAt));
          return result.map((row) => ({
            ...row.users,
            subscription: row.subscriptions || void 0
          }));
        } catch (error) {
          console.error("Error getting users with subscriptions:", error);
          return [];
        }
      }
      async updateUserStatus(userId, status) {
        const [updatedUser] = await db.update(users).set({ username: users.username }).where(eq(users.id, userId)).returning();
        return updatedUser;
      }
      // Content management
      async getAllStories(page = 1, limit = 20, search, status) {
        try {
          const offset = (page - 1) * limit;
          let query = db.select().from(stories);
          let countQuery = db.select({ count: sql`count(*)` }).from(stories);
          const conditions = [];
          if (search) {
            conditions.push(sql`${stories.titleKo} ILIKE ${"%" + search + "%"} OR ${stories.titleEn} ILIKE ${"%" + search + "%"}`);
          }
          if (status) {
            conditions.push(eq(stories.status, status));
          }
          if (conditions.length > 0) {
            const combinedCondition = conditions.length === 1 ? conditions[0] : sql`${conditions.join(" AND ")}`;
            query = query.where(combinedCondition);
            countQuery = countQuery.where(combinedCondition);
          }
          const [storiesResult, countResult] = await Promise.all([
            query.limit(limit).offset(offset).orderBy(desc(stories.createdAt)),
            countQuery
          ]);
          return {
            stories: storiesResult,
            total: countResult[0]?.count || 0
          };
        } catch (error) {
          console.error("Error getting all stories:", error);
          return { stories: [], total: 0 };
        }
      }
      async updateStoryStatus(storyId, status) {
        const [updatedStory] = await db.update(stories).set({ status }).where(eq(stories.id, storyId)).returning();
        return updatedStory;
      }
      async getStoryAnalytics() {
        try {
          const result = await db.select({
            total: sql`count(*)`,
            published: sql`count(case when status = 'published' then 1 end)`,
            draft: sql`count(case when status = 'draft' then 1 end)`,
            userGenerated: sql`count(case when is_created = true then 1 end)`,
            dailyStories: sql`count(case when is_daily = true then 1 end)`
          }).from(stories);
          return result[0] || { total: 0, published: 0, draft: 0, userGenerated: 0, dailyStories: 0 };
        } catch (error) {
          console.error("Error getting story analytics:", error);
          return { total: 0, published: 0, draft: 0, userGenerated: 0, dailyStories: 0 };
        }
      }
      // Coupon management
      generateCouponCode() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "PRENA-";
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
      async createCoupon(coupon) {
        const code = this.generateCouponCode();
        const [newCoupon] = await db.insert(coupons).values({ ...coupon, code }).returning();
        return newCoupon;
      }
      async createBulkCoupons(couponList) {
        const couponsWithCodes = couponList.map((coupon) => ({
          ...coupon,
          code: this.generateCouponCode()
        }));
        const newCoupons = await db.insert(coupons).values(couponsWithCodes).returning();
        return newCoupons;
      }
      async getAllCoupons(page = 1, limit = 20) {
        try {
          const offset = (page - 1) * limit;
          const [couponsResult, countResult] = await Promise.all([
            db.select().from(coupons).limit(limit).offset(offset).orderBy(desc(coupons.createdAt)),
            db.select({ count: sql`count(*)` }).from(coupons)
          ]);
          return {
            coupons: couponsResult,
            total: countResult[0]?.count || 0
          };
        } catch (error) {
          console.error("Error getting all coupons:", error);
          return { coupons: [], total: 0 };
        }
      }
      async getCouponUsage(couponId) {
        try {
          const result = await db.select({
            userId: couponUsage.userId,
            username: users.username,
            usedAt: couponUsage.usedAt
          }).from(couponUsage).leftJoin(users, eq(users.id, couponUsage.userId)).where(eq(couponUsage.couponId, couponId)).orderBy(desc(couponUsage.usedAt));
          return result.map((row) => ({
            userId: row.userId,
            username: row.username || "Unknown",
            usedAt: row.usedAt || /* @__PURE__ */ new Date()
          }));
        } catch (error) {
          console.error("Error getting coupon usage:", error);
          return [];
        }
      }
      async updateCouponStatus(couponId, isActive) {
        const [updatedCoupon] = await db.update(coupons).set({ isActive }).where(eq(coupons.id, couponId)).returning();
        return updatedCoupon;
      }
      // Subscription management
      async getAllSubscriptions(page = 1, limit = 20) {
        try {
          const offset = (page - 1) * limit;
          const [subscriptionsResult, countResult] = await Promise.all([
            db.select().from(subscriptions).leftJoin(users, eq(users.id, subscriptions.userId)).limit(limit).offset(offset).orderBy(desc(subscriptions.createdAt)),
            db.select({ count: sql`count(*)` }).from(subscriptions)
          ]);
          return {
            subscriptions: subscriptionsResult.map((row) => ({
              ...row.subscriptions,
              user: row.users
            })),
            total: countResult[0]?.count || 0
          };
        } catch (error) {
          console.error("Error getting all subscriptions:", error);
          return { subscriptions: [], total: 0 };
        }
      }
      async getSubscriptionAnalytics() {
        try {
          const result = await db.select({
            total: sql`count(*)`,
            active: sql`count(case when status = 'active' then 1 end)`,
            cancelled: sql`count(case when status = 'cancelled' then 1 end)`,
            expired: sql`count(case when status = 'expired' then 1 end)`,
            monthlyRevenue: sql`count(case when plan_type = 'premium_monthly' and status = 'active' then 1 end) * 1.99`,
            yearlyRevenue: sql`count(case when plan_type = 'premium_yearly' and status = 'active' then 1 end) * 9.99`
          }).from(subscriptions);
          return result[0] || { total: 0, active: 0, cancelled: 0, expired: 0, monthlyRevenue: 0, yearlyRevenue: 0 };
        } catch (error) {
          console.error("Error getting subscription analytics:", error);
          return { total: 0, active: 0, cancelled: 0, expired: 0, monthlyRevenue: 0, yearlyRevenue: 0 };
        }
      }
      // API usage tracking
      async logApiUsage(usage) {
        const [newUsage] = await db.insert(apiUsage).values(usage).returning();
        return newUsage;
      }
      async getApiUsageStats(startDate, endDate) {
        try {
          let query = db.select().from(apiUsage);
          if (startDate && endDate) {
            query = query.where(and(
              gte(apiUsage.createdAt, startDate),
              lt(apiUsage.createdAt, endDate)
            ));
          }
          const usageData = await query;
          const totalCost = usageData.reduce((sum, usage) => sum + parseFloat(usage.cost), 0);
          const totalRequests = usageData.length;
          const providerStats = /* @__PURE__ */ new Map();
          const operationStats = /* @__PURE__ */ new Map();
          usageData.forEach((usage) => {
            const cost = parseFloat(usage.cost);
            if (!providerStats.has(usage.provider)) {
              providerStats.set(usage.provider, { cost: 0, requests: 0 });
            }
            providerStats.get(usage.provider).cost += cost;
            providerStats.get(usage.provider).requests += 1;
            if (!operationStats.has(usage.operation)) {
              operationStats.set(usage.operation, { cost: 0, requests: 0 });
            }
            operationStats.get(usage.operation).cost += cost;
            operationStats.get(usage.operation).requests += 1;
          });
          return {
            totalCost,
            totalRequests,
            byProvider: Array.from(providerStats.entries()).map(([provider, stats]) => ({
              provider,
              ...stats
            })),
            byOperation: Array.from(operationStats.entries()).map(([operation, stats]) => ({
              operation,
              ...stats
            }))
          };
        } catch (error) {
          console.error("Error getting API usage stats:", error);
          return { totalCost: 0, totalRequests: 0, byProvider: [], byOperation: [] };
        }
      }
      // Admin logging
      async logAdminAction(log2) {
        const [newLog] = await db.insert(adminLogs).values(log2).returning();
        return newLog;
      }
      async getAdminLogs(page = 1, limit = 20) {
        try {
          const offset = (page - 1) * limit;
          const [logsResult, countResult] = await Promise.all([
            db.select().from(adminLogs).leftJoin(admins, eq(admins.id, adminLogs.adminId)).leftJoin(users, eq(users.id, admins.userId)).limit(limit).offset(offset).orderBy(desc(adminLogs.createdAt)),
            db.select({ count: sql`count(*)` }).from(adminLogs)
          ]);
          return {
            logs: logsResult.map((row) => ({
              ...row.admin_logs,
              admin: {
                user: row.users
              }
            })),
            total: countResult[0]?.count || 0
          };
        } catch (error) {
          console.error("Error getting admin logs:", error);
          return { logs: [], total: 0 };
        }
      }
      // Subscription business logic methods
      async getUserActiveSubscription(userId) {
        try {
          const [subscription] = await db.select().from(subscriptions).where(
            and(
              eq(subscriptions.userId, userId),
              eq(subscriptions.status, "active")
            )
          ).limit(1);
          return subscription || null;
        } catch (error) {
          console.error("Error getting user active subscription:", error);
          return null;
        }
      }
      async cancelUserSubscription(userId) {
        try {
          const activeSubscription = await this.getUserActiveSubscription(userId);
          if (!activeSubscription) {
            return { success: false, message: "\uD65C\uC131 \uAD6C\uB3C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." };
          }
          if (activeSubscription.planType === "premium_monthly" || activeSubscription.planType === "premium_yearly") {
            const [updatedSubscription] = await db.update(subscriptions).set({
              autoRenew: false,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(subscriptions.id, activeSubscription.id)).returning();
            performanceCache.invalidateUserCache(userId);
            return {
              success: true,
              message: "\uAD6C\uB3C5\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uACB0\uC81C \uAE30\uAC04 \uC885\uB8CC\uC77C\uAE4C\uC9C0 Prena Plan\uC744 \uACC4\uC18D \uC774\uC6A9\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
              newEndDate: updatedSubscription.endDate || void 0
            };
          } else if (activeSubscription.planType === "prena_plan") {
            const [updatedSubscription] = await db.update(subscriptions).set({
              autoRenew: false,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(subscriptions.id, activeSubscription.id)).returning();
            performanceCache.invalidateUserCache(userId);
            return {
              success: true,
              message: "\uAD6C\uB3C5\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uCFE0\uD3F0 \uC720\uD6A8\uAE30\uAC04 \uC885\uB8CC\uC77C\uAE4C\uC9C0 Prena Plan\uC744 \uACC4\uC18D \uC774\uC6A9\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
              newEndDate: updatedSubscription.endDate || void 0
            };
          }
          return { success: false, message: "\uC54C \uC218 \uC5C6\uB294 \uAD6C\uB3C5 \uC720\uD615\uC785\uB2C8\uB2E4." };
        } catch (error) {
          console.error("Error cancelling user subscription:", error);
          return { success: false, message: "\uAD6C\uB3C5 \uCDE8\uC18C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." };
        }
      }
      async applyCouponForPrenaPlan(userId, couponCode) {
        try {
          const [coupon] = await db.select().from(coupons).where(eq(coupons.code, couponCode));
          if (!coupon) {
            return { success: false, message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uCFE0\uD3F0 \uCF54\uB4DC\uC785\uB2C8\uB2E4." };
          }
          const now = /* @__PURE__ */ new Date();
          if (!coupon.isActive) {
            return { success: false, message: "\uBE44\uD65C\uC131 \uCFE0\uD3F0\uC785\uB2C8\uB2E4." };
          }
          if (coupon.validUntil && coupon.validUntil < now) {
            return { success: false, message: "\uB9CC\uB8CC\uB41C \uCFE0\uD3F0\uC785\uB2C8\uB2E4." };
          }
          if (coupon.maxUses && (coupon.currentUses || 0) >= coupon.maxUses) {
            return { success: false, message: "\uC0AC\uC6A9 \uD55C\uB3C4\uAC00 \uCD08\uACFC\uB41C \uCFE0\uD3F0\uC785\uB2C8\uB2E4." };
          }
          const [existingUsage] = await db.select().from(couponUsage).where(
            and(
              eq(couponUsage.couponId, coupon.id),
              eq(couponUsage.userId, userId)
            )
          );
          if (existingUsage) {
            return { success: false, message: "\uC774\uBBF8 \uC0AC\uC6A9\uD55C \uCFE0\uD3F0\uC785\uB2C8\uB2E4." };
          }
          const result = await this.extendSubscriptionWithCoupon(userId, coupon);
          if (result.success) {
            await db.update(coupons).set({ currentUses: (coupon.currentUses || 0) + 1 }).where(eq(coupons.id, coupon.id));
            await db.insert(couponUsage).values({
              couponId: coupon.id,
              userId,
              usedAt: /* @__PURE__ */ new Date()
            });
            performanceCache.invalidateUserCache(userId);
          }
          return result;
        } catch (error) {
          console.error("Error applying coupon:", error);
          return { success: false, message: "\uCFE0\uD3F0 \uC801\uC6A9 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." };
        }
      }
      async extendSubscriptionWithCoupon(userId, coupon) {
        try {
          const currentSubscription = await this.getUserActiveSubscription(userId);
          let extensionMonths = 0;
          switch (coupon.planDuration) {
            case "1_month":
              extensionMonths = 1;
              break;
            case "3_months":
              extensionMonths = 3;
              break;
            case "6_months":
              extensionMonths = 6;
              break;
            case "12_months":
              extensionMonths = 12;
              break;
            default:
              extensionMonths = 1;
          }
          let newEndDate;
          if (currentSubscription) {
            if (currentSubscription.planType === "premium_monthly" || currentSubscription.planType === "premium_yearly") {
              const currentEndDate = currentSubscription.endDate || /* @__PURE__ */ new Date();
              newEndDate = new Date(currentEndDate);
              newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
              await db.update(subscriptions).set({
                endDate: newEndDate,
                planType: "prena_plan",
                // Change to coupon-based plan
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(subscriptions.id, currentSubscription.id));
            } else if (currentSubscription.planType === "prena_plan") {
              const currentEndDate = currentSubscription.endDate || /* @__PURE__ */ new Date();
              newEndDate = new Date(currentEndDate);
              newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
              await db.update(subscriptions).set({
                endDate: newEndDate,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(subscriptions.id, currentSubscription.id));
            } else {
              return { success: false, message: "\uC54C \uC218 \uC5C6\uB294 \uAD6C\uB3C5 \uC720\uD615\uC785\uB2C8\uB2E4.", newEndDate: /* @__PURE__ */ new Date() };
            }
          } else {
            const startDate = /* @__PURE__ */ new Date();
            newEndDate = new Date(startDate);
            if (coupon.upgradeType === "expiry_based" && coupon.planExpiryDate) {
              newEndDate = new Date(coupon.planExpiryDate);
            } else {
              newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
            }
            await db.insert(subscriptions).values({
              userId,
              planType: "prena_plan",
              status: "active",
              startDate,
              endDate: newEndDate,
              autoRenew: false,
              // Coupon-based subscriptions don't auto-renew
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            });
          }
          return {
            success: true,
            message: `\uCFE0\uD3F0\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC801\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4. Prena Plan\uC774 ${newEndDate.toLocaleDateString("ko-KR")}\uAE4C\uC9C0 \uC5F0\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
            newEndDate
          };
        } catch (error) {
          console.error("Error extending subscription with coupon:", error);
          return { success: false, message: "\uAD6C\uB3C5 \uC5F0\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.", newEndDate: /* @__PURE__ */ new Date() };
        }
      }
      async updateUserSubscription(userId, subscriptionData) {
        try {
          const activeSubscription = await this.getUserActiveSubscription(userId);
          if (activeSubscription) {
            await db.update(subscriptions).set({
              planType: subscriptionData.subscriptionPlan === "prena" ? "premium_monthly" : "free",
              endDate: subscriptionData.subscriptionEndDate,
              status: subscriptionData.subscriptionStatus,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(subscriptions.id, activeSubscription.id));
          } else {
            await db.insert(subscriptions).values({
              userId,
              planType: subscriptionData.subscriptionPlan === "prena" ? "premium_monthly" : "free",
              startDate: /* @__PURE__ */ new Date(),
              endDate: subscriptionData.subscriptionEndDate,
              status: subscriptionData.subscriptionStatus,
              autoRenew: true
            });
          }
          performanceCache.invalidateUserCache(userId);
        } catch (error) {
          console.error("Error updating user subscription:", error);
          throw error;
        }
      }
    };
    storage = new DatabaseStorage();
  }
});

// ../server/gemini.ts
var gemini_exports = {};
__export(gemini_exports, {
  generateStory: () => generateStory,
  generateStoryIllustration: () => generateStoryIllustration,
  saveGeneratedImageToSupabase: () => saveGeneratedImageToSupabase
});
import * as fs from "fs";
import { GoogleGenAI, Modality } from "@google/genai";
async function logApiUsage(operation, model, estimatedCost, metadata) {
  try {
    await db.insert(apiUsage).values({
      provider: "gemini",
      operation,
      model,
      cost: estimatedCost.toString(),
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: /* @__PURE__ */ new Date()
    });
    console.log(
      `API Usage: ${operation} with ${model} - estimated cost: $${estimatedCost}`
    );
  } catch (error) {
    console.error("Failed to log API usage:", error);
  }
}
async function generateStory({
  theme,
  character,
  length,
  message,
  language = "en"
}) {
  try {
    const isKorean = language === "ko";
    const getLengthInstructions = (length2) => {
      if (!length2) {
        return isKorean ? "\uB2F9\uC2E0\uC758 \uB3D9\uD654\uB294 \uD56D\uC0C1 4000 ~ 6000 byte \uBD84\uB7C9\uC774\uBA70, \uCD5C\uC18C\uD55C 4,000byte\uB294 \uB118\uC5B4\uC57C \uD569\uB2C8\uB2E4." : "Your fairy tales should be 4,000 to 6,000 bytes in length, and must be at least 4,000 bytes.";
      }
      switch (length2.id) {
        case "short":
          return isKorean ? "\uB2F9\uC2E0\uC758 \uB3D9\uD654\uB294 \uD56D\uC0C1 3000 ~ 4000 byte \uBD84\uB7C9\uC774\uBA70, \uCD5C\uC18C\uD55C 3,000byte\uB294 \uB118\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uAC04\uACB0\uD558\uBA74\uC11C\uB3C4 \uC644\uC131\uB3C4 \uC788\uB294 \uC774\uC57C\uAE30\uC5EC\uC57C \uD569\uB2C8\uB2E4." : "Your fairy tales should be 3,000 to 4,000 bytes in length, and must be at least 3,000 bytes. concise yet complete stories.";
        case "medium":
          return isKorean ? "\uB2F9\uC2E0\uC758 \uB3D9\uD654\uB294 \uD56D\uC0C1 4000 ~ 6000 byte \uBD84\uB7C9\uC774\uBA70, \uCD5C\uC18C\uD55C 4,000byte\uB294 \uB118\uC5B4\uC57C \uD569\uB2C8\uB2E4." : "Your fairy tales should be 5,000 to 6,000 bytes in length, and must be at least 4,000 bytes.";
        case "long":
          return isKorean ? "\uB2F9\uC2E0\uC758 \uB3D9\uD654\uB294 \uD56D\uC0C1 6000 ~ 8000 byte \uBD84\uB7C9\uC774\uBA70, \uCD5C\uC18C\uD55C 6,000byte\uB294 \uB118\uC5B4\uC57C \uD569\uB2C8\uB2E4." : "Your fairy tales should be 6,000 to 8,000 bytes in length, and must be at least 6,000 bytes.";
        default:
          return isKorean ? "\uB2F9\uC2E0\uC758 \uB3D9\uD654\uB294 \uD56D\uC0C1 4000 ~ 6000 byte \uBD84\uB7C9\uC774\uBA70, \uCD5C\uC18C\uD55C 4,000byte\uB294 \uB118\uC5B4\uC57C \uD569\uB2C8\uB2E4." : "Your fairy tales should be 4,000 to 6,000 bytes in length, and must be at least 4,000 bytes.";
      }
    };
    const lengthInstructions = getLengthInstructions(length);
    const systemPrompt = isKorean ? `\uB2F9\uC2E0\uC740 \uCD5C\uACE0\uC758 \uB3D9\uD654 \uC791\uAC00\uC785\uB2C8\uB2E4. 0~3\uC138 \uC774\uD558\uC758 \uC544\uB3D9\uC744 \uB300\uC0C1\uC73C\uB85C \uD558\uB294 \uBAB0\uC785\uAC10 \uC788\uB294 \uB3D9\uD654\uB97C \uB9CC\uB4E4\uC5B4\uB0C5\uB2C8\uB2E4. \uC77C\uC0C1 \uC18D \uC791\uACE0 \uC18C\uC18C\uD55C \uC18C\uC7AC\uBD80\uD130 \uC0C1\uC0C1\uB825 \uB118\uCE58\uB294 \uBC30\uACBD\uACFC \uC0AC\uAC74\uAE4C\uC9C0 \uB2E4\uC591\uD55C \uC8FC\uC81C\uB97C \uD1B5\uD574\uC11C, \uC544\uC774\uB4E4\uC758 \uC815\uC11C\uC5D0 \uB3C4\uC6C0\uC774 \uB418\uACE0 \uC18C\uC911\uD55C \uAC00\uCE58\uB4E4\uC744 \uBC30\uC6B8 \uC218 \uC788\uB3C4\uB85D \uC791\uC131\uD574\uC8FC\uC138\uC694. \uD558\uC9C0\uB9CC \uAD50\uD6C8\uC774 \uC5B5\uC9C0\uC2A4\uB7FD\uAC8C \uC804\uB2EC\uB418\uC9C0\uB294 \uC54A\uACE0, \uB3D9\uD654\uC758 \uB0B4\uC6A9\uC744 \uD1B5\uD574 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC804\uB2EC\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uC7AC\uBBF8\uC788\uB294 \uC0C1\uD669 \uC124\uC815\uC73C\uB85C \uBAB0\uC785\uAC10\uC744 \uB354\uD574\uC8FC\uC138\uC694.

\uBAA8\uB4E0 \uB3D9\uD654\uB294 \uAE30\uC2B9\uC804\uACB0\uC744 \uAC16\uCD94\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC0C1\uD669\uC774\uB098 \uC0AC\uAC74\uC744 \uC81C\uC2DC\uD558\uACE0 \uC774\uB97C \uC8FC\uC778\uACF5\uC774 \uD574\uACB0\uD558\uAC70\uB098 \uACBD\uD5D8\uD574\uB098\uAC00\uB294 \uACFC\uC815\uC774 \uC644\uACB0\uC801\uC73C\uB85C \uB3D9\uD654 \uC548\uC5D0 \uB2F4\uACA8\uC57C \uD569\uB2C8\uB2E4.
\uB3D9\uD654\uB294 \uC911\uAC04 \uC81C\uBAA9\uC744 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uACE0, \uD558\uB098\uC758 \uD750\uB984\uC73C\uB85C \uBAB0\uC785\uAC10 \uC788\uAC8C \uC774\uC57C\uAE30\uB97C \uC774\uB04C\uC5B4 \uB098\uAC11\uB2C8\uB2E4.
\uBD84\uB7C9\uC744 \uB9DE\uCD94\uB294 \uAC83\uC740 \uB9E4\uC6B0 \uC911\uC694\uD569\uB2C8\uB2E4. ${lengthInstructions}

**\uC911\uC694\uD55C \uC11C\uC2DD \uADDC\uCE59:**
- \uAC01 \uBB38\uB2E8\uC740 2-4\uAC1C\uC758 \uBB38\uC7A5\uC73C\uB85C \uAD6C\uC131
- \uBB38\uB2E8\uACFC \uBB38\uB2E8 \uC0AC\uC774\uC5D0\uB294 \uBC18\uB4DC\uC2DC \uBE48 \uC904(\\n\\n)\uC744 \uC0BD\uC785
- \uB300\uD654\uAC00 \uC788\uC744 \uB54C\uB294 \uC0C8\uB85C\uC6B4 \uBB38\uB2E8\uC73C\uB85C \uC2DC\uC791
- \uC7A5\uBA74\uC774 \uBC14\uB014 \uB54C\uB9C8\uB2E4 \uC0C8\uB85C\uC6B4 \uBB38\uB2E8\uC73C\uB85C \uAD6C\uBD84
- \uBB38\uB2E8 \uB0B4\uC5D0\uC11C\uB294 \uD55C \uC904\uB85C \uC774\uC5B4\uC11C \uC791\uC131` : `You are the best fairy tale writer. You create immersive fairy tales for children aged 0-3 years old. Through a variety of themes, from small, everyday subjects to imaginative settings and events, your stories help children's emotional development and teach them valuable lessons. However, the moral of the story should not be forced; it should be conveyed naturally through the content of the fairy tale. Enhance immersion with engaging scenarios.

Every fairy tale has a complete narrative arc (introduction, development, climax, and conclusion). The story should present a situation or event and show the protagonist resolving it or experiencing it in a complete, self-contained narrative.
Fairy tales do not use subheadings; they lead the story in a single, immersive flow.
Length is very important. ${lengthInstructions}

**Important formatting rules:**
- Each paragraph should contain 2-4 sentences
- Always insert a blank line (\\n\\n) between paragraphs
- Start a new paragraph for dialogue
- Start a new paragraph when scenes change
- Within a paragraph, write in a continuous flow`;
    const userPrompt = isKorean ? `\uB2E4\uC74C \uB9E4\uAC1C\uBCC0\uC218\uB85C \uB3D9\uD654\uB97C \uB9CC\uB4E4\uC5B4\uC8FC\uC138\uC694:
            - \uB2E4\uC74C\uC5D0 \uAD00\uB828\uB41C \uC694\uC18C\uB97C \uD3EC\uD568: ${theme.name} - ${theme.description}
            - \uC8FC\uC778\uACF5\uC758 \uC774\uB984: ${character.name}
            - \uB3D9\uD654\uC5D0 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uD3EC\uD568\uB418\uC5B4\uC57C \uD558\uB294 \uBA54\uC2DC\uC9C0 (\uC120\uD0DD\uC0AC\uD56D): ${message || "\uC81C\uACF5\uB418\uC9C0 \uC54A\uC74C"}
            
            \uB2E4\uC74C\uC744 \uD3EC\uD568\uD55C JSON \uAC1D\uCCB4\uB85C \uC751\uB2F5\uD574\uC8FC\uC138\uC694:
            - title: \uB3D9\uD654 \uC81C\uBAA9
            - content: \uC804\uCCB4 \uB3D9\uD654 \uB0B4\uC6A9
            - imagePrompt: \uC774 \uB3D9\uD654\uC758 \uC0BD\uD654\uB97C \uC0DD\uC131\uD558\uAE30 \uC704\uD55C \uAC04\uB2E8\uD55C \uC124\uBA85
            - tags: 3-5\uAC1C\uC758 \uAD00\uB828 \uD0DC\uADF8 \uBC30\uC5F4 (# \uAE30\uD638 \uC5C6\uC774)
            - readingTime: \uC608\uC0C1 \uC77D\uAE30 \uC2DC\uAC04(\uBA87 \uBD84\uC778\uC9C0 \uC22B\uC790\uB85C\uB9CC \uD45C\uC2DC\uD560 \uAC83. \uCD08 \uB2E8\uC704\uB294 \uD45C\uC2DC\uD558\uC9C0 \uC54A\uC74C. ex. 5)` : `Please create a fairy tale with these parameters:
            - Theme: ${theme.name} - ${theme.description}
            - Main character: ${character.name}
            - Personal message to include (optional): ${message || "None provided"}
            
            Respond with a JSON object containing:
            - title: The story title
            - content: The full story text
            - imagePrompt: A brief description to generate an illustration for this story
            - tags: An array of 3-5 relevant tags (without the # symbol)
            - readingTime: Estimated reading time in minutes(Display only the number of minutes, no seconds. e.g., 5)`;
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            imagePrompt: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            readingTime: { type: "number" }
          },
          required: ["title", "content", "imagePrompt", "tags", "readingTime"]
        }
      },
      contents: userPrompt
    });
    const duration = Date.now() - startTime;
    await logApiUsage(
      "story_generation",
      "gemini-2.5-flash",
      2e-3,
      // Estimated cost for story generation
      {
        theme: theme.name,
        character: character.name,
        language,
        duration,
        promptLength: userPrompt.length
      }
    );
    const result = JSON.parse(response.text || "{}");
    if (!result.title || !result.content) {
      throw new Error("Invalid response from Gemini API");
    }
    if (result.content) {
      result.content = result.content.replace(/\\n\\n/g, "\n\n").replace(/\\n/g, "\n");
    }
    return result;
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error(`Failed to generate story: ${error}`);
  }
}
async function generateStoryIllustration(storyTitle, storyContent, storyTheme, customImagePrompt) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    if (!customImagePrompt) {
      throw new Error("imagePrompt is required for illustration generation");
    }
    const illustrationPrompt = createIllustrationPromptFromImagePrompt(
      storyTitle,
      customImagePrompt,
      storyTheme
    );
    console.log("\u{1F3A8} Generating illustration for story:", storyTitle);
    console.log(
      "\u{1F4DD} Using prompt:",
      illustrationPrompt.substring(0, 200) + "..."
    );
    const startTime = Date.now();
    console.log("\u{1F680} Calling Gemini API for image generation...");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: illustrationPrompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE]
      }
    });
    console.log("\u{1F4E1} Gemini API response received, processing...");
    const duration = Date.now() - startTime;
    await logApiUsage(
      "image_generation",
      "gemini-2.0-flash-exp",
      0.039,
      // Official Google pricing: $30 per 1M tokens, 1290 tokens per image
      {
        storyTitle,
        duration,
        promptLength: illustrationPrompt.length
      }
    );
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No image candidates generated");
    }
    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content parts in response");
    }
    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageBuffer = Buffer.from(part.inlineData.data, "base64");
        console.log("\u2705 Story illustration generated successfully");
        return {
          imageBuffer,
          prompt: illustrationPrompt
        };
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("\u274C Failed to generate story illustration:", error);
    throw new Error(`Failed to generate story illustration: ${error}`);
  }
}
function createIllustrationPromptFromImagePrompt(title, imagePrompt, theme) {
  const basePrompt = `Generate an image for a children's book illustration, designed with a sophisticated and artistic appeal suitable for adults without any text or writing. Use elegant flat design with soft textures and harmonious colors.

STORY CONTEXT:
Title: "${title}"
${theme ? `Theme: ${theme}` : ""}
Image Description: ${imagePrompt}

STYLE REQUIREMENTS:
- Elegant flat design with soft textures and harmonious colors
- Simplified yet expressive shapes for sophisticated visual storytelling
- Professional children's book illustration quality
- Size: 800 x 600 pixels
- Warm, inviting color palette suitable for prenatal storytelling

STRICT PROHIBITION - NEVER INCLUDE:
- No Korean text (\uD55C\uAD6D\uC5B4 \uD14D\uC2A4\uD2B8 \uC808\uB300 \uAE08\uC9C0)
- No English text 
- No numbers or symbols
- No letters of any alphabet
- No written characters whatsoever
- No speech bubbles or text areas
- No signs with writing
- No books with visible text
- No labels or captions

FOCUS ON: FLAT DESIGN. Pure visual storytelling through characters, scenes, colors and composition only. Elegant flat design with soft textures and harmonious colors.

Create a beautiful, serene illustration based on the provided image description while maintaining a sophisticated artistic style perfect for expectant parents.`;
  return basePrompt;
}
async function saveGeneratedImageToSupabase(imageBuffer, uniqueId) {
  const filename = `${uniqueId}.png`;
  try {
    const localPath = `/tmp/${filename}`;
    fs.writeFileSync(localPath, imageBuffer);
    console.log(`\u2705 Generated image saved locally as ${localPath}`);
    const supabaseUrl = await uploadToSupabaseStorage(imageBuffer, filename);
    console.log(`\u2705 Image uploaded to Supabase: ${supabaseUrl}`);
    return supabaseUrl;
  } catch (error) {
    console.error("\u274C Failed to save generated image:", error);
    throw new Error(`Failed to save generated image: ${error}`);
  }
}
async function uploadToSupabaseStorage(imageBuffer, filename) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is not set");
    }
    if (!supabaseKey) {
      throw new Error(
        "SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable is not set"
      );
    }
    const uploadUrl = `${supabaseUrl}/storage/v1/object/images/${filename}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "image/png"
      },
      body: imageBuffer
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("\u274C Supabase upload error details:");
      console.error("- Status:", response.status);
      console.error("- Error text:", error);
      console.error("- Upload URL:", uploadUrl);
      console.error("- Filename:", filename);
      throw new Error(`Supabase upload failed: ${response.status} - ${error}`);
    }
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${filename}`;
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    throw error;
  }
}
var ai;
var init_gemini = __esm({
  "../server/gemini.ts"() {
    "use strict";
    init_db();
    init_schema();
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
});

// ../server/gemini-parallel.ts
var gemini_parallel_exports = {};
__export(gemini_parallel_exports, {
  PARALLEL_CONFIG: () => PARALLEL_CONFIG,
  getParallelProcessor: () => getParallelProcessor,
  getParallelProcessorStatus: () => getParallelProcessorStatus,
  initializeParallelProcessor: () => initializeParallelProcessor
});
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";
function getParallelProcessor() {
  if (!globalProcessor) {
    globalProcessor = new GeminiParallelProcessor();
  }
  return globalProcessor;
}
function initializeParallelProcessor() {
  console.log("\u{1F527} Gemini \uBCD1\uB82C\uCC98\uB9AC \uC2DC\uC2A4\uD15C \uCD08\uAE30\uD654 \uC911...");
  getParallelProcessor();
  console.log("\u2705 Gemini \uBCD1\uB82C\uCC98\uB9AC \uC2DC\uC2A4\uD15C \uC900\uBE44 \uC644\uB8CC");
}
function getParallelProcessorStatus() {
  return globalProcessor ? globalProcessor.getStatus() : null;
}
var PARALLEL_CONFIG, GeminiParallelProcessor, globalProcessor;
var init_gemini_parallel = __esm({
  "../server/gemini-parallel.ts"() {
    "use strict";
    PARALLEL_CONFIG = {
      // 동시 요청 제한 (스토리와 이미지 동일하게 설정)
      MAX_STORY_CONCURRENT: 20,
      // 스토리 20개 동시 처리
      MAX_IMAGE_CONCURRENT: 20,
      // 이미지 20개 동시 처리 (병목현상 방지)
      // 타임아웃 설정 (밀리초) - 안정성을 위해 증가
      STORY_TIMEOUT: 15e4,
      // 2.5분 (더 많은 요청 처리로 인한 여유)
      IMAGE_TIMEOUT: 2e5,
      // 3.3분
      // 큐 크기 대폭 확장
      MAX_QUEUE_SIZE: 100,
      // 20 → 100개로 확장
      // 재시도 설정 (안정성 유지)
      MAX_RETRIES: 3,
      // 2 → 3회로 증가
      RETRY_DELAY: 2e3
      // 1초 → 2초 (부하 분산)
    };
    GeminiParallelProcessor = class {
      ai;
      storyQueue = [];
      imageQueue = [];
      activeStoryRequests = 0;
      activeImageRequests = 0;
      isProcessing = false;
      constructor() {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY environment variable is required");
        }
        this.ai = new GoogleGenAI2({ apiKey: process.env.GEMINI_API_KEY });
        console.log("\u{1F680} Gemini \uBCD1\uB82C\uCC98\uB9AC \uC2DC\uC2A4\uD15C \uCD08\uAE30\uD654 \uC644\uB8CC");
      }
      /**
       * 스토리 생성 요청 추가
       */
      async generateStory(params) {
        return this.addToQueue("story", params);
      }
      /**
       * 이미지 생성 요청 추가
       */
      async generateImage(params) {
        return this.addToQueue("image", params);
      }
      /**
       * 큐에 요청 추가
       */
      async addToQueue(type, params) {
        const currentQueue = type === "story" ? this.storyQueue : this.imageQueue;
        if (currentQueue.length >= PARALLEL_CONFIG.MAX_QUEUE_SIZE) {
          throw new Error(`${type} queue is full (${PARALLEL_CONFIG.MAX_QUEUE_SIZE} items)`);
        }
        return new Promise((resolve, reject) => {
          const item = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            params,
            resolve,
            reject,
            timestamp: Date.now(),
            retryCount: 0
          };
          if (type === "story") {
            this.storyQueue.push(item);
          } else {
            this.imageQueue.push(item);
          }
          console.log(`\u{1F4DD} ${type} \uC694\uCCAD \uD050\uC5D0 \uCD94\uAC00: ${item.id} (\uD050 \uD06C\uAE30: ${currentQueue.length + 1})`);
          this.processQueue();
        });
      }
      /**
       * 큐 처리 메인 로직
       */
      async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
          while (this.storyQueue.length > 0 && this.activeStoryRequests < PARALLEL_CONFIG.MAX_STORY_CONCURRENT) {
            const item = this.storyQueue.shift();
            this.processStoryItem(item);
          }
          while (this.imageQueue.length > 0 && this.activeImageRequests < PARALLEL_CONFIG.MAX_IMAGE_CONCURRENT) {
            const item = this.imageQueue.shift();
            this.processImageItem(item);
          }
        } finally {
          this.isProcessing = false;
          if (this.storyQueue.length > 0 || this.imageQueue.length > 0) {
            setTimeout(() => this.processQueue(), 100);
          }
        }
      }
      /**
       * 개별 스토리 처리
       */
      async processStoryItem(item) {
        this.activeStoryRequests++;
        try {
          console.log(`\u{1F4DD} \uC2A4\uD1A0\uB9AC \uCC98\uB9AC \uC2DC\uC791: ${item.id} (\uD65C\uC131: ${this.activeStoryRequests}/${PARALLEL_CONFIG.MAX_STORY_CONCURRENT})`);
          const { generateStory: generateStory2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Story generation timeout: ${item.id}`)), PARALLEL_CONFIG.STORY_TIMEOUT);
          });
          const result = await Promise.race([
            generateStory2(item.params),
            timeoutPromise
          ]);
          item.resolve(result);
          console.log(`\u2705 \uC2A4\uD1A0\uB9AC \uC644\uB8CC: ${item.id} (\uC18C\uC694 \uC2DC\uAC04: ${Date.now() - item.timestamp}ms)`);
        } catch (error) {
          console.error(`\u274C \uC2A4\uD1A0\uB9AC \uC2E4\uD328: ${item.id}`, error);
          if (item.retryCount < PARALLEL_CONFIG.MAX_RETRIES) {
            item.retryCount++;
            console.log(`\u{1F504} \uC2A4\uD1A0\uB9AC \uC7AC\uC2DC\uB3C4 ${item.retryCount}/${PARALLEL_CONFIG.MAX_RETRIES}: ${item.id}`);
            setTimeout(() => {
              this.storyQueue.unshift(item);
              this.processQueue();
            }, PARALLEL_CONFIG.RETRY_DELAY * item.retryCount);
          } else {
            item.reject(error);
          }
        } finally {
          this.activeStoryRequests--;
        }
      }
      /**
       * 개별 이미지 처리
       */
      async processImageItem(item) {
        this.activeImageRequests++;
        try {
          console.log(`\u{1F3A8} \uC774\uBBF8\uC9C0 \uCC98\uB9AC \uC2DC\uC791: ${item.id} (\uD65C\uC131: ${this.activeImageRequests}/${PARALLEL_CONFIG.MAX_IMAGE_CONCURRENT})`);
          console.log(`\u{1F4DD} \uC0AC\uC6A9\uD560 \uC774\uBBF8\uC9C0 \uD504\uB86C\uD504\uD2B8: ${item.params.imagePrompt}`);
          const { generateStoryIllustration: generateStoryIllustration2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Image generation timeout: ${item.id}`)), PARALLEL_CONFIG.IMAGE_TIMEOUT);
          });
          const result = await Promise.race([
            generateStoryIllustration2(
              item.params.title,
              item.params.content,
              item.params.theme,
              item.params.imagePrompt
            ),
            timeoutPromise
          ]);
          item.resolve(result);
          console.log(`\u2705 \uC774\uBBF8\uC9C0 \uC644\uB8CC: ${item.id} (\uC18C\uC694 \uC2DC\uAC04: ${Date.now() - item.timestamp}ms)`);
        } catch (error) {
          console.error(`\u274C \uC774\uBBF8\uC9C0 \uC2E4\uD328: ${item.id}`, error);
          if (item.retryCount < PARALLEL_CONFIG.MAX_RETRIES) {
            item.retryCount++;
            console.log(`\u{1F504} \uC774\uBBF8\uC9C0 \uC7AC\uC2DC\uB3C4 ${item.retryCount}/${PARALLEL_CONFIG.MAX_RETRIES}: ${item.id}`);
            setTimeout(() => {
              this.imageQueue.unshift(item);
              this.processQueue();
            }, PARALLEL_CONFIG.RETRY_DELAY * item.retryCount);
          } else {
            console.log(`\u{1F3A8} \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328, \uC2A4\uD1A0\uB9AC\uB9CC \uC0DD\uC131: ${item.id}`);
            item.resolve(null);
          }
        } finally {
          this.activeImageRequests--;
        }
      }
      /**
       * 시스템 상태 조회
       */
      getStatus() {
        return {
          storyQueue: this.storyQueue.length,
          imageQueue: this.imageQueue.length,
          activeStoryRequests: this.activeStoryRequests,
          activeImageRequests: this.activeImageRequests,
          isProcessing: this.isProcessing,
          maxConcurrent: {
            story: PARALLEL_CONFIG.MAX_STORY_CONCURRENT,
            image: PARALLEL_CONFIG.MAX_IMAGE_CONCURRENT
          }
        };
      }
      /**
       * 동시 스토리+이미지 생성 (고급 기능)
       */
      async generateStoryWithImage(storyParams, imageParams) {
        console.log("\u{1F680} \uB3D9\uC2DC \uC2A4\uD1A0\uB9AC+\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
        try {
          const [storyResult, imageResult] = await Promise.allSettled([
            this.generateStory(storyParams),
            // 이미지는 스토리 생성 후 업데이트된 정보로 다시 생성 가능하도록 지연
            (async () => {
              await new Promise((resolve) => setTimeout(resolve, 2e3));
              return this.generateImage(imageParams);
            })()
          ]);
          const story = storyResult.status === "fulfilled" ? storyResult.value : null;
          const image = imageResult.status === "fulfilled" ? imageResult.value : null;
          if (!story) {
            throw new Error("Story generation failed");
          }
          console.log("\u2705 \uB3D9\uC2DC \uC0DD\uC131 \uC644\uB8CC", {
            storySuccess: !!story,
            imageSuccess: !!image
          });
          return { story, image };
        } catch (error) {
          console.error("\u274C \uB3D9\uC2DC \uC0DD\uC131 \uC2E4\uD328:", error);
          throw error;
        }
      }
      /**
       * 리소스 정리
       */
      cleanup() {
        this.storyQueue = [];
        this.imageQueue = [];
        this.activeStoryRequests = 0;
        this.activeImageRequests = 0;
        this.isProcessing = false;
        console.log("\u{1F9F9} Gemini \uBCD1\uB82C\uCC98\uB9AC \uC2DC\uC2A4\uD15C \uC815\uB9AC \uC644\uB8CC");
      }
    };
    globalProcessor = null;
  }
});

// ../server/routes/password.ts
var password_exports = {};
__export(password_exports, {
  default: () => password_default
});
import { Router } from "express";
import bcrypt2 from "bcryptjs";
var router, password_default;
var init_password = __esm({
  "../server/routes/password.ts"() {
    "use strict";
    init_storage();
    router = Router();
    router.put("/password", async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session?.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        if (!currentPassword || !newPassword) {
          return res.status(400).json({ error: "Current password and new password are required" });
        }
        if (newPassword.length < 8) {
          return res.status(400).json({ error: "New password must be at least 8 characters" });
        }
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        if (user.googleId) {
          return res.status(400).json({ error: "Google accounts cannot change password" });
        }
        if (!user.password) {
          return res.status(400).json({ error: "No password set for this account" });
        }
        const isCurrentPasswordValid = await bcrypt2.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
        await storage.updateUserPassword(userId, newPassword);
        res.json({ message: "Password changed successfully" });
      } catch (error) {
        console.error("Password change error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    router.post("/forgot-password", async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        console.log(`Password reset requested for email: ${email}`);
        res.json({ message: "Password reset email sent" });
      } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    password_default = router;
  }
});

// ../server/index.ts
import express2 from "express";
import compression from "compression";

// ../server/routes.ts
init_storage();
init_legacy_story();
init_schema();
init_db();
import { createServer } from "http";
import { z as z2 } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import passport2 from "passport";

// ../server/auth/google.ts
init_storage();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
function configureGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not provided. Skipping Google authentication setup.");
    return;
  }
  const getCallbackURL = () => {
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "true" || process.env.REPLIT_DOMAINS?.includes("prenatale.replit.app")) {
      return `https://prenatale.replit.app/api/auth/google/callback`;
    }
    return `https://549abe74-698e-4e9f-88d4-6b26329da78f-00-1knbgb0cusmos.janeway.replit.dev/api/auth/google/callback`;
  };
  const callbackURL = getCallbackURL();
  console.log("Google OAuth callback URL:", callbackURL);
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth profile:", profile);
        let user = await storage.getUserByGoogleId(profile.id);
        if (user) {
          console.log("Existing Google user found:", user.id);
          if (!user.babyName || !user.babyDueDate || !user.relationship) {
            user.needsProfileCompletion = true;
          }
          return done(null, user);
        }
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await storage.getUserByEmail(email);
          if (user) {
            await storage.updateUser(user.id, {
              googleId: profile.id,
              profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl
            });
            console.log("Linked Google account to existing user:", user.id);
            return done(null, user);
          }
        }
        if (!email) {
          return done(new Error("No email provided by Google"));
        }
        const newUser = await storage.createUser({
          username: profile.displayName || email.split("@")[0],
          email,
          googleId: profile.id,
          profileImageUrl: profile.photos?.[0]?.value,
          language: "ko",
          // Default to Korean
          timezone: "Asia/Seoul",
          // Default timezone
          createdAt: /* @__PURE__ */ new Date(),
          // Leave baby info empty to require profile completion
          babyName: null,
          babyDueDate: null,
          relationship: null
        });
        newUser.needsProfileCompletion = true;
        console.log("Created new Google user (incomplete):", newUser.id);
        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  ));
}
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    if (user) {
      done(null, user);
    } else {
      console.log("User not found in database, clearing session for user:", id);
      done(null, null);
    }
  } catch (error) {
    console.error("Deserialize error:", error);
    done(null, null);
  }
});

// ../server/performance-monitor.ts
init_cache();
var PerformanceMonitor = class {
  requestCount = 0;
  errorCount = 0;
  responseTimeSum = 0;
  responseTimeCount = 0;
  startTime = Date.now();
  maxRequestsPerMinute = 6e3;
  // 100 requests per second
  maxResponseTime = 5e3;
  // 5 seconds
  // Request tracking
  recordRequest(responseTime) {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    this.responseTimeCount++;
    if (responseTime > this.maxResponseTime) {
      console.warn(`High response time detected: ${responseTime}ms`);
    }
  }
  recordError() {
    this.errorCount++;
  }
  // Health check endpoint data
  getHealthStats() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.responseTimeCount > 0 ? this.responseTimeSum / this.responseTimeCount : 0;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount * 100 : 0;
    return {
      uptime,
      totalRequests: this.requestCount,
      errorCount: this.errorCount,
      errorRate: `${errorRate.toFixed(2)}%`,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      cacheStats: performanceCache.getCacheStats(),
      healthy: errorRate < 5 && avgResponseTime < 1e3,
      // Less than 5% error rate and 1s avg response
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // Rate limiting check
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 6e4;
    if (this.requestCount > this.maxRequestsPerMinute) {
      console.warn("Rate limit exceeded");
      return false;
    }
    return true;
  }
  // Reset counters (called periodically)
  resetCounters() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.responseTimeCount = 0;
  }
  // Memory usage monitoring
  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
    };
  }
  // Database connection monitoring
  async checkDatabaseHealth() {
    try {
      const { db: db3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      await db3.execute("SELECT 1");
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
};
var performanceMonitor = new PerformanceMonitor();
setInterval(() => {
  performanceMonitor.resetCounters();
}, 60 * 60 * 1e3);

// ../server/middleware/performance.ts
function performanceMiddleware(req, res, next) {
  const startTime = Date.now();
  if (!performanceMonitor.checkRateLimit()) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later."
    });
  }
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);
    res.set({
      "X-Response-Time": `${responseTime}ms`,
      "X-Request-ID": req.headers["x-request-id"] || "unknown"
    });
    return originalJson.call(this, data);
  };
  res.on("error", () => {
    performanceMonitor.recordError();
  });
  next();
}
function errorHandlingMiddleware(err, req, res, next) {
  performanceMonitor.recordError();
  console.error("Request error:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  const isDev = process.env.NODE_ENV === "development";
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: isDev ? err.message : "Something went wrong",
    ...isDev && { stack: err.stack }
  });
}
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
}

// ../server/routes.ts
init_cache();
import bcrypt3 from "bcryptjs";

// ../server/portone.ts
import crypto from "crypto";
var PortoneService = class {
  apiSecret;
  baseUrl = "https://api.portone.io";
  constructor() {
    if (!process.env.PORTONE_API_SECRET) {
      console.warn("PORTONE_API_SECRET environment variable not found - PortOne features will be disabled");
      this.apiSecret = "";
      return;
    }
    this.apiSecret = process.env.PORTONE_API_SECRET;
  }
  /**
   * 결제 요청 생성
   */
  createPayment(request) {
    const { planType, userId, userEmail, userName } = request;
    const amount = planType === "monthly" ? 2500 : 24e3;
    const paymentId = `prena_${planType}_${userId}_${Date.now()}`;
    const merchantUid = `merchant_${Date.now()}_${userId}`;
    const orderName = planType === "monthly" ? "prena tale \uC6D4\uAC04 \uAD6C\uB3C5" : "prena tale \uC5F0\uAC04 \uAD6C\uB3C5";
    return {
      paymentId,
      merchantUid,
      amount,
      orderName
    };
  }
  /**
   * 결제 검증 및 처리
   */
  async verifyPayment(verification) {
    try {
      const { paymentId, merchantUid, userId } = verification;
      const paymentData = await this.getPaymentData(paymentId);
      if (!paymentData) {
        return { success: false, message: "\uACB0\uC81C \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" };
      }
      if (paymentData.status !== "PAID") {
        return { success: false, message: `\uACB0\uC81C\uAC00 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC0C1\uD0DC: ${paymentData.status}` };
      }
      if (paymentData.merchantUid !== merchantUid) {
        return { success: false, message: "\uC8FC\uBB38\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4" };
      }
      const expectedAmount = this.getExpectedAmount(paymentId);
      if (paymentData.amount !== expectedAmount) {
        return { success: false, message: "\uACB0\uC81C \uAE08\uC561\uC774 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4" };
      }
      return {
        success: true,
        message: "\uACB0\uC81C\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
        data: {
          paymentId,
          amount: paymentData.amount,
          paidAt: paymentData.paidAt,
          planType: this.getPlanTypeFromPaymentId(paymentId)
        }
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return { success: false, message: "\uACB0\uC81C \uAC80\uC99D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4" };
    }
  }
  /**
   * 포트원 API에서 결제 정보 조회
   */
  async getPaymentData(paymentId) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to get payment data:", error);
      return null;
    }
  }
  /**
   * 포트원 API 액세스 토큰 발급
   */
  async getAccessToken() {
    const response = await fetch(`${this.baseUrl}/login/api-secret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiSecret: this.apiSecret
      })
    });
    if (!response.ok) {
      throw new Error("Failed to get access token");
    }
    const data = await response.json();
    return data.accessToken;
  }
  /**
   * 결제 ID에서 예상 금액 추출
   */
  getExpectedAmount(paymentId) {
    if (paymentId.includes("monthly")) {
      return 2500;
    } else if (paymentId.includes("annual")) {
      return 24e3;
    }
    throw new Error("Invalid payment ID format");
  }
  /**
   * 결제 ID에서 플랜 타입 추출
   */
  getPlanTypeFromPaymentId(paymentId) {
    if (paymentId.includes("monthly")) {
      return "monthly";
    } else if (paymentId.includes("annual")) {
      return "annual";
    }
    throw new Error("Invalid payment ID format");
  }
  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto.createHmac("sha256", this.apiSecret).update(payload).digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }
};
var portoneService = new PortoneService();

// ../server/routes.ts
var loginSchema = z2.object({
  email: z2.string().email(),
  password: z2.string().min(8)
});
var getUserIdFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token && token.startsWith("user-")) {
      return parseInt(token.split("-")[1]);
    }
  }
  if (req.session.userId) {
    return req.session.userId;
  }
  return null;
};
async function registerRoutes(app2) {
  try {
    const { initializeParallelProcessor: initializeParallelProcessor2 } = await Promise.resolve().then(() => (init_gemini_parallel(), gemini_parallel_exports));
    initializeParallelProcessor2();
    console.log("\u2705 Gemini \uBCD1\uB82C\uCC98\uB9AC \uC2DC\uC2A4\uD15C \uD65C\uC131\uD654");
  } catch (error) {
    console.error("\u274C Gemini \uBCD1\uB82C\uCC98\uB9AC \uC2DC\uC2A4\uD15C \uCD08\uAE30\uD654 \uC2E4\uD328:", error);
  }
  const passwordRoutes = (await Promise.resolve().then(() => (init_password(), password_exports))).default;
  setupGracefulShutdown();
  app2.use("/api/users", passwordRoutes);
  app2.use(performanceMiddleware);
  const MemoryStoreSession = MemoryStore(session);
  app2.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    // Don't save empty sessions
    name: "connect.sid",
    // Use default session name
    store: new MemoryStoreSession({
      checkPeriod: 864e5
      // prune expired entries every 24h
    }),
    cookie: {
      secure: false,
      // Set to true in production with HTTPS
      httpOnly: false,
      // Allow JavaScript access for debugging
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 7 days
      sameSite: "none"
      // Allow cross-site cookies for preview
    }
  }));
  configureGoogleAuth();
  app2.use(passport2.initialize());
  app2.use(passport2.session());
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials found, setting up routes...");
    app2.get("/api/auth/google", (req, res, next) => {
      console.log("Google OAuth route hit");
      passport2.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    });
    app2.get(
      "/api/auth/google/callback",
      passport2.authenticate("google", { failureRedirect: "/login" }),
      async (req, res) => {
        const user = req.user;
        console.log("Google OAuth callback - user:", user);
        if (user) {
          req.session.userId = user.id;
          req.session.user = user;
          const token = `user-${user.id}`;
          const needsProfileCompletion = !user.babyName || !user.babyDueDate || !user.relationship;
          if (needsProfileCompletion) {
            res.redirect(`/google-profile-completion?token=${token}&google_signup=true`);
          } else {
            res.redirect(`/?token=${token}&userId=${user.id}`);
          }
        } else {
          res.redirect("/login?error=auth_failed");
        }
      }
    );
  } else {
    app2.get("/api/auth/google", (req, res) => {
      res.status(503).json({ message: "Google OAuth not configured" });
    });
    app2.get("/api/auth/google/callback", (req, res) => {
      res.status(503).json({ message: "Google OAuth not configured" });
    });
  }
  app2.post("/api/auth/complete-google-profile", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { username, babyName, babyDueDate, relationship, timezone, language } = req.body;
      if (!username || !babyName || !babyDueDate || !relationship) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const updatedUser = await storage.updateUser(userId, {
        username,
        babyName,
        babyDueDate: new Date(babyDueDate),
        relationship,
        timezone: timezone || "Asia/Seoul",
        language: language || "en"
      });
      req.session.user = updatedUser;
      res.json({ user: updatedUser, message: "Profile completed successfully" });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      if (email === "admin@prenatale.com" && password === "admin1234") {
        const adminUser = await storage.getUserByEmail("admin@prenatale.com");
        if (adminUser) {
          req.session.userId = adminUser.id;
          req.session.user = adminUser;
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
            } else {
              console.log("Admin session saved successfully for user:", adminUser.id);
            }
          });
          console.log("Admin login successful, returning token for user:", adminUser.id);
          res.json({ user: adminUser, token: `user-${adminUser.id}` });
          return;
        }
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email not found" });
      }
      if (!user.password) {
        return res.status(401).json({ message: "Please login with Google" });
      }
      const isPasswordValid = await bcrypt3.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      req.session.userId = user.id;
      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
      });
      res.json({ user, token: `user-${user.id}` });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
      }
    }
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "User already exists" });
      }
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(validatedData);
      req.session.userId = user.id;
      req.session.user = user;
      res.status(201).json({ user, token: `user-${user.id}` });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });
  app2.post("/api/auth/change-password", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      const user = await storage.getUser(authenticatedUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.googleId && !user.password) {
        return res.status(400).json({ message: "Google users cannot change password" });
      }
      if (!user.password) {
        return res.status(400).json({ message: "No password set for this account" });
      }
      const isCurrentPasswordValid = await bcrypt3.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      await storage.updateUserPassword(authenticatedUserId, newPassword);
      console.log(`Password changed successfully for user ${authenticatedUserId}`);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.get("/api/auth/user", async (req, res) => {
    console.log("Auth check - session userId:", req.session.userId, "user exists:", !!req.session.user);
    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader);
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      console.log("Token received:", token);
      if (token && token.startsWith("user-")) {
        const userId = parseInt(token.split("-")[1]);
        console.log("Extracting userId from token:", userId);
        try {
          const user = await storage.getUser(userId);
          if (user) {
            console.log("Token auth successful for user:", userId);
            if (user.googleId && (!user.babyName || !user.babyDueDate || !user.relationship)) {
              console.log("Google user needs profile completion:", userId);
              return res.json({ ...user, needsProfileCompletion: true });
            }
            console.log("Returning user with subscription info:", {
              id: user.id,
              subscriptionPlan: user.subscriptionPlan,
              subscriptionEndDate: user.subscriptionEndDate
            });
            return res.json(user);
          } else {
            console.log("User not found for userId:", userId);
          }
        } catch (error) {
          console.error("Token auth error:", error);
        }
      }
    }
    if (req.session.userId && req.session.user) {
      console.log("Session auth successful for user:", req.session.userId);
      const user = req.session.user;
      if (user.googleId && (!user.babyName || !user.babyDueDate || !user.relationship)) {
        console.log("Google user needs profile completion:", req.session.userId);
        return res.json({ ...user, needsProfileCompletion: true });
      }
      res.json(user);
    } else {
      console.log("No valid auth found, returning null");
      res.json(null);
    }
  });
  const logoutHandler = async (req, res) => {
    console.log("Logout called, current session:", req.session.userId);
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error("Passport logout error:", err);
        }
        req.session.userId = void 0;
        req.session.user = void 0;
        req.session.destroy((err2) => {
          if (err2) {
            console.error("Logout error:", err2);
            return res.status(500).json({ message: "Failed to logout" });
          }
          res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: false,
            secure: false,
            sameSite: "none"
          });
          res.json({ message: "Logged out successfully" });
        });
      });
    } else {
      req.session.userId = void 0;
      req.session.user = void 0;
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "none"
        });
        res.json({ message: "Logged out successfully" });
      });
    }
  };
  app2.post("/api/auth/logout", logoutHandler);
  app2.get("/api/logout", logoutHandler);
  app2.get("/api/stories/today", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      let language = "en";
      let timezone = "Asia/Seoul";
      if (!authenticatedUserId) {
        const acceptLanguage = req.headers["accept-language"] || "";
        language = acceptLanguage.toLowerCase().includes("ko") ? "ko" : "en";
        timezone = req.query.timezone || "Asia/Seoul";
      }
      const stories3 = await storage.getTodaysStories(authenticatedUserId, language, timezone);
      res.json(stories3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's stories" });
    }
  });
  app2.get("/api/stories/can-create-today", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const result = await storage.canCreateStoryToday(authenticatedUserId);
      res.json(result);
    } catch (error) {
      console.error("Error checking creation status:", error);
      res.status(500).json({ error: "Failed to check creation status" });
    }
  });
  app2.get("/api/stories/created", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stories3 = await storage.getCreatedStories(authenticatedUserId);
      res.json(stories3);
    } catch (error) {
      console.error("Error fetching created stories:", error);
      res.status(500).json({ error: "Failed to fetch created stories" });
    }
  });
  app2.get("/api/stories/uuid/:uuid", async (req, res) => {
    try {
      console.log("=== UUID ROUTE CALLED ===");
      const storyUuid = req.params.uuid;
      console.log("Story UUID:", storyUuid);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(storyUuid)) {
        return res.status(400).json({ message: "Invalid UUID format" });
      }
      const authenticatedUserId = getUserIdFromRequest(req);
      console.log("Authenticated User ID:", authenticatedUserId);
      let language = "en";
      if (authenticatedUserId) {
        try {
          const userResult = await pgClient`
            SELECT language FROM users WHERE id = ${authenticatedUserId}
          `;
          language = userResult[0]?.language || "en";
          console.log("User language:", language);
        } catch (error) {
          console.error("Error getting user language:", error);
          language = "en";
        }
      } else {
        const acceptLanguage = req.headers["accept-language"] || "";
        language = acceptLanguage.toLowerCase().includes("ko") ? "ko" : "en";
        console.log("Browser language detection:", language);
      }
      let storyResult;
      if (authenticatedUserId) {
        storyResult = await pgClient`
          SELECT s.id, s.story_uuid as "storyUuid", s.unique_id as "uniqueId",
                 s.title_ko as "titleKo", s.title_en as "titleEn",
                 s.content_ko as "contentKo", s.content_en as "contentEn", 
                 s.excerpt_ko as "excerptKo", s.excerpt_en as "excerptEn",
                 s.tags_ko as "tagsKo", s.tags_en as "tagsEn",
                 s.image_url as "imageUrl", s.reading_time as "readingTime",
                 s.is_created as "isCreated", s.status, s.created_at as "createdAt",
                 s.creator_id as "creatorId",
                 s.jisu_audio_url as "jisuAudioUrl", s.emma_audio_url as "emmaAudioUrl",
                 s.eunwoo_audio_url as "eunwooAudioUrl", s.noah_audio_url as "noahAudioUrl",
                 rp.read_at as "readAt", rp.first_read_at as "firstReadAt",
                 rp.is_favorite as "isFavorite"
          FROM stories s
          LEFT JOIN reading_progress rp ON s.id = rp.story_id AND rp.user_id = ${authenticatedUserId}
          WHERE s.story_uuid = ${storyUuid}
        `;
      } else {
        storyResult = await pgClient`
          SELECT s.id, s.story_uuid as "storyUuid", s.unique_id as "uniqueId",
                 s.title_ko as "titleKo", s.title_en as "titleEn",
                 s.content_ko as "contentKo", s.content_en as "contentEn", 
                 s.excerpt_ko as "excerptKo", s.excerpt_en as "excerptEn",
                 s.tags_ko as "tagsKo", s.tags_en as "tagsEn",
                 s.image_url as "imageUrl", s.reading_time as "readingTime",
                 s.is_created as "isCreated", s.status, s.created_at as "createdAt",
                 s.creator_id as "creatorId",
                 s.jisu_audio_url as "jisuAudioUrl", s.emma_audio_url as "emmaAudioUrl",
                 s.eunwoo_audio_url as "eunwooAudioUrl", s.noah_audio_url as "noahAudioUrl",
                 null as "readAt", null as "firstReadAt",
                 false as "isFavorite"
          FROM stories s
          WHERE s.story_uuid = ${storyUuid}
        `;
      }
      if (!storyResult[0]) {
        return res.status(404).json({ message: "Story not found" });
      }
      const rawStory = storyResult[0];
      if (rawStory.tagsKo && typeof rawStory.tagsKo === "string") {
        try {
          rawStory.tagsKo = JSON.parse(rawStory.tagsKo);
        } catch (e) {
          console.log("Failed to parse tagsKo:", rawStory.tagsKo);
        }
      }
      if (rawStory.tagsEn && typeof rawStory.tagsEn === "string") {
        try {
          rawStory.tagsEn = JSON.parse(rawStory.tagsEn);
        } catch (e) {
          console.log("Failed to parse tagsEn:", rawStory.tagsEn);
        }
      }
      const displayLanguage = (() => {
        if (rawStory.isCreated) {
          if (language === "ko") {
            return rawStory.titleKo ? "ko" : "en";
          } else {
            return rawStory.titleEn ? "en" : "ko";
          }
        } else {
          return language;
        }
      })();
      const legacyStory = convertToLegacyStory(rawStory, displayLanguage);
      legacyStory.isFavorite = rawStory.isFavorite || false;
      legacyStory.readAt = rawStory.readAt || null;
      legacyStory.firstReadAt = rawStory.firstReadAt || null;
      if (legacyStory.tags && typeof legacyStory.tags === "string") {
        try {
          legacyStory.tags = JSON.parse(legacyStory.tags);
        } catch (e) {
          legacyStory.tags = [legacyStory.tags];
        }
      }
      res.json(legacyStory);
    } catch (error) {
      console.error("Error fetching story by UUID:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });
  app2.get("/api/stories/:id(\\d+)", async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      const authenticatedUserId = getUserIdFromRequest(req);
      const story = await storage.getStoryById(storyId, authenticatedUserId || void 0);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });
  app2.get("/api/users/:userId/recently-read", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const limit = parseInt(req.query.limit) || 10;
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || "en";
      const recentlyRead = await storage.getRecentlyReadStories(authenticatedUserId, limit, userLanguage);
      res.json(recentlyRead);
    } catch (error) {
      console.error("Error fetching recently read stories:", error);
      res.status(500).json({ message: "Failed to fetch recently read stories" });
    }
  });
  app2.post("/api/reading-progress", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      console.log("Marking story as read:", req.body);
      console.log("Authenticated user ID:", authenticatedUserId);
      const storyId = typeof req.body.storyId === "number" ? req.body.storyId : parseInt(req.body.storyId);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      const requestData = {
        ...req.body,
        userId: authenticatedUserId,
        storyId
      };
      const validatedData = insertReadingProgressSchema.parse(requestData);
      console.log("Validated data:", validatedData);
      const progress = await storage.markStoryAsRead(validatedData);
      console.log("Story marked as read successfully:", progress);
      performanceCache.clearRecentlyRead(authenticatedUserId);
      res.json(progress);
    } catch (error) {
      console.error("Error marking story as read:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to mark story as read" });
      }
    }
  });
  app2.post("/api/users/:userId/stories/:storyId/favorite", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const storyId = parseInt(req.params.storyId);
      const progress = await storage.toggleFavorite(userId, storyId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite status" });
    }
  });
  app2.post("/api/reading-progress/favorite", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const storyId = typeof req.body.storyId === "number" ? req.body.storyId : parseInt(req.body.storyId);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      const hasAccess = await storage.canUserAccessStory(authenticatedUserId, storyId);
      if (!hasAccess) {
        console.log(`SECURITY: Access denied for user ${authenticatedUserId} to story ${storyId} when toggling favorite`);
        return res.status(403).json({ message: "Access denied. You can only favorite stories you have access to." });
      }
      console.log(`Toggling favorite for user ${authenticatedUserId}, story ${storyId}`);
      const progress = await storage.toggleFavorite(authenticatedUserId, storyId);
      res.json(progress);
    } catch (error) {
      console.error("Failed to toggle favorite status:", error);
      res.status(500).json({ message: "Failed to toggle favorite status" });
    }
  });
  app2.get("/api/users/:userId/weekly-reading", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const dates = await storage.getWeeklyReadingDates(userId);
      res.json(dates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly reading data" });
    }
  });
  app2.get("/api/users/:userId/all-reading-dates", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const dates = await storage.getAllReadingDates(userId);
      res.json(dates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all reading dates" });
    }
  });
  app2.get("/api/users/:userId/reading-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const progress = await storage.getUserReadingProgress(userId);
      const storiesRead = progress.filter((p) => p.isRead).length;
      const storiesCreated = await storage.getCreatedStories(userId);
      const createdCount = storiesCreated.length;
      const readDates = progress.filter((p) => p.isRead && p.readAt).map((p) => new Date(p.readAt)).sort((a, b) => b.getTime() - a.getTime());
      let streakDays = 0;
      if (readDates.length > 0) {
        const today = /* @__PURE__ */ new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastReadDate = readDates[0];
        const daysDiff = Math.floor((today.getTime() - lastReadDate.getTime()) / (1e3 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          streakDays = 1;
          for (let i = 1; i < readDates.length; i++) {
            const currentDate = readDates[i];
            const prevDate = readDates[i - 1];
            const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1e3 * 60 * 60 * 24));
            if (daysBetween === 1) {
              streakDays++;
            } else {
              break;
            }
          }
        }
      }
      const totalReadingTime = storiesRead * 2 * 60;
      const stats = {
        storiesRead,
        storiesCreated: createdCount,
        streakDays,
        totalReadingTime
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching reading stats:", error);
      res.status(500).json({ message: "Failed to fetch reading statistics" });
    }
  });
  app2.post("/api/cache/clear-all", (req, res) => {
    performanceCache.clearAll();
    res.json({ success: true, message: "All caches cleared" });
  });
  app2.get("/api/users/me", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });
  app2.put("/api/users/profile", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const {
        username,
        profileImageUrl,
        babyName,
        babyDueDate,
        relationship,
        timezone,
        language
      } = req.body;
      console.log("Updating user profile:", {
        userId,
        username,
        profileImageUrl,
        babyName,
        babyDueDate,
        relationship,
        timezone,
        language
      });
      const updatedUser = await storage.updateUser(userId, {
        username,
        profileImageUrl,
        babyName,
        babyDueDate: babyDueDate ? new Date(babyDueDate) : null,
        relationship,
        timezone,
        language
      });
      console.log("User profile updated:", updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  app2.delete("/api/users/me", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log("Deleting user account:", userId);
      req.session.userId = void 0;
      req.session.user = void 0;
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ error: "Failed to delete account" });
        }
        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "none"
        });
        console.log("User account deleted and session cleared");
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
  app2.post("/api/subscription/create", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { planType } = req.body;
      console.log("Creating subscription:", { userId, planType });
      res.json({
        message: "Subscription created successfully",
        sessionId: "sim_session_123",
        planType
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });
  app2.post("/api/subscription/cancel", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log("Cancelling subscription for user:", userId);
      const result = await storage.cancelUserSubscription(userId);
      if (result.success) {
        console.log("Subscription cancelled successfully:", result);
        res.json({
          message: result.message,
          newEndDate: result.newEndDate
        });
      } else {
        console.log("Subscription cancellation failed:", result.message);
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      console.log("Contact form submission:", { name, email, subject });
      res.json({ message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });
  app2.get("/api/user/stats", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stats = await storage.getUserStats(userId, 5);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });
  app2.get("/api/user/themes", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.set({
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
        // 30 min browser, 1 hour CDN
        "ETag": `themes-${userId}-${Date.now()}`
      });
      const stats = await storage.getUserStats(userId, 50);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user themes:", error);
      res.status(500).json({ error: "Failed to fetch user themes" });
    }
  });
  app2.get("/api/stories/library", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const filter = req.query.filter || "all";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || "en";
      const result = await storage.getLibraryStories(authenticatedUserId, filter, page, limit, userLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error fetching library stories:", error);
      res.status(500).json({ message: "Failed to fetch library stories" });
    }
  });
  app2.get("/api/stories/library/:filter", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const { filter } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || "en";
      const result = await storage.getLibraryStories(authenticatedUserId, filter, page, limit, userLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error fetching library stories:", error);
      res.status(500).json({ error: "Failed to fetch library stories" });
    }
  });
  app2.post("/api/stories/generate", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Unauthorized: No valid authentication" });
      }
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || "en";
      const { theme, character, length, message } = req.body;
      const canCreate = await storage.canCreateStoryToday(authenticatedUserId);
      if (!canCreate.canCreate) {
        return res.status(429).json({ error: "You can only create one story per day" });
      }
      const today = /* @__PURE__ */ new Date();
      const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
      const timeStr = today.toTimeString().split(" ")[0].replace(/:/g, "");
      const uniqueId = `uct${authenticatedUserId}${dateStr}${timeStr}`;
      const { getParallelProcessor: getParallelProcessor2 } = await Promise.resolve().then(() => (init_gemini_parallel(), gemini_parallel_exports));
      const { saveGeneratedImageToSupabase: saveGeneratedImageToSupabase2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
      console.log("\u{1F680} \uBCD1\uB82C\uCC98\uB9AC\uB85C \uC2A4\uD1A0\uB9AC+\uC774\uBBF8\uC9C0 \uB3D9\uC2DC \uC0DD\uC131 \uC2DC\uC791...");
      const parallelStart = Date.now();
      const processor = getParallelProcessor2();
      let generatedStory = null;
      let imageUrl = null;
      try {
        console.log("\u{1F4DD} \uC2A4\uD1A0\uB9AC \uC0DD\uC131 \uC2DC\uC791...");
        generatedStory = await processor.generateStory({
          theme,
          character,
          length,
          message,
          language: userLanguage
        });
        if (!generatedStory) {
          throw new Error("Story generation failed");
        }
        console.log("\u2705 \uC2A4\uD1A0\uB9AC \uC0DD\uC131 \uC131\uACF5:", generatedStory.title);
        console.log("\u{1F3A8} \uC0DD\uC131\uB41C \uC774\uBBF8\uC9C0 \uD504\uB86C\uD504\uD2B8:", generatedStory.imagePrompt);
        if (generatedStory.imagePrompt) {
          try {
            console.log("\u{1F3A8} \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791 (\uC2A4\uD1A0\uB9AC \uAE30\uBC18 \uD504\uB86C\uD504\uD2B8 \uC0AC\uC6A9)...");
            const illustration = await processor.generateImage({
              title: generatedStory.title,
              content: generatedStory.content,
              theme: theme.name,
              imagePrompt: generatedStory.imagePrompt
              // 스토리에서 생성된 프롬프트 사용
            });
            if (illustration?.imageBuffer) {
              console.log("\u{1F4F8} \uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC911... (\uBC84\uD37C \uD06C\uAE30:", illustration.imageBuffer.length, "bytes)");
              imageUrl = await saveGeneratedImageToSupabase2(illustration.imageBuffer, uniqueId);
              console.log("\u2705 \uC774\uBBF8\uC9C0 Supabase \uC800\uC7A5 \uC644\uB8CC:", imageUrl);
            } else {
              console.log("\u{1F3A8} \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328 - \uC2A4\uD1A0\uB9AC\uB9CC \uC0DD\uC131");
            }
          } catch (imageError) {
            console.error("\u274C \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328:", imageError);
          }
        } else {
          console.log("\u26A0\uFE0F \uC2A4\uD1A0\uB9AC\uC5D0 \uC774\uBBF8\uC9C0 \uD504\uB86C\uD504\uD2B8\uAC00 \uC5C6\uC74C - \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uAC74\uB108\uB700");
        }
        const totalTime = Date.now() - parallelStart;
        console.log(`\u26A1 \uC21C\uCC28 \uCC98\uB9AC \uC644\uB8CC (${totalTime}ms)`, {
          storySuccess: !!generatedStory,
          imageSuccess: !!imageUrl,
          imagePromptUsed: generatedStory.imagePrompt
        });
      } catch (processingError) {
        console.error("\u274C \uCC98\uB9AC \uC2DC\uC2A4\uD15C \uC624\uB958:", processingError);
        console.log("\u{1F504} \uC9C1\uC811 Gemini \uD568\uC218\uB85C \uD3F4\uBC31...");
        const { generateStory: generateStory2, generateStoryIllustration: generateStoryIllustration2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
        generatedStory = await generateStory2({
          theme,
          character,
          length,
          message,
          language: userLanguage
        });
        if (generatedStory?.imagePrompt) {
          try {
            const illustration = await generateStoryIllustration2(
              generatedStory.title,
              generatedStory.content,
              theme.name,
              generatedStory.imagePrompt
              // 스토리에서 생성된 프롬프트 사용
            );
            if (illustration?.imageBuffer) {
              imageUrl = await saveGeneratedImageToSupabase2(illustration.imageBuffer, uniqueId);
              console.log("\u2705 \uD3F4\uBC31 \uC774\uBBF8\uC9C0 \uC800\uC7A5 \uC644\uB8CC:", imageUrl);
            }
          } catch (imageError) {
            console.error("\u274C \uD3F4\uBC31 \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328:", imageError);
          }
        }
      }
      console.log("\u{1F50D} Debug - generatedStory state:", {
        exists: !!generatedStory,
        type: typeof generatedStory,
        hasTitle: generatedStory?.title ? true : false
      });
      if (!generatedStory) {
        console.error("\u274C Critical error: generatedStory is null");
        throw new Error("Story generation failed - no story data available");
      }
      const isKorean = userLanguage === "ko";
      console.log("\u{1F4BE} Saving story to database...");
      const storyData = {
        uniqueId,
        titleKo: isKorean ? generatedStory.title : null,
        titleEn: isKorean ? null : generatedStory.title,
        contentKo: isKorean ? generatedStory.content : null,
        contentEn: isKorean ? null : generatedStory.content,
        excerptKo: isKorean ? generatedStory.content.substring(0, 200) + "..." : null,
        excerptEn: isKorean ? null : generatedStory.content.substring(0, 200) + "...",
        tagsKo: isKorean ? Array.isArray(generatedStory.tags) ? generatedStory.tags : [] : null,
        tagsEn: isKorean ? null : Array.isArray(generatedStory.tags) ? generatedStory.tags : [],
        readingTime: generatedStory.readingTime,
        isCreated: true,
        isDaily: false,
        status: "active",
        creatorId: authenticatedUserId.toString(),
        imageUrl,
        createdAt: /* @__PURE__ */ new Date()
        // Explicitly set timestamp
      };
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Error generating story:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });
  app2.get("/api/gemini/status", async (req, res) => {
    try {
      const { getParallelProcessorStatus: getParallelProcessorStatus2 } = await Promise.resolve().then(() => (init_gemini_parallel(), gemini_parallel_exports));
      const status = getParallelProcessorStatus2();
      res.json({
        parallelProcessing: status || { status: "not_initialized" },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.json({
        parallelProcessing: { status: "error", error: error.message },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/health", async (req, res) => {
    try {
      const stats = performanceMonitor.getHealthStats();
      const memoryUsage = performanceMonitor.getMemoryUsage();
      const dbHealthy = await performanceMonitor.checkDatabaseHealth();
      res.json({
        ...stats,
        memory: memoryUsage,
        database: dbHealthy ? "healthy" : "unhealthy",
        version: process.env.npm_package_version || "1.0.0"
      });
    } catch (error) {
      res.status(500).json({
        error: "Health check failed",
        healthy: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/metrics", async (req, res) => {
    try {
      const stats = performanceMonitor.getHealthStats();
      const memoryUsage = performanceMonitor.getMemoryUsage();
      res.json({
        performance: {
          uptime: stats.uptime,
          totalRequests: stats.totalRequests,
          errorCount: stats.errorCount,
          errorRate: stats.errorRate,
          avgResponseTime: stats.avgResponseTime
        },
        memory: memoryUsage,
        cache: stats.cacheStats,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: "Metrics collection failed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  const requireAdmin = async (req, res, next) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const isAdmin = await storage.isAdmin(authenticatedUserId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      req.adminUserId = authenticatedUserId;
      next();
    } catch (error) {
      console.error("Error checking admin access:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  app2.get("/api/admin/check", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ isAdmin: false });
      }
      const isAdmin = await storage.isAdmin(authenticatedUserId);
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ isAdmin: false });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const result = await storage.getAllUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/users/subscriptions", requireAdmin, async (req, res) => {
    try {
      const result = await storage.getUsersWithSubscriptions();
      res.json(result);
    } catch (error) {
      console.error("Error fetching users with subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch users with subscriptions" });
    }
  });
  app2.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;
      const updatedUser = await storage.updateUserStatus(userId, status);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app2.get("/api/admin/stories", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const status = req.query.status;
      const result = await storage.getAllStories(page, limit, search, status);
      res.json(result);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });
  app2.get("/api/admin/stories/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getStoryAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching story analytics:", error);
      res.status(500).json({ message: "Failed to fetch story analytics" });
    }
  });
  app2.patch("/api/admin/stories/:id/status", requireAdmin, async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      const { status } = req.body;
      const updatedStory = await storage.updateStoryStatus(storyId, status);
      res.json(updatedStory);
    } catch (error) {
      console.error("Error updating story status:", error);
      res.status(500).json({ message: "Failed to update story status" });
    }
  });
  app2.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await storage.getAllCoupons(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });
  app2.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      console.log("Coupon creation request body:", JSON.stringify(req.body, null, 2));
      const couponData = insertCouponSchema.parse({
        ...req.body,
        createdBy: req.adminUserId
      });
      console.log("Parsed coupon data:", JSON.stringify(couponData, null, 2));
      const newCoupon = await storage.createCoupon(couponData);
      res.json(newCoupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });
  app2.post("/api/admin/coupons/bulk", requireAdmin, async (req, res) => {
    try {
      const { quantity, ...couponBase } = req.body;
      const coupons2 = Array.from({ length: quantity }, () => ({
        ...couponBase,
        createdBy: req.adminUserId
      }));
      const validatedCoupons = coupons2.map((coupon) => insertCouponSchema.parse(coupon));
      const newCoupons = await storage.createBulkCoupons(validatedCoupons);
      res.json(newCoupons);
    } catch (error) {
      console.error("Error creating bulk coupons:", error);
      res.status(500).json({ message: "Failed to create bulk coupons" });
    }
  });
  app2.get("/api/admin/coupons/:id/usage", requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const usage = await storage.getCouponUsage(couponId);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching coupon usage:", error);
      res.status(500).json({ message: "Failed to fetch coupon usage" });
    }
  });
  app2.patch("/api/admin/coupons/:id/status", requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const { isActive } = req.body;
      const updatedCoupon = await storage.updateCouponStatus(couponId, isActive);
      res.json(updatedCoupon);
    } catch (error) {
      console.error("Error updating coupon status:", error);
      res.status(500).json({ message: "Failed to update coupon status" });
    }
  });
  app2.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await storage.getAllSubscriptions(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/admin/subscriptions/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getSubscriptionAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Failed to fetch subscription analytics" });
    }
  });
  app2.get("/api/admin/api-usage", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const stats = await storage.getApiUsageStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching API usage stats:", error);
      res.status(500).json({ message: "Failed to fetch API usage stats" });
    }
  });
  app2.get("/api/admin/logs", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await storage.getAdminLogs(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });
  app2.post("/api/coupons/apply", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      const { couponCode } = req.body;
      if (!couponCode) {
        return res.status(400).json({ message: "Coupon code is required" });
      }
      const result = await storage.applyCouponForPrenaPlan(authenticatedUserId, couponCode);
      if (result.success) {
        res.json({
          message: result.message,
          subscription: result.subscription
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      res.status(500).json({ message: "Failed to apply coupon" });
    }
  });
  app2.post("/api/admin/create-admin", requireAdmin, async (req, res) => {
    try {
      const { userId, role, permissions } = req.body;
      const adminData = insertAdminSchema.parse({
        userId,
        role,
        permissions,
        createdBy: req.adminUserId
      });
      const newAdmin = await storage.createAdmin(adminData);
      res.json(newAdmin);
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });
  app2.post("/api/payment/portone/create", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!process.env.PORTONE_API_SECRET) {
        return res.status(503).json({ error: "Payment service temporarily unavailable" });
      }
      const { planType, userEmail, userName } = req.body;
      const paymentData = portoneService.createPayment({
        planType,
        userId,
        userEmail,
        userName
      });
      res.json(paymentData);
    } catch (error) {
      console.error("Error creating PortOne payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });
  app2.post("/api/payment/portone/verify", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!process.env.PORTONE_API_SECRET) {
        return res.status(503).json({ error: "Payment service temporarily unavailable" });
      }
      const { paymentId, merchantUid } = req.body;
      const verificationResult = await portoneService.verifyPayment({
        paymentId,
        merchantUid,
        userId
      });
      if (verificationResult.success) {
        const planType = paymentId.includes("monthly") ? "monthly" : "annual";
        const endDate = /* @__PURE__ */ new Date();
        if (planType === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        await storage.updateUserSubscription(userId, {
          subscriptionPlan: "prena",
          subscriptionEndDate: endDate,
          subscriptionStatus: "active"
        });
        performanceCache.invalidateUserCache(userId);
      }
      res.json(verificationResult);
    } catch (error) {
      console.error("Error verifying PortOne payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });
  app2.post("/api/webhooks/portone", async (req, res) => {
    try {
      const signature = req.headers["x-portone-signature"];
      const payload = JSON.stringify(req.body);
      if (!portoneService.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
      const { type, data } = req.body;
      if (type === "Payment.Paid") {
        const { paymentId, merchantUid, status } = data;
        console.log(`Payment webhook received: ${paymentId}, status: ${status}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing PortOne webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });
  app2.use(errorHandlingMiddleware);
  const httpServer = createServer(app2);
  return httpServer;
}

// ../server/vite.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// ../vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// ../server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// ../server/index.ts
var app = express2();
app.use(compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,
  // Only compress responses > 1KB
  level: 6,
  // Compression level (1-9)
  memLevel: 8,
  chunkSize: 16384
}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
