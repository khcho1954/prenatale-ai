import { LRUCache } from 'lru-cache';
import { LegacyStory } from '@shared/legacy-story';

// High-performance multi-tier caching system
export class PerformanceCache {
  private todaysStoriesCache: LRUCache<string, { stories: LegacyStory[], timestamp: number }>;
  private userStatsCache: LRUCache<string, { stats: any, timestamp: number }>;
  private recentlyReadCache: LRUCache<string, { stories: any[], timestamp: number }>;
  private storyCache: LRUCache<string, LegacyStory>;
  private userCache: LRUCache<string, any>;
  private allDailyStoriesCache: LRUCache<string, { stories: any[], timestamp: number }>;
  private readStoryIdsCache: LRUCache<string, { ids: Set<number>, timestamp: number }>;
  
  // Cache durations (in milliseconds) - optimized for speed and security balance
  private readonly TODAY_STORIES_TTL = 30 * 1000;         // 30 seconds - ultra fast refresh
  private readonly USER_STATS_TTL = 10 * 60 * 1000;       // 10 minutes - reasonable cache
  private readonly RECENTLY_READ_TTL = 5 * 60 * 1000;     // 5 minutes - faster updates for security
  private readonly STORY_TTL = 15 * 60 * 1000;            // 15 minutes - moderate cache
  private readonly USER_TTL = 15 * 60 * 1000;             // 15 minutes - moderate cache for user data
  private readonly ALL_STORIES_TTL = 60 * 60 * 1000;      // 1 hour - daily stories don't change often
  private readonly READ_STORY_IDS_TTL = 5 * 60 * 1000;    // 5 minutes - reading progress changes

  constructor() {
    // Initialize LRU caches with optimal settings for 1000+ concurrent users
    this.todaysStoriesCache = new LRUCache({
      max: 2000,                    // Support 2000 unique daily story requests
      ttl: this.TODAY_STORIES_TTL,
      updateAgeOnGet: true,         // Keep frequently accessed items fresh
      allowStale: true,             // Serve stale content while refreshing
    });

    this.userStatsCache = new LRUCache({
      max: 1000,                    // Cache stats for 1000 active users
      ttl: this.USER_STATS_TTL,
      updateAgeOnGet: true,
      allowStale: true,
    });

    this.recentlyReadCache = new LRUCache({
      max: 1000,                    // Cache recently read for 1000 users
      ttl: this.RECENTLY_READ_TTL,
      updateAgeOnGet: true,
      allowStale: true,
    });

    this.storyCache = new LRUCache({
      max: 500,                     // Cache 500 most accessed stories
      ttl: this.STORY_TTL,
      updateAgeOnGet: true,
      allowStale: true,
    });

    this.userCache = new LRUCache({
      max: 1000,                    // Cache 1000 user profiles
      ttl: this.USER_TTL,
      updateAgeOnGet: true,
      allowStale: true,
    });

    this.allDailyStoriesCache = new LRUCache({
      max: 10,                      // Very small cache - global daily stories
      ttl: this.ALL_STORIES_TTL,
      updateAgeOnGet: true,
      allowStale: true,
    });

    this.readStoryIdsCache = new LRUCache({
      max: 1000,                    // Cache read story IDs for 1000 users
      ttl: this.READ_STORY_IDS_TTL,
      updateAgeOnGet: true,
      allowStale: true,
    });
  }

  // Today's stories cache
  getTodaysStories(key: string): LegacyStory[] | null {
    const cached = this.todaysStoriesCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TODAY_STORIES_TTL) {
      return cached.stories;
    }
    return null;
  }

  setTodaysStories(key: string, stories: LegacyStory[]): void {
    this.todaysStoriesCache.set(key, { stories, timestamp: Date.now() });
  }

  // User stats cache
  getUserStats(key: string): any | null {
    const cached = this.userStatsCache.get(key);
    if (cached) {
      const ttl = cached.customTtl || this.USER_STATS_TTL;
      if (Date.now() - cached.timestamp < ttl) {
        return cached.stats;
      }
    }
    return null;
  }

  setUserStats(key: string, stats: any): void {
    // Theme details need longer cache since they're expensive to compute
    const ttl = key.includes('themes') ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 min for themes, 5 min for stats
    const timestamp = Date.now();
    this.userStatsCache.set(key, { stats, timestamp, customTtl: ttl });
  }

  // Recently read cache
  getRecentlyRead(key: string): any[] | null {
    const cached = this.recentlyReadCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.RECENTLY_READ_TTL) {
      return cached.stories;
    }
    return null;
  }

  setRecentlyRead(key: string, stories: any[]): void {
    this.recentlyReadCache.set(key, { stories, timestamp: Date.now() });
  }

  // Clear recently read cache for a specific user
  clearRecentlyRead(userId: number): void {
    // Clear all cache entries for this user (all language variants and limits)
    const keys = Array.from(this.recentlyReadCache.keys());
    const userPattern = `recently:${userId}_`;
    
    keys.forEach(key => {
      if (key.startsWith(userPattern)) {
        this.recentlyReadCache.delete(key);
        console.log(`Cleared recently read cache key: ${key}`);
      }
    });
  }

  // Individual story cache
  getStory(key: string): LegacyStory | null {
    return this.storyCache.get(key) || null;
  }

  setStory(key: string, story: LegacyStory): void {
    this.storyCache.set(key, story);
  }

  // User cache
  getUser(key: string): any | null {
    return this.userCache.get(key) || null;
  }

  setUser(key: string, user: any): void {
    this.userCache.set(key, user);
  }

  // All daily stories cache (global)
  getAllDailyStories(key: string): any[] | null {
    const cached = this.allDailyStoriesCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ALL_STORIES_TTL) {
      return cached.stories;
    }
    return null;
  }

  setAllDailyStories(key: string, stories: any[]): void {
    this.allDailyStoriesCache.set(key, { stories, timestamp: Date.now() });
  }

  // Read story IDs cache
  getReadStoryIds(key: string): Set<number> | null {
    const cached = this.readStoryIdsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.READ_STORY_IDS_TTL) {
      return cached.ids;
    }
    return null;
  }

  setReadStoryIds(key: string, ids: Set<number>): void {
    this.readStoryIdsCache.set(key, { ids, timestamp: Date.now() });
  }

  // Clear read story IDs cache for a specific user
  clearReadStoryIds(userId: number): void {
    const key = `read-stories-${userId}`;
    this.readStoryIdsCache.delete(key);
    console.log(`Cleared read story IDs cache for user ${userId}`);
  }

  // Clear today's stories cache for a specific user
  clearTodaysStories(userId: number): void {
    const keys = Array.from(this.todaysStoriesCache.keys());
    const userPattern = `${userId}-`;
    
    keys.forEach(key => {
      if (key.startsWith(userPattern)) {
        this.todaysStoriesCache.delete(key);
        console.log(`Cleared today's stories cache key: ${key}`);
      }
    });
  }

  // Cache invalidation methods
  invalidateUserCache(userId: number): void {
    this.userCache.delete(`user:${userId}`);
    this.userStatsCache.delete(`stats:${userId}`);
    this.recentlyReadCache.delete(`recently:${userId}`);
    this.readStoryIdsCache.delete(`read-stories-${userId}`);
  }

  invalidateStoryCache(storyId: number): void {
    this.storyCache.delete(`story:${storyId}`);
  }

  // Cache statistics for monitoring (simplified for production safety)
  getCacheStats(): any {
    return {
      todaysStories: {
        size: this.todaysStoriesCache.size,
        maxSize: this.todaysStoriesCache.max || 2000,
        ttl: this.TODAY_STORIES_TTL
      },
      userStats: {
        size: this.userStatsCache.size,
        maxSize: this.userStatsCache.max || 1000,
        ttl: this.USER_STATS_TTL
      },
      recentlyRead: {
        size: this.recentlyReadCache.size,
        maxSize: this.recentlyReadCache.max || 1000,
        ttl: this.RECENTLY_READ_TTL
      },
      stories: {
        size: this.storyCache.size,
        maxSize: this.storyCache.max || 500,
        ttl: this.STORY_TTL
      },
      users: {
        size: this.userCache.size,
        maxSize: this.userCache.max || 1000,
        ttl: this.USER_TTL
      }
    };
  }

  // Clear all caches (for debugging/maintenance)
  clearAll(): void {
    this.todaysStoriesCache.clear();
    this.userStatsCache.clear();
    this.recentlyReadCache.clear();
    this.storyCache.clear();
    this.userCache.clear();
    this.allDailyStoriesCache.clear();
    this.readStoryIdsCache.clear();
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();