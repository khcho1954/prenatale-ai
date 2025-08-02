import { users, stories, readingProgress, readingDates, admins, coupons, subscriptions, couponUsage, adminLogs, apiUsage, type User, type InsertUser, type Story, type InsertStory, type ReadingProgress, type InsertReadingProgress, type ReadingDate, type InsertReadingDate, type Admin, type InsertAdmin, type Coupon, type InsertCoupon, type Subscription, type InsertSubscription, type AdminLog, type InsertAdminLog, type ApiUsage, type InsertApiUsage } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lt, inArray, isNotNull } from "drizzle-orm";
import { type LegacyStory, type SupabaseStory, convertToLegacyStory } from "@shared/legacy-story";
import { type Language, DEFAULT_LANGUAGE } from "@shared/language";
import { performanceCache } from "./cache";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Pick<User, 'username' | 'profileImageUrl' | 'googleId' | 'babyName' | 'babyDueDate' | 'relationship' | 'timezone' | 'language'>>): Promise<User>;
  updateUserPassword(id: number, newPassword: string): Promise<void>;
  verifyPassword(userId: number, password: string): Promise<boolean>;
  deleteUser(id: number): Promise<void>;
  
  getTodaysStories(userId?: number | null, browserLanguage?: string, timezone?: string): Promise<LegacyStory[]>;
  getStoryById(id: number): Promise<LegacyStory | undefined>;
  getStoryByUuid(uuid: string): Promise<LegacyStory | undefined>;
  getStoryByUuidWithProgress(userId: number | null, uuid: string): Promise<{ story: SupabaseStory | null; progress: ReadingProgress | null }>;
  createStory(story: InsertStory): Promise<LegacyStory>;
  
  getUserReadingProgress(userId: number): Promise<ReadingProgress[]>;
  getRecentlyReadStories(userId: number, limit?: number, language?: string): Promise<(ReadingProgress & { story: LegacyStory })[]>;
  markStoryAsRead(progress: InsertReadingProgress): Promise<ReadingProgress>;
  toggleFavorite(userId: number, storyId: number): Promise<ReadingProgress>;
  
  getWeeklyReadingDates(userId: number): Promise<Date[]>;
  getAllReadingDates(userId: number): Promise<Date[]>;
  getLibraryStories(userId: number, filter: string, page?: number, limit?: number, language?: string): Promise<{ stories: LegacyStory[]; hasMore: boolean; total: number }>;
  
  // Access control
  canUserAccessStory(userId: number | null, storyId: number): Promise<boolean>;
  getUserLanguage(userId: number | null): Promise<string>;
  
  // Creation limits
  canCreateStoryToday(userId: number): Promise<{ canCreate: boolean; hasCreatedToday: boolean }>;
  getCreatedStories(userId: number): Promise<LegacyStory[]>;
  
  // Statistics
  getUserStats(userId: number): Promise<{
    storiesRead: number;
    storiesCreated: number;
    themes: Array<{
      name: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  }>;

  // Admin methods
  isAdmin(userId: number): Promise<boolean>;
  getAdminByUserId(userId: number): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // User management
  getAllUsers(page?: number, limit?: number, search?: string): Promise<{ users: User[]; total: number }>;
  getUsersWithSubscriptions(): Promise<Array<User & { subscription?: Subscription }>>;
  updateUserStatus(userId: number, status: string): Promise<User>;
  
  // Content management
  getAllStories(page?: number, limit?: number, search?: string, status?: string): Promise<{ stories: Story[]; total: number }>;
  updateStoryStatus(storyId: number, status: string): Promise<Story>;
  getStoryAnalytics(): Promise<{
    total: number;
    published: number;
    draft: number;
    userGenerated: number;
    dailyStories: number;
  }>;
  
  // Coupon management
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  createBulkCoupons(coupons: InsertCoupon[]): Promise<Coupon[]>;
  getAllCoupons(page?: number, limit?: number): Promise<{ coupons: Coupon[]; total: number }>;
  getCouponUsage(couponId: number): Promise<Array<{ userId: number; username: string; usedAt: Date }>>;
  updateCouponStatus(couponId: number, isActive: boolean): Promise<Coupon>;
  
  // Subscription management
  getAllSubscriptions(page?: number, limit?: number): Promise<{ subscriptions: Array<Subscription & { user: User }>; total: number }>;
  getSubscriptionAnalytics(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    expired: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  }>;
  
  // API usage tracking
  logApiUsage(usage: InsertApiUsage): Promise<ApiUsage>;
  getApiUsageStats(startDate?: Date, endDate?: Date): Promise<{
    totalCost: number;
    totalRequests: number;
    byProvider: Array<{ provider: string; cost: number; requests: number }>;
    byOperation: Array<{ operation: string; cost: number; requests: number }>;
  }>;
  
  // Admin logging
  logAdminAction(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(page?: number, limit?: number): Promise<{ logs: Array<AdminLog & { admin: { user: User } }>; total: number }>;
  
  // Subscription business logic methods
  getUserActiveSubscription(userId: number): Promise<Subscription | null>;
  cancelUserSubscription(userId: number): Promise<{ success: boolean; message: string; newEndDate?: Date }>;
  applyCouponForPrenaPlan(userId: number, couponCode: string): Promise<{ success: boolean; message: string; newEndDate?: Date }>;
  extendSubscriptionWithCoupon(userId: number, coupon: Coupon): Promise<{ success: boolean; message: string; newEndDate: Date }>;
  updateUserSubscription(userId: number, subscriptionData: { subscriptionPlan: string; subscriptionEndDate: Date; subscriptionStatus: string }): Promise<void>;
}

// Database storage: Stories and User progress from database
export class DatabaseStorage implements IStorage {
  private language: Language = DEFAULT_LANGUAGE;

  async getUser(id: number): Promise<User | undefined> {
    try {
      // Check cache first
      const cacheKey = `user:${id}`;
      const cached = performanceCache.getUser(cacheKey);
      if (cached) {
        return cached;
      }

      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) {
        return undefined;
      }

      // Get active subscription info
      const [activeSubscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, id),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      // Add subscription info to user object
      const userWithSubscription = {
        ...user,
        subscriptionPlan: activeSubscription?.planType === 'prena_plan' ? 'prena' : 'free',
        subscriptionEndDate: activeSubscription?.endDate || null,
        subscriptionStatus: activeSubscription?.status || null
      };
      
      // Cache the result
      performanceCache.setUser(cacheKey, userWithSubscription);
      
      return userWithSubscription;
    } catch (error) {
      console.error('Database error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      return undefined;
    }
  }

  async updateUserPassword(id: number, newPassword: string): Promise<void> {
    try {
      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, id))
        .returning();
        
      if (!updatedUser) {
        throw new Error(`User with id ${id} not found`);
      }
      
      // Invalidate user cache
      performanceCache.invalidateUserCache(id);
    } catch (error) {
      console.error('Database error in updateUserPassword:', error);
      throw error;
    }
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.password) {
        return false;
      }
      
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Database error in verifyPassword:', error);
      return false;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error('Database error in deleteUser:', error);
      throw error;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByGoogleId:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Hash password if provided
      let userToInsert = { ...insertUser };
      if (insertUser.password) {
        const saltRounds = 12;
        userToInsert.password = await bcrypt.hash(insertUser.password, saltRounds);
      }
      
      const [user] = await db.insert(users).values(userToInsert).returning();
      return user;
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<Pick<User, 'username' | 'profileImageUrl' | 'googleId' | 'babyName' | 'babyDueDate' | 'relationship' | 'timezone' | 'language'>>): Promise<User> {
    try {
      const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      
      // Invalidate user-related caches
      performanceCache.invalidateUserCache(id);
      
      return user;
    } catch (error) {
      console.error('Database error in updateUser:', error);
      throw error;
    }
  }

  // Legacy cache properties removed - now using performanceCache

  async getTodaysStories(userId?: number | null, browserLanguage?: string, timezone?: string): Promise<LegacyStory[]> {
    try {
      // FIXED: Create stable timezone-aware date for consistent daily stories
      let todayDate = new Date();
      let userTimezone = timezone;
      
      // Get user's timezone if authenticated
      if (userId && !userTimezone) {
        const user = await this.getUser(userId);
        userTimezone = user?.timezone || 'Asia/Seoul'; // Default to KST for consistency
      }
      
      if (userTimezone) {
        todayDate = new Date(new Date().toLocaleString("en-US", { timeZone: userTimezone }));
      }
      const today = todayDate.toISOString().split('T')[0];
      
      // Cache key includes date to ensure daily refresh
      const cacheKey = `${userId || 'anon'}-${browserLanguage || 'en'}-${today}`;
      
      // Check high-performance cache first
      const cached = performanceCache.getTodaysStories(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Get user language
      let userLanguage = DEFAULT_LANGUAGE;
      if (userId) {
        const user = await this.getUser(userId);
        userLanguage = (user?.language as Language) || DEFAULT_LANGUAGE;
      } else if (browserLanguage?.startsWith('ko')) {
        userLanguage = 'ko';
      }
      

      
      // CRITICAL: Check global cache first for all stories (prevents repeated DB queries)
      const allStoriesCacheKey = 'all-daily-stories';
      let allStories = performanceCache.getAllDailyStories(allStoriesCacheKey);
      
      if (!allStories) {
        // Get all published stories with optimized query (select only needed fields)
        allStories = await db
          .select({
            id: stories.id,
            storyUuid: stories.storyUuid, // CRITICAL: Include UUID for secure routing
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
          })
          .from(stories)
          .where(and(
            eq(stories.isDaily, true),
            eq(stories.status, "active")
          ));
        
        // Cache for 1 hour - daily stories don't change frequently
        performanceCache.setAllDailyStories(allStoriesCacheKey, allStories);
      }
      
      // Use the timezone-aware date already calculated above
      const seed = this.createDateSeed(today, userId || 0);
      
      let selectedStories: any[] = [];
      
      if (userId) {
        // CRITICAL FIX: Use FIXED daily story selection regardless of read status
        // Always select from full story pool with consistent seed to ensure same stories per day
        const shuffled = this.shuffleWithSeed([...allStories], seed);
        selectedStories = shuffled.slice(0, 2);
        
        // Add user progress info for the fixed daily stories
        const relevantStoryIds = selectedStories.map(s => s.id);
        const allUserProgress = await db
          .select()
          .from(readingProgress)
          .where(and(
            eq(readingProgress.userId, userId),
            inArray(readingProgress.storyId, relevantStoryIds)
          ));
        
        const progressMap = new Map(allUserProgress.map(p => [p.storyId, p]));
        
        const storiesResult = selectedStories.map(story => {
          const legacyStory = convertToLegacyStory(story as SupabaseStory, userLanguage);
          const progress = progressMap.get(story.id);
          (legacyStory as any).isFavorite = progress ? progress.isFavorite : false;
          return legacyStory;
        });
        
        performanceCache.setTodaysStories(cacheKey, storiesResult);
        return storiesResult;
      } else {
        // For non-authenticated users, return random stories
        const shuffled = this.shuffleWithSeed([...allStories], seed);
        selectedStories = shuffled.slice(0, 2);
        
        const anonResult = selectedStories.map(story => convertToLegacyStory(story as SupabaseStory, userLanguage));
        
        performanceCache.setTodaysStories(cacheKey, anonResult);
        return anonResult;
      }
    } catch (error) {
      console.error('Database error in getTodaysStories:', error);
      return [];
    }
  }

  // Legacy cleanup method removed - now handled by performanceCache LRU system

  // 날짜와 사용자 ID를 조합하여 시드 생성
  private createDateSeed(dateString: string, userId: number): number {
    const dateNum = parseInt(dateString.replace(/-/g, ''));
    const seed = dateNum + userId;
    return seed;
  }

  // 시드 기반 Fisher-Yates 셔플
  private shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    
    // 시드 기반 랜덤 생성기 (Linear Congruential Generator)
    class SeededRandom {
      private seed: number;
      
      constructor(seed: number) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
      }
      
      next(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed;
      }
      
      nextFloat(): number {
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

  async getStoryById(databaseId: number, userId?: number): Promise<LegacyStory | undefined> {
    try {
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, databaseId));
      
      if (!story) return undefined;
      
      // For user-created stories, determine language from content; for daily stories, use user's preferred language
      let displayLanguage = DEFAULT_LANGUAGE;
      if (story.isCreated) {
        // 사용자 생성 스토리는 콘텐츠 존재 여부로 언어 결정
        displayLanguage = story.titleKo ? 'ko' : 'en';
      } else if (userId) {
        // 일일 스토리는 사용자 언어 설정에 따라 변경
        const user = await this.getUser(userId);
        displayLanguage = (user?.language as Language) || DEFAULT_LANGUAGE;
      }
      
      const legacyStory = convertToLegacyStory(story as SupabaseStory, displayLanguage);
      
      // If userId is provided, check if story is favorited by this user
      if (userId) {
        const [progress] = await db
          .select()
          .from(readingProgress)
          .where(and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.storyId, databaseId)
          ));
        
        // Add favorite status and read date to the story
        (legacyStory as any).isFavorite = progress ? progress.isFavorite : false;
        (legacyStory as any).readAt = progress ? progress.readAt : null;
        (legacyStory as any).providedAt = progress ? progress.readAt : null; // 사용자가 스토리를 제공받은 날짜
      }
      
      return legacyStory;
    } catch (error) {
      console.error('Database error in getStoryById:', error);
      return undefined;
    }
  }



  // NEW: Get story by UUID with progress information
  async getStoryByUuidWithProgress(userId: number | null, uuid: string): Promise<{ story: SupabaseStory | null; progress: ReadingProgress | null }> {
    try {
      const storyResult = await db.select().from(stories).where(eq(stories.storyUuid, uuid));
      
      if (storyResult.length === 0) {
        return { story: null, progress: null };
      }

      const story = storyResult[0];

      let progress = null;
      if (userId) {
        const progressResult = await db.select().from(readingProgress)
          .where(and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.storyId, story.id)
          ));
        
        progress = progressResult[0] || null;
      }

      return { story: story as SupabaseStory, progress };
    } catch (error) {
      console.error('Database error in getStoryByUuidWithProgress:', error);
      return { story: null, progress: null };
    }
  }

  // Add missing getStoryByUuid method for interface compliance
  async getStoryByUuid(uuid: string): Promise<LegacyStory | undefined> {
    try {
      const [story] = await db.select().from(stories).where(eq(stories.storyUuid, uuid));
      
      if (!story) return undefined;
      
      let displayLanguage = DEFAULT_LANGUAGE;
      if (story.isCreated) {
        displayLanguage = story.titleKo ? 'ko' : 'en';
      }
      
      return convertToLegacyStory(story as SupabaseStory, displayLanguage);
    } catch (error) {
      console.error('Database error in getStoryByUuid:', error);
      return undefined;
    }
  }

  // NEW: Get user language preference
  async getUserLanguage(userId: number | null): Promise<string> {
    if (!userId) return DEFAULT_LANGUAGE;
    
    try {
      const user = await this.getUser(userId);
      return (user?.language as Language) || DEFAULT_LANGUAGE;
    } catch (error) {
      console.error('Database error in getUserLanguage:', error);
      return DEFAULT_LANGUAGE;
    }
  }

  async createStory(insertStory: InsertStory): Promise<LegacyStory> {
    try {
      // UCT stories start from ID 1001, TFT stories are 1-1000
      let storyData = {
        ...insertStory,
        createdAt: insertStory.createdAt || new Date()
      };
      
      // If this is a user-created story (UCT), ensure ID starts from 1001 and increments properly
      if (insertStory.isCreated) {
        // Count existing UCT stories to get the next sequential ID
        const [uctCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(stories)
          .where(eq(stories.isCreated, true));
        
        const nextUctId = 1001 + (uctCount?.count || 0);
        storyData = { ...storyData, id: nextUctId };
      }
      
      console.log('Creating story with data:', JSON.stringify(storyData, null, 2));
      
      const [story] = await db.insert(stories).values(storyData).returning();
      
      console.log('Story created successfully:', JSON.stringify(story, null, 2));
      
      return convertToLegacyStory(story as SupabaseStory, this.language);
    } catch (error) {
      console.error('Database error in createStory:', error);
      throw error;
    }
  }

  async getUserReadingProgress(userId: number): Promise<ReadingProgress[]> {
    try {
      const progressList = await db
        .select()
        .from(readingProgress)
        .where(eq(readingProgress.userId, userId));
      return progressList;
    } catch (error) {
      console.error('Database error in getUserReadingProgress:', error);
      return [];
    }
  }

  async getRecentlyReadStories(userId: number, limit: number = 10, language?: string): Promise<(ReadingProgress & { story: LegacyStory })[]> {
    try {
      console.log(`Fetching recently read stories for user ${userId}`);
      
      // Check high-performance cache first
      const cacheKey = `recently:${userId}_${limit}_${language || 'default'}`;
      try {
        const cached = performanceCache.getRecentlyRead(cacheKey);
        if (cached) {
          console.log(`Cache hit for recently read stories for user ${userId}`);
          return cached;
        }
      } catch (cacheError) {
        console.warn('Cache error in getRecentlyReadStories, proceeding with database query:', cacheError);
      }
      
      // Get user's language preference if not provided - use cached user data
      if (!language) {
        const userCacheKey = `user:${userId}`;
        let user = performanceCache.getUser(userCacheKey);
        if (!user) {
          [user] = await db.select().from(users).where(eq(users.id, userId));
          if (user) {
            performanceCache.setUser(userCacheKey, user);
          }
        }
        language = user?.language || 'en';
      }
      
      // OPTIMIZED: Select only necessary story fields to reduce data transfer
      const progressWithStories = await db
        .select({
          id: readingProgress.id,
          userId: readingProgress.userId,
          storyId: readingProgress.storyId,
          readAt: readingProgress.readAt,
          firstReadAt: readingProgress.firstReadAt,
          isRead: readingProgress.isRead,
          isFavorite: readingProgress.isFavorite,
          // Select only needed story fields for faster query
          storyId_db: stories.id,
          storyUuid: stories.storyUuid, // CRITICAL: Include UUID for secure routing
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
        })
        .from(readingProgress)
        .innerJoin(stories, eq(readingProgress.storyId, stories.id))
        .where(and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.isRead, true)
        ))
        .orderBy(desc(readingProgress.readAt))
        .limit(limit);

      console.log(`Found ${progressWithStories.length} actually read stories for user ${userId}`);
      
      const result = progressWithStories.map(row => {
        // 사용자 생성 스토리는 콘텐츠 존재 여부로 언어 결정, 일일 스토리는 사용자 언어 설정 사용
        const displayLanguage = row.isCreated 
          ? (row.titleKo ? 'ko' : 'en')
          : language; // 최근 읽은 스토리는 현재 사용자 언어 설정 사용
        
        // Create story object with only needed fields
        const storyData = {
          id: row.storyId_db,
          storyUuid: row.storyUuid, // CRITICAL: Include UUID for secure routing
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
          readAt: row.readAt, // 읽은 날짜 정보 전달
          firstReadAt: row.firstReadAt, // 처음 읽은 날짜 정보 전달
          createdAt: new Date(), // 기본값 설정
          readingTime: 5, // 기본값 설정
          status: 'active', // 기본값 설정
          creatorId: null // 기본값 설정
        };
        
        return {
          id: row.id,
          userId: row.userId,
          storyId: row.storyId,
          readAt: row.readAt,
          firstReadAt: row.firstReadAt,
          isRead: row.isRead,
          isFavorite: row.isFavorite,
          story: convertToLegacyStory(storyData as SupabaseStory, displayLanguage as Language)
        };
      });

      // Cache the result with longer TTL for recently read
      try {
        performanceCache.setRecentlyRead(cacheKey, result);
        console.log(`Cached recently read stories with key: ${cacheKey}`);
      } catch (cacheError) {
        console.warn('Cache error in setRecentlyRead:', cacheError);
      }

      return result;
    } catch (error) {
      console.error('Database error in getRecentlyReadStories:', error);
      return [];
    }
  }

  async markStoryAsRead(insertProgress: InsertReadingProgress): Promise<ReadingProgress> {
    try {
      // OPTIMIZED: Use upsert to reduce from 2 queries to 1
      const [progress] = await db
        .insert(readingProgress)
        .values({
          userId: insertProgress.userId,
          storyId: insertProgress.storyId,
          isRead: true,
          readAt: new Date(),
          firstReadAt: new Date(), // 처음 읽는 경우 firstReadAt 설정
          isFavorite: false,
        })
        .onConflictDoUpdate({
          target: [readingProgress.userId, readingProgress.storyId],
          set: { 
            isRead: true, 
            readAt: new Date() // Always update readAt to current time for Recently read ordering
            // firstReadAt은 업데이트하지 않음 (처음 읽은 날짜 유지)
          }
        })
        .returning();

      // Also record in reading_dates for calendar history
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      await db
        .insert(readingDates)
        .values({
          userId: insertProgress.userId,
          storyId: insertProgress.storyId,
          readDate: today
        })
        .onConflictDoNothing(); // Don't overwrite if already exists for today
      
      console.log('Story marked as read successfully:', progress);
      
      // Invalidate relevant caches but PRESERVE today's stories cache (fixed daily stories)
      console.log(`Invalidating caches for user ${insertProgress.userId}`);
      performanceCache.invalidateUserCache(insertProgress.userId);
      performanceCache.clearRecentlyRead(insertProgress.userId);
      performanceCache.clearReadStoryIds(insertProgress.userId);
      // NOTE: Do NOT clear today's stories cache - daily stories should remain fixed for the entire day
      
      return progress;
    } catch (error) {
      console.error('Database error in markStoryAsRead:', error);
      throw error;
    }
  }

  async toggleFavorite(userId: number, storyId: number): Promise<ReadingProgress> {
    try {
      // OPTIMIZED: Use upsert to reduce from 2 queries to 1 query
      // This eliminates the need for separate SELECT and UPDATE/INSERT operations
      const [result] = await db
        .insert(readingProgress)
        .values({
          userId,
          storyId,
          isRead: false,
          isFavorite: true,
          readAt: null,
        })
        .onConflictDoUpdate({
          target: [readingProgress.userId, readingProgress.storyId],
          set: {
            isFavorite: sql`NOT ${readingProgress.isFavorite}` // Toggle the current value
          }
        })
        .returning();

      // Clear only relevant caches without heavy invalidation
      performanceCache.clearRecentlyRead(userId);
      
      return result;
    } catch (error) {
      console.error('Database error in toggleFavorite:', error);
      throw error;
    }
  }

  async getWeeklyReadingDates(userId: number): Promise<Date[]> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Use reading_dates table for accurate calendar history
      const result = await db
        .select({
          date: readingDates.readDate
        })
        .from(readingDates)
        .where(and(
          eq(readingDates.userId, userId),
          gte(readingDates.readDate, oneWeekAgo.toISOString().split('T')[0])
        ))
        .groupBy(readingDates.readDate)
        .orderBy(desc(readingDates.readDate));

      return result.map(row => new Date(row.date));
    } catch (error) {
      console.error('Database error in getWeeklyReadingDates:', error);
      return [];
    }
  }

  async getAllReadingDates(userId: number): Promise<Date[]> {
    try {
      // Use reading_dates table for accurate calendar history
      const result = await db
        .select({
          date: readingDates.readDate
        })
        .from(readingDates)
        .where(eq(readingDates.userId, userId))
        .groupBy(readingDates.readDate)
        .orderBy(desc(readingDates.readDate));

      return result.map(row => new Date(row.date));
    } catch (error) {
      console.error('Database error in getAllReadingDates:', error);
      return [];
    }
  }

  async getLibraryStories(userId: number, filter: string, page: number = 1, limit: number = 20, language?: string): Promise<{ stories: LegacyStory[]; hasMore: boolean; total: number }> {
    try {
      console.log(`Getting library stories for user ${userId}, filter: ${filter}, page: ${page}, limit: ${limit}`);
      
      // Get user's language preference if not provided
      if (!language) {
        const user = await this.getUser(userId);
        language = user?.language || 'en';
      }
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Get user's progress for favorite status and reading status
      const userProgress = await db
        .select()
        .from(readingProgress)
        .where(eq(readingProgress.userId, userId));
      
      const progressMap = new Map(
        userProgress.map(p => [p.storyId, p])
      );
      
      const addFavoriteStatus = (story: any) => {
        // 사용자 생성 스토리는 콘텐츠 존재 여부로 언어 결정, 일일 스토리는 사용자 언어 설정 사용
        const displayLanguage = story.isCreated 
          ? (story.titleKo ? 'ko' : 'en')
          : language;
        
        const legacyStory = convertToLegacyStory(story as SupabaseStory, displayLanguage as Language);
        const storyIdNum = parseInt(story.id);
        const progress = progressMap.get(storyIdNum);
        (legacyStory as any).isFavorite = progress ? progress.isFavorite : false;
        return legacyStory;
      };
      
      if (filter === 'favorites') {
        // Favorites: 해당 User가 favorite 표시한 story
        const favoriteProgress = userProgress.filter(p => p.isFavorite);
        
        if (favoriteProgress.length === 0) return { stories: [], hasMore: false, total: 0 };
        
        // Get stories with reading progress for sorting - OPTIMIZED: Single query with IN clause
        const favoriteStoryIds = favoriteProgress.map(p => p.storyId);
        const favoriteStories = await db
          .select()
          .from(stories)
          .where(and(
            inArray(stories.id, favoriteStoryIds),
            eq(stories.status, "active")
          ));
        
        // Map stories with their readAt times
        const favoriteProgressWithStories = favoriteStories.map(story => {
          const progress = favoriteProgress.find(p => p.storyId === story.id);
          return progress ? { ...story, readAt: progress.readAt } : null;
        }).filter(Boolean);
        
        // Filter out null values and sort by readAt (most recent first)
        const validStories = favoriteProgressWithStories
          .filter(story => story !== null)
          .sort((a, b) => {
            if (!b.readAt || !a.readAt) return 0;
            return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
          });
        
        // Apply pagination
        const total = validStories.length;
        const paginatedStories = validStories.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        
        return {
          stories: paginatedStories.map(addFavoriteStatus),
          hasMore,
          total
        };
      } else if (filter === 'created') {
        // Created: 해당 User가 직접 생성한 tale(uct) 노출 (읽음 여부 무관)
        const allCreatedStories = await db
          .select()
          .from(stories)
          .where(and(
            eq(stories.isCreated, true), 
            eq(stories.creatorId, userId.toString()),
            eq(stories.status, "active")
          ))
          .orderBy(desc(stories.createdAt));
        
        // Apply pagination
        const total = allCreatedStories.length;
        const paginatedStories = allCreatedStories.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        
        return {
          stories: paginatedStories.map(addFavoriteStatus),
          hasMore,
          total
        };
      } else if (filter === 'today') {
        // Today's: 해당 User가 여태까지 읽은 모든 Daily Story (tft)
        const readProgress = userProgress.filter(p => p.isRead);
        
        if (readProgress.length === 0) return { stories: [], hasMore: false, total: 0 };
        
        // Get stories with reading progress for sorting
        const readProgressWithStories = await Promise.all(
          readProgress.map(async (progress) => {
            const [story] = await db
              .select()
              .from(stories)
              .where(and(
                eq(stories.id, progress.storyId),
                eq(stories.isDaily, true),
                eq(stories.status, "active")
              ));
            
            return story ? { ...story, readAt: progress.readAt } : null;
          })
        );
        
        // Filter out null values and sort by readAt (most recent first)
        const validStories = readProgressWithStories
          .filter(story => story !== null)
          .sort((a, b) => {
            if (!b.readAt || !a.readAt) return 0;
            return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
          });
        
        // Apply pagination
        const total = validStories.length;
        const paginatedStories = validStories.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        
        return {
          stories: paginatedStories.map(addFavoriteStatus),
          hasMore,
          total
        };
      } else {
        // All: 읽은 스토리 + 생성한 스토리 모두 표시
        const [readDailyStoriesWithDate, createdStories] = await Promise.all([
          // Read daily stories with their readAt dates
          (async () => {
            const readProgress = await db
              .select()
              .from(readingProgress)
              .where(and(
                eq(readingProgress.userId, userId),
                eq(readingProgress.isRead, true)
              ));
            
            if (readProgress.length === 0) return [];
            
            const readDailyStories = await db
              .select()
              .from(stories)
              .where(and(
                inArray(stories.id, readProgress.map(p => p.storyId)),
                eq(stories.isDaily, true),
                eq(stories.status, "active")
              ));
            
            return readDailyStories.map(story => {
              const progress = readProgress.find(p => p.storyId === story.id);
              const result = progress ? { ...story, readAt: progress.readAt } : null;
              if (result && progress) {
                console.log(`Story ${story.id} readAt: ${progress.readAt}`);
              }
              return result;
            }).filter(Boolean);
          })(),
          // Created stories
          db
            .select()
            .from(stories)
            .where(and(
              eq(stories.isCreated, true),
              eq(stories.creatorId, userId.toString()),
              eq(stories.status, "active")
            ))
            .orderBy(desc(stories.createdAt))
        ]);
        
        // Filter out null values and add createdAt as readAt for created stories
        const validReadStories = readDailyStoriesWithDate.filter(story => story !== null);
        const createdStoriesWithDate = createdStories.map(story => ({
          ...story,
          readAt: story.createdAt
        }));
        
        // Combine and sort by readAt/createdAt (most recent first)
        const combinedStories = [...validReadStories, ...createdStoriesWithDate];
        combinedStories.sort((a, b) => {
          if (!b.readAt || !a.readAt) return 0;
          return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
        });
        
        // Apply pagination
        const total = combinedStories.length;
        const paginatedStories = combinedStories.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        
        return {
          stories: paginatedStories.map(story => {
            // 사용자 생성 스토리는 콘텐츠 존재 여부로 언어 결정, 일일 스토리는 사용자 언어 설정 사용
            const displayLanguage = story.isCreated 
              ? (story.titleKo ? 'ko' : 'en')
              : language;
            
            const legacyStory = convertToLegacyStory(story as SupabaseStory, displayLanguage as Language);
            const storyIdNum = parseInt(story.id.toString());
            const progress = progressMap.get(storyIdNum);
            (legacyStory as any).isFavorite = progress ? progress.isFavorite : false;
            (legacyStory as any).readAt = story.readAt; // 중요: readAt 정보 전달
            return legacyStory;
          }),
          hasMore,
          total
        };
      }
    } catch (error) {
      console.error('Database error in getLibraryStories:', error);
      return { stories: [], hasMore: false, total: 0 };
    }
  }

  // NEW: UUID-based story retrieval with simplified access control
  async getStoryByUuidSimple(storyUuid: string, userId?: number, language?: Language): Promise<LegacyStory | undefined> {
    try {
      // OPTIMIZED: Direct UUID lookup without complex permission checks (UUID acts as access key)
      const [story] = await db
        .select({
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
          noahAudioUrl: stories.noahAudioUrl,
        })
        .from(stories)
        .where(eq(stories.storyUuid, storyUuid));

      if (!story) {
        return undefined;
      }

      // SIMPLIFIED: Only check basic access requirements
      if (story.status !== "active") {
        return undefined;
      }

      // For user-created stories, only allow access by creator (maintain some security)
      if (story.isCreated && userId && story.creatorId !== userId.toString()) {
        return undefined;
      }

      // 사용자 생성 스토리는 콘텐츠 존재 여부로 언어 결정, 일일 스토리는 사용자 언어 설정 사용
      const displayLanguage = story.isCreated 
        ? (story.titleKo ? 'ko' : 'en')
        : (language || DEFAULT_LANGUAGE);

      // Get user progress if userId provided
      let progress: ReadingProgress | null = null;
      if (userId) {
        [progress] = await db
          .select()
          .from(readingProgress)
          .where(and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.storyId, story.id)
          ));
      }

      const legacyStory = convertToLegacyStory(story as SupabaseStory, displayLanguage);
      (legacyStory as any).isFavorite = progress ? progress.isFavorite : false;

      return legacyStory;
    } catch (error) {
      console.error('Database error in getStoryByUuid:', error);
      return undefined;
    }
  }

  // ULTRA-MINIMAL: Only essential security checks (UUID system provides primary security)
  async canUserAccessStory(userId: number | null, storyId: number): Promise<boolean> {
    // UUID 시스템 사용 시 이 함수는 거의 불필요하지만, 
    // 레거시 API 호환성을 위해 최소한의 검사만 수행
    if (!userId) return false;
    
    try {
      // 단일 쿼리로 필수 정보만 확인
      const [story] = await db
        .select({ status: stories.status })
        .from(stories)
        .where(eq(stories.id, storyId));
        
      return story?.status === "active";
    } catch {
      return false;
    }
  }

  async canCreateStoryToday(userId: number): Promise<{ canCreate: boolean; hasCreatedToday: boolean }> {
    try {
      console.log(`Checking creation limit for user ${userId}`);
      
      // Get user's timezone for accurate date calculation
      const user = await this.getUser(userId);
      const userTimezone = user?.timezone || 'UTC';

      // Get current date in user's timezone
      const now = new Date();
      const today = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
      
      // Calculate start and end of today in user's timezone
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // OPTIMIZED: Query only today's stories instead of all user stories
      const todayStories = await db
        .select({ id: stories.id })
        .from(stories)
        .where(and(
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
      console.error('Database error in canCreateStoryToday:', error);
      return { canCreate: false, hasCreatedToday: false };
    }
  }



  async getCreatedStories(userId: number): Promise<LegacyStory[]> {
    try {
      const supabaseStories = await db
        .select()
        .from(stories)
        .where(and(
          eq(stories.creatorId, userId.toString()),
          eq(stories.status, "active")
        ))
        .orderBy(desc(stories.createdAt));
      
      return supabaseStories.map(story => {
        // 사용자 생성 스토리는 콘텐츠 존재 여부로 언어 결정
        const originalLanguage = story.titleKo ? 'ko' : 'en';
        return convertToLegacyStory(story as SupabaseStory, originalLanguage);
      });
    } catch (error) {
      console.error('Database error in getCreatedStories:', error);
      return [];
    }
  }

  async getUserStats(userId: number, limit: number = 5): Promise<{
    storiesRead: number;
    storiesCreated: number;
    themes: Array<{
      name: string;
      count: number;
      percentage: number;
      color: string;
    }>;
  }> {
    try {
      // Check high-performance cache first with themes indicator
      const cacheKey = limit > 10 ? `themes:${userId}_${limit}` : `stats:${userId}_${limit}`;
      const cached = performanceCache.getUserStats(cacheKey);
      if (cached) {
        console.log(`Cache hit for user ${limit > 10 ? 'themes' : 'stats'} for user ${userId}`);
        return cached;
      }

      // Get user's language preference
      const user = await this.getUser(userId);
      const userLanguage = user?.language || 'en';
      
      // OPTIMIZED: Use aggregation queries instead of fetching all records
      const [readStoriesCount, createdStoriesCount] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(readingProgress)
          .where(and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.isRead, true)
          )),
        db
          .select({ count: sql<number>`count(*)` })
          .from(stories)
          .where(and(
            eq(stories.isCreated, true),
            eq(stories.creatorId, userId.toString()),
            eq(stories.status, "active")
          ))
      ]);

      const storiesRead = readStoriesCount[0]?.count || 0;
      const storiesCreated = createdStoriesCount[0]?.count || 0;

      let themes: Array<{
        name: string;
        count: number;
        percentage: number;
        color: string;
      }> = [];

      if (storiesRead > 0) {
        // ULTRA-OPTIMIZED: Select only necessary tag fields instead of full story objects
        const readStoriesWithTags = await db
          .select({
            isCreated: stories.isCreated,
            titleKo: stories.titleKo,
            tagsKo: stories.tagsKo,
            tagsEn: stories.tagsEn
          })
          .from(readingProgress)
          .innerJoin(stories, eq(readingProgress.storyId, stories.id))
          .where(and(
            eq(readingProgress.userId, userId),
            eq(readingProgress.isRead, true),
            eq(stories.status, "active")
          ));

        // Extract and count themes from tags - optimized processing
        const themeCount = new Map<string, number>();
        let totalThemes = 0;

        // Process all stories in a single loop with optimized tag processing
        for (const story of readStoriesWithTags) {
          // For user-created stories, use the original creation language
          // For daily stories, use the user's language preference
          let tags: string[] | null = null;
          if (story.isCreated) {
            // Use original language tags for user-created stories
            tags = story.titleKo ? (story.tagsKo as string[] | null) : (story.tagsEn as string[] | null);
          } else {
            // Use user's language preference for daily stories
            tags = userLanguage === 'ko' ? (story.tagsKo as string[] | null) : (story.tagsEn as string[] | null);
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

        // Convert to array with percentages and colors (pastel palette)
        const themeColors = [
          '#8E7CC3', '#5CBDB9', '#FFB6A3', '#7CC39F', '#E6C074',
          '#B8A8D9', '#7DD4D1', '#FFD1C7', '#98D1B5', '#F0D09B',
          '#C8B9E6', '#9EE8E5', '#FFE8E1', '#B5E0CA', '#F5DFB8'
        ];

        themes = Array.from(themeCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit) // Limit themes based on parameter
          .map(([name, count], index) => ({
            name,
            count,
            percentage: totalThemes > 0 ? Math.round((count / totalThemes) * 100) : 0,
            color: themeColors[index % themeColors.length]
          }));
      }

      const result = {
        storiesRead,
        storiesCreated,
        themes
      };

      // Cache the result
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
  async isAdmin(userId: number): Promise<boolean> {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
      return !!admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async getAdminByUserId(userId: number): Promise<Admin | undefined> {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.userId, userId));
      return admin;
    } catch (error) {
      console.error('Error getting admin by user ID:', error);
      return undefined;
    }
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  // User management
  async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<{ users: User[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [usersResult, countResult] = await Promise.all([
        db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
        db.select({ count: sql<number>`count(*)` }).from(users)
      ]);
      
      return {
        users: usersResult,
        total: countResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { users: [], total: 0 };
    }
  }

  async getUsersWithSubscriptions(): Promise<Array<User & { subscription?: Subscription }>> {
    try {
      const result = await db
        .select()
        .from(users)
        .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
        .orderBy(desc(users.createdAt));
      
      return result.map((row: any) => ({
        ...row.users,
        subscription: row.subscriptions || undefined
      }));
    } catch (error) {
      console.error('Error getting users with subscriptions:', error);
      return [];
    }
  }

  async updateUserStatus(userId: number, status: string): Promise<User> {
    // For now, we'll store status in a metadata field since we don't have a status column
    const [updatedUser] = await db.update(users)
      .set({ username: users.username } as any)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Content management
  async getAllStories(page: number = 1, limit: number = 20, search?: string, status?: string): Promise<{ stories: Story[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      let query = db.select().from(stories);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(stories);
      
      const conditions = [];
      
      if (search) {
        conditions.push(sql`${stories.titleKo} ILIKE ${'%' + search + '%'} OR ${stories.titleEn} ILIKE ${'%' + search + '%'}`);
      }
      
      if (status) {
        conditions.push(eq(stories.status, status));
      }
      
      if (conditions.length > 0) {
        const combinedCondition = conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`;
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
      console.error('Error getting all stories:', error);
      return { stories: [], total: 0 };
    }
  }

  async updateStoryStatus(storyId: number, status: string): Promise<Story> {
    const [updatedStory] = await db.update(stories)
      .set({ status })
      .where(eq(stories.id, storyId))
      .returning();
    return updatedStory;
  }

  async getStoryAnalytics(): Promise<{
    total: number;
    published: number;
    draft: number;
    userGenerated: number;
    dailyStories: number;
  }> {
    try {
      const result = await db
        .select({
          total: sql<number>`count(*)`,
          published: sql<number>`count(case when status = 'published' then 1 end)`,
          draft: sql<number>`count(case when status = 'draft' then 1 end)`,
          userGenerated: sql<number>`count(case when is_created = true then 1 end)`,
          dailyStories: sql<number>`count(case when is_daily = true then 1 end)`
        })
        .from(stories);
      
      return result[0] || { total: 0, published: 0, draft: 0, userGenerated: 0, dailyStories: 0 };
    } catch (error) {
      console.error('Error getting story analytics:', error);
      return { total: 0, published: 0, draft: 0, userGenerated: 0, dailyStories: 0 };
    }
  }

  // Coupon management
  private generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PRENA-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createCoupon(coupon: Omit<InsertCoupon, 'code'>): Promise<Coupon> {
    const code = this.generateCouponCode();
    const [newCoupon] = await db.insert(coupons).values({ ...coupon, code }).returning();
    return newCoupon;
  }

  async createBulkCoupons(couponList: Omit<InsertCoupon, 'code'>[]): Promise<Coupon[]> {
    const couponsWithCodes = couponList.map(coupon => ({
      ...coupon,
      code: this.generateCouponCode()
    }));
    const newCoupons = await db.insert(coupons).values(couponsWithCodes).returning();
    return newCoupons;
  }

  async getAllCoupons(page: number = 1, limit: number = 20): Promise<{ coupons: Coupon[]; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [couponsResult, countResult] = await Promise.all([
        db.select().from(coupons).limit(limit).offset(offset).orderBy(desc(coupons.createdAt)),
        db.select({ count: sql<number>`count(*)` }).from(coupons)
      ]);
      
      return {
        coupons: couponsResult,
        total: countResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting all coupons:', error);
      return { coupons: [], total: 0 };
    }
  }

  async getCouponUsage(couponId: number): Promise<Array<{ userId: number; username: string; usedAt: Date }>> {
    try {
      const result = await db
        .select({
          userId: couponUsage.userId,
          username: users.username,
          usedAt: couponUsage.usedAt
        })
        .from(couponUsage)
        .leftJoin(users, eq(users.id, couponUsage.userId))
        .where(eq(couponUsage.couponId, couponId))
        .orderBy(desc(couponUsage.usedAt));
      
      return result.map(row => ({
        userId: row.userId,
        username: row.username || 'Unknown',
        usedAt: row.usedAt || new Date()
      }));
    } catch (error) {
      console.error('Error getting coupon usage:', error);
      return [];
    }
  }

  async updateCouponStatus(couponId: number, isActive: boolean): Promise<Coupon> {
    const [updatedCoupon] = await db.update(coupons)
      .set({ isActive })
      .where(eq(coupons.id, couponId))
      .returning();
    return updatedCoupon;
  }



  // Subscription management
  async getAllSubscriptions(page: number = 1, limit: number = 20): Promise<{ subscriptions: Array<Subscription & { user: User }>; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [subscriptionsResult, countResult] = await Promise.all([
        db.select()
          .from(subscriptions)
          .leftJoin(users, eq(users.id, subscriptions.userId))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(subscriptions.createdAt)),
        db.select({ count: sql<number>`count(*)` }).from(subscriptions)
      ]);
      
      return {
        subscriptions: subscriptionsResult.map(row => ({
          ...row.subscriptions,
          user: row.users
        })),
        total: countResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      return { subscriptions: [], total: 0 };
    }
  }

  async getSubscriptionAnalytics(): Promise<{
    total: number;
    active: number;
    cancelled: number;
    expired: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  }> {
    try {
      const result = await db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`count(case when status = 'active' then 1 end)`,
          cancelled: sql<number>`count(case when status = 'cancelled' then 1 end)`,
          expired: sql<number>`count(case when status = 'expired' then 1 end)`,
          monthlyRevenue: sql<number>`count(case when plan_type = 'premium_monthly' and status = 'active' then 1 end) * 1.99`,
          yearlyRevenue: sql<number>`count(case when plan_type = 'premium_yearly' and status = 'active' then 1 end) * 9.99`
        })
        .from(subscriptions);
      
      return result[0] || { total: 0, active: 0, cancelled: 0, expired: 0, monthlyRevenue: 0, yearlyRevenue: 0 };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return { total: 0, active: 0, cancelled: 0, expired: 0, monthlyRevenue: 0, yearlyRevenue: 0 };
    }
  }

  // API usage tracking
  async logApiUsage(usage: InsertApiUsage): Promise<ApiUsage> {
    const [newUsage] = await db.insert(apiUsage).values(usage).returning();
    return newUsage;
  }

  async getApiUsageStats(startDate?: Date, endDate?: Date): Promise<{
    totalCost: number;
    totalRequests: number;
    byProvider: Array<{ provider: string; cost: number; requests: number }>;
    byOperation: Array<{ operation: string; cost: number; requests: number }>;
  }> {
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
      
      const providerStats = new Map<string, { cost: number; requests: number }>();
      const operationStats = new Map<string, { cost: number; requests: number }>();
      
      usageData.forEach(usage => {
        const cost = parseFloat(usage.cost);
        
        // Provider stats
        if (!providerStats.has(usage.provider)) {
          providerStats.set(usage.provider, { cost: 0, requests: 0 });
        }
        providerStats.get(usage.provider)!.cost += cost;
        providerStats.get(usage.provider)!.requests += 1;
        
        // Operation stats
        if (!operationStats.has(usage.operation)) {
          operationStats.set(usage.operation, { cost: 0, requests: 0 });
        }
        operationStats.get(usage.operation)!.cost += cost;
        operationStats.get(usage.operation)!.requests += 1;
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
      console.error('Error getting API usage stats:', error);
      return { totalCost: 0, totalRequests: 0, byProvider: [], byOperation: [] };
    }
  }

  // Admin logging
  async logAdminAction(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }

  async getAdminLogs(page: number = 1, limit: number = 20): Promise<{ logs: Array<AdminLog & { admin: { user: User } }>; total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const [logsResult, countResult] = await Promise.all([
        db.select()
          .from(adminLogs)
          .leftJoin(admins, eq(admins.id, adminLogs.adminId))
          .leftJoin(users, eq(users.id, admins.userId))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(adminLogs.createdAt)),
        db.select({ count: sql<number>`count(*)` }).from(adminLogs)
      ]);
      
      return {
        logs: logsResult.map(row => ({
          ...row.admin_logs,
          admin: {
            user: row.users
          }
        })),
        total: countResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting admin logs:', error);
      return { logs: [], total: 0 };
    }
  }

  // Subscription business logic methods
  async getUserActiveSubscription(userId: number): Promise<Subscription | null> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);
      
      return subscription || null;
    } catch (error) {
      console.error('Error getting user active subscription:', error);
      return null;
    }
  }

  async cancelUserSubscription(userId: number): Promise<{ success: boolean; message: string; newEndDate?: Date }> {
    try {
      // Get current active subscription
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (!activeSubscription) {
        return { success: false, message: '활성 구독이 없습니다.' };
      }

      // 정책 #1: 구독 취소 정책 구현
      if (activeSubscription.planType === 'premium_monthly' || activeSubscription.planType === 'premium_yearly') {
        // 1. 월간/연간 구독한 유저가 구독 취소한 경우
        // - 다음 결제일 전까지 유저의 Prena Plan 유지
        // - autoRenew를 false로 변경 (다음 결제일부터 결제가 되지 않음)
        const [updatedSubscription] = await db
          .update(subscriptions)
          .set({ 
            autoRenew: false,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, activeSubscription.id))
          .returning();

        // Clear user cache
        performanceCache.invalidateUserCache(userId);

        return {
          success: true,
          message: '구독이 취소되었습니다. 현재 결제 기간 종료일까지 Prena Plan을 계속 이용하실 수 있습니다.',
          newEndDate: updatedSubscription.endDate || undefined
        };
      } else if (activeSubscription.planType === 'prena_plan') {
        // 2. Coupon을 등록한 유저가 구독 취소한 경우
        // - Coupon의 유효기간 이후 Free Plan으로 변경 (Coupon이 그냥 만료되는것과 동일함)
        // - 별도 처리 없이 만료일에 자동으로 Free Plan으로 변경됨
        const [updatedSubscription] = await db
          .update(subscriptions)
          .set({ 
            autoRenew: false,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, activeSubscription.id))
          .returning();

        // Clear user cache
        performanceCache.invalidateUserCache(userId);

        return {
          success: true,
          message: '구독이 취소되었습니다. 쿠폰 유효기간 종료일까지 Prena Plan을 계속 이용하실 수 있습니다.',
          newEndDate: updatedSubscription.endDate || undefined
        };
      }

      return { success: false, message: '알 수 없는 구독 유형입니다.' };
    } catch (error) {
      console.error('Error cancelling user subscription:', error);
      return { success: false, message: '구독 취소 중 오류가 발생했습니다.' };
    }
  }

  async applyCouponForPrenaPlan(userId: number, couponCode: string): Promise<{ success: boolean; message: string; newEndDate?: Date }> {
    try {
      // Get coupon
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode));

      if (!coupon) {
        return { success: false, message: '유효하지 않은 쿠폰 코드입니다.' };
      }

      // Validate coupon
      const now = new Date();
      if (!coupon.isActive) {
        return { success: false, message: '비활성 쿠폰입니다.' };
      }
      if (coupon.validUntil && coupon.validUntil < now) {
        return { success: false, message: '만료된 쿠폰입니다.' };
      }
      if (coupon.maxUses && (coupon.currentUses || 0) >= coupon.maxUses) {
        return { success: false, message: '사용 한도가 초과된 쿠폰입니다.' };
      }

      // Check if user already used this coupon
      const [existingUsage] = await db
        .select()
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userId, userId)
          )
        );

      if (existingUsage) {
        return { success: false, message: '이미 사용한 쿠폰입니다.' };
      }

      // Apply coupon extension logic
      const result = await this.extendSubscriptionWithCoupon(userId, coupon);
      
      if (result.success) {
        // Update coupon usage
        await db.update(coupons)
          .set({ currentUses: (coupon.currentUses || 0) + 1 })
          .where(eq(coupons.id, coupon.id));

        // Record coupon usage
        await db.insert(couponUsage).values({
          couponId: coupon.id,
          userId: userId,
          usedAt: new Date()
        });

        // Clear user cache
        performanceCache.invalidateUserCache(userId);
      }

      return result;
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, message: '쿠폰 적용 중 오류가 발생했습니다.' };
    }
  }

  async extendSubscriptionWithCoupon(userId: number, coupon: Coupon): Promise<{ success: boolean; message: string; newEndDate: Date }> {
    try {
      const currentSubscription = await this.getUserActiveSubscription(userId);
      
      // Calculate extension duration
      let extensionMonths = 0;
      switch (coupon.planDuration) {
        case '1_month': extensionMonths = 1; break;
        case '3_months': extensionMonths = 3; break;
        case '6_months': extensionMonths = 6; break;
        case '12_months': extensionMonths = 12; break;
        default: extensionMonths = 1;
      }

      let newEndDate: Date;

      if (currentSubscription) {
        // 정책 #2: 쿠폰 이용 관련 정책
        if (currentSubscription.planType === 'premium_monthly' || currentSubscription.planType === 'premium_yearly') {
          // 1. 연간/월간 구독한 유저가 Coupon을 사용하는 경우
          // - Coupon은 현재 Plan의 유효기간을 늘려주는 효과
          const currentEndDate = currentSubscription.endDate || new Date();
          newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

          // Update existing subscription
          await db
            .update(subscriptions)
            .set({
              endDate: newEndDate,
              planType: 'prena_plan', // Change to coupon-based plan
              updatedAt: new Date()
            })
            .where(eq(subscriptions.id, currentSubscription.id));

        } else if (currentSubscription.planType === 'prena_plan') {
          // 2. Coupon을 사용중인 유저가 Coupon을 추가로 사용하는 경우
          // - Coupon은 현재 Plan의 유효기간을 늘려주는 효과 (쿠폰 스택킹)
          const currentEndDate = currentSubscription.endDate || new Date();
          newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

          // Update existing subscription
          await db
            .update(subscriptions)
            .set({
              endDate: newEndDate,
              updatedAt: new Date()
            })
            .where(eq(subscriptions.id, currentSubscription.id));
        } else {
          return { success: false, message: '알 수 없는 구독 유형입니다.', newEndDate: new Date() };
        }
      } else {
        // No active subscription - create new coupon-based subscription
        const startDate = new Date();
        newEndDate = new Date(startDate);
        
        if (coupon.upgradeType === 'expiry_based' && coupon.planExpiryDate) {
          // Use admin-specified expiry date
          newEndDate = new Date(coupon.planExpiryDate);
        } else {
          // Use duration-based calculation
          newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
        }

        // Create new subscription  
        await db.insert(subscriptions).values({
          userId: userId,
          planType: 'prena_plan',
          status: 'active',
          startDate: startDate,
          endDate: newEndDate,
          autoRenew: false, // Coupon-based subscriptions don't auto-renew
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        message: `쿠폰이 성공적으로 적용되었습니다. Prena Plan이 ${newEndDate.toLocaleDateString('ko-KR')}까지 연장되었습니다.`,
        newEndDate: newEndDate
      };

    } catch (error) {
      console.error('Error extending subscription with coupon:', error);
      return { success: false, message: '구독 연장 중 오류가 발생했습니다.', newEndDate: new Date() };
    }
  }

  async updateUserSubscription(userId: number, subscriptionData: { subscriptionPlan: string; subscriptionEndDate: Date; subscriptionStatus: string }): Promise<void> {
    try {
      // Check if user has an active subscription
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (activeSubscription) {
        // Update existing subscription
        await db
          .update(subscriptions)
          .set({
            planType: subscriptionData.subscriptionPlan === 'prena' ? 'premium_monthly' : 'free',
            endDate: subscriptionData.subscriptionEndDate,
            status: subscriptionData.subscriptionStatus,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, activeSubscription.id));
      } else {
        // Create new subscription
        await db.insert(subscriptions).values({
          userId: userId,
          planType: subscriptionData.subscriptionPlan === 'prena' ? 'premium_monthly' : 'free',
          startDate: new Date(),
          endDate: subscriptionData.subscriptionEndDate,
          status: subscriptionData.subscriptionStatus,
          autoRenew: true
        });
      }

      // Clear user cache
      performanceCache.invalidateUserCache(userId);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }
}

// Use DatabaseStorage: Stories and User progress from database
export const storage = new DatabaseStorage();