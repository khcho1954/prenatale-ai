import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, date, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
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
  createdAt: timestamp("created_at"),
});

// Use existing stories table structure from Supabase (match actual DB types)
// TFT stories: 1-1000, UCT stories: 1001+
export const stories = pgTable("stories", {
  id: integer("id").primaryKey(), // bigint in DB
  storyUuid: uuid("story_uuid").defaultRandom().notNull().unique(), // UUID for secure story access
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
  readingTime: integer("reading_time").default(5), // bigint in DB
  isDaily: boolean("is_daily").default(false),
  isCreated: boolean("is_created").default(false),
  status: text("status").default("published"),
  createdAt: timestamp("created_at").defaultNow(), // timestamp with time zone in DB
  creatorId: text("creator_id"),
  jisuAudioUrl: text("jisu_audio_url"),
  eunwooAudioUrl: text("eunwoo_audio_url"),
  emmaAudioUrl: text("emma_audio_url"),
  noahAudioUrl: text("noah_audio_url"),
});

export const readingProgress = pgTable("reading_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storyId: integer("story_id").references(() => stories.id).notNull(),
  readAt: timestamp("read_at"),
  firstReadAt: timestamp("first_read_at"), // 사용자가 처음 읽은 날짜 (TFT 날짜 표시용)
  isRead: boolean("is_read").default(false),
  isFavorite: boolean("is_favorite").default(false),
});

// 날짜별 읽기 기록을 위한 별도 테이블
export const readingDates = pgTable("reading_dates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  storyId: integer("story_id").references(() => stories.id).notNull(),
  readDate: date("read_date").notNull(), // DATE 타입으로 날짜만 저장
}, (table) => [
  // 사용자별 날짜별 인덱스 (월별 캘린더용)
  index("idx_reading_dates_user_date").on(table.userId, table.readDate),
]);

export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // 'gemini', 'openai', etc.
  operation: text("operation").notNull(), // 'story_generation', 'image_generation', etc.
  model: text("model").notNull(), // Model name used
  cost: text("cost").notNull(), // Estimated cost as string
  metadata: jsonb("metadata"), // Additional data like duration, tokens, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin tables
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("admin"), // 'admin', 'super_admin'
  permissions: jsonb("permissions"), // JSON array of permissions
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // Required field
  discountValue: text("discount_value").notNull(), // Required field - numeric in DB  
  duration: text("duration").notNull(), // Required field
  maxUses: integer("max_uses"), // null for unlimited
  currentUses: integer("current_uses").default(0),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  upgradeType: text("upgrade_type").default("duration_based"), // Optional with default
  planDuration: text("plan_duration").default("1_month"), // Optional with default
  planExpiryDate: timestamp("plan_expiry_date"), // For expiry_based upgrade type
});

export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").references(() => coupons.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planType: text("plan_type").notNull(), // 'free', 'premium_monthly', 'premium_yearly'
  status: text("status").notNull(), // 'active', 'cancelled', 'expired', 'pending'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id).notNull(),
  action: text("action").notNull(), // 'user_created', 'coupon_generated', 'story_approved', etc.
  targetType: text("target_type"), // 'user', 'story', 'coupon', etc.
  targetId: integer("target_id"),
  details: jsonb("details"), // Additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  googleId: true,
  profileImageUrl: true,
  babyName: true,
  babyDueDate: true,
  relationship: true,
  timezone: true,
  language: true,
}).extend({
  babyDueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const insertStorySchema = createInsertSchema(stories).pick({
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
  createdAt: true,
});

export const insertReadingProgressSchema = createInsertSchema(readingProgress).pick({
  userId: true,
  storyId: true,
  isRead: true,
  isFavorite: true,
});

export const insertReadingDateSchema = createInsertSchema(readingDates).pick({
  userId: true,
  storyId: true,
  readDate: true,
});

export const insertApiUsageSchema = createInsertSchema(apiUsage).pick({
  provider: true,
  operation: true,
  model: true,
  cost: true,
  metadata: true,
});

// Admin schemas
export const insertAdminSchema = createInsertSchema(admins).pick({
  userId: true,
  role: true,
  permissions: true,
  createdBy: true,
});

export const insertCouponSchema = createInsertSchema(coupons).pick({
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
  createdBy: true,
}).extend({
  discountType: z.string().default("upgrade"),
  discountValue: z.string().default("100"), // 100% discount for plan upgrade
  duration: z.string().default("1_month"),
  planExpiryDate: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') {
      return null;
    }
    return new Date(val);
  }),
  validFrom: z.string().transform((val) => {
    if (!val || val.trim() === '') {
      return new Date();
    }
    return new Date(val);
  }),
  validUntil: z.string().transform((val) => {
    if (!val || val.trim() === '') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return new Date(val);
  }),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  planType: true,
  status: true,
  startDate: true,
  endDate: true,
  autoRenew: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
}).extend({
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).pick({
  adminId: true,
  action: true,
  targetType: true,
  targetId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect & {
  jisuAudioUrl?: string | null;
  emmaAudioUrl?: string | null;
  type?: string;
  readAt?: string;
  isFavorite?: boolean;
};
export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type InsertReadingDate = z.infer<typeof insertReadingDateSchema>;
export type ReadingDate = typeof readingDates.$inferSelect;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;

// Admin types
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
