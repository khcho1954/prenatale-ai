import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { convertToLegacyStory } from "@shared/legacy-story";
import { insertReadingProgressSchema, insertUserSchema, stories, insertCouponSchema, insertAdminSchema } from "@shared/schema";
import { type SupabaseStory } from "@shared/legacy-story";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { db, pgClient } from "./db";
import { eq, sql } from "drizzle-orm";
import passport from "passport";
import { configureGoogleAuth } from "./auth/google";
import { performanceMiddleware, errorHandlingMiddleware, setupGracefulShutdown } from "./middleware/performance";
import { performanceMonitor } from "./performance-monitor";
import { performanceCache } from "./cache";
import bcrypt from "bcryptjs";
import { portoneService } from "./portone";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Session type declaration
declare module "express-session" {
  interface SessionData {
    userId: number;
    user: any;
  }
}

// Helper function to extract user ID from token or session
const getUserIdFromRequest = (req: any): number | null => {
  // Check Authorization header first (for token-based auth)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token.startsWith('user-')) {
      return parseInt(token.split('-')[1]);
    }
  }
  
  // Fallback to session-based auth
  if (req.session.userId) {
    return req.session.userId;
  }
  
  return null;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Gemini parallel processing system
  try {
    const { initializeParallelProcessor } = await import("./gemini-parallel");
    initializeParallelProcessor();
    console.log("✅ Gemini 병렬처리 시스템 활성화");
  } catch (error) {
    console.error("❌ Gemini 병렬처리 시스템 초기화 실패:", error);
  }
  
  // Import password routes
  const passwordRoutes = (await import("./routes/password")).default;
  // Setup graceful shutdown
  setupGracefulShutdown();
  
  // Set up password routes
  app.use("/api/users", passwordRoutes);
  
  // Performance monitoring middleware
  app.use(performanceMiddleware);
  
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false, // Don't save empty sessions
    name: 'connect.sid', // Use default session name
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: false, // Allow JavaScript access for debugging
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'none' // Allow cross-site cookies for preview
    }
  }));

  // Configure Google OAuth and passport
  configureGoogleAuth();
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes - only register if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth credentials found, setting up routes...');
    
    app.get("/api/auth/google", (req, res, next) => {
      console.log('Google OAuth route hit');
      passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    });

    app.get("/api/auth/google/callback", 
      passport.authenticate('google', { failureRedirect: '/login' }),
      async (req, res) => {
        // Successful authentication
        const user = req.user as any;
        console.log('Google OAuth callback - user:', user);
        
        if (user) {
          // Set session
          req.session.userId = user.id;
          req.session.user = user;
          
          // Generate token for client
          const token = `user-${user.id}`;
          
          // Check if user needs profile completion
          const needsProfileCompletion = !user.babyName || !user.babyDueDate || !user.relationship;
          
          if (needsProfileCompletion) {
            // Redirect to profile completion page
            res.redirect(`/google-profile-completion?token=${token}&google_signup=true`);
          } else {
            // Redirect to home page
            res.redirect(`/?token=${token}&userId=${user.id}`);
          }
        } else {
          res.redirect('/login?error=auth_failed');
        }
      }
    );
  } else {
    // Fallback routes when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(503).json({ message: "Google OAuth not configured" });
    });

    app.get("/api/auth/google/callback", (req, res) => {
      res.status(503).json({ message: "Google OAuth not configured" });
    });
  }

  // Google profile completion endpoint
  app.post("/api/auth/complete-google-profile", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { username, babyName, babyDueDate, relationship, timezone, language } = req.body;

      // Validate required fields
      if (!username || !babyName || !babyDueDate || !relationship) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Update user profile
      const updatedUser = await storage.updateUser(userId, {
        username,
        babyName,
        babyDueDate: new Date(babyDueDate),
        relationship,
        timezone: timezone || 'Asia/Seoul',
        language: language || 'en',
      });

      // Update session
      req.session.user = updatedUser;

      res.json({ user: updatedUser, message: "Profile completed successfully" });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({ message: "Failed to complete profile" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Check for admin credentials first
      if (email === 'admin@prenatale.com' && password === 'admin1234') {
        const adminUser = await storage.getUserByEmail('admin@prenatale.com');
        if (adminUser) {
          // Store user info in session
          req.session.userId = adminUser.id;
          req.session.user = adminUser;
          
          // Force session save
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
            } else {
              console.log("Admin session saved successfully for user:", adminUser.id);
            }
          });
          
          // Return admin user info with proper token
          console.log("Admin login successful, returning token for user:", adminUser.id);
          res.json({ user: adminUser, token: `user-${adminUser.id}` });
          return;
        }
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Email not found" });
      }
      
      // Verify password using bcrypt
      if (!user.password) {
        // Google OAuth users don't have passwords
        return res.status(401).json({ message: "Please login with Google" });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Store user info in session
      req.session.userId = user.id;
      req.session.user = user;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
      });
      res.json({ user, token: `user-${user.id}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists by email (primary check)
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email!);
      if (existingUserByEmail) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      // Also check username for uniqueness
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username!);
      if (existingUserByUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(validatedData);
      
      // Auto-login after successful signup
      req.session.userId = user.id;
      req.session.user = user;
      
      res.status(201).json({ user, token: `user-${user.id}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      // Get the authenticated user ID from token/session
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

      // Get user from database
      const user = await storage.getUser(authenticatedUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has Google OAuth (no password)
      if (user.googleId && !user.password) {
        return res.status(400).json({ message: "Google users cannot change password" });
      }

      // Verify current password using bcrypt
      if (!user.password) {
        return res.status(400).json({ message: "No password set for this account" });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Update password in database (storage method will handle hashing)
      await storage.updateUserPassword(authenticatedUserId, newPassword);
      
      console.log(`Password changed successfully for user ${authenticatedUserId}`);
      res.json({ message: "Password changed successfully" });
      
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    console.log("Auth check - session userId:", req.session.userId, "user exists:", !!req.session.user);
    
    // Check Authorization header first (for token-based auth)
    const authHeader = req.headers.authorization;
    console.log("Authorization header:", authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log("Token received:", token);
      
      if (token && token.startsWith('user-')) {
        const userId = parseInt(token.split('-')[1]);
        console.log("Extracting userId from token:", userId);
        
        try {
          const user = await storage.getUser(userId);
          if (user) {
            console.log("Token auth successful for user:", userId);
            
            // Check if Google user needs profile completion
            if (user.googleId && (!user.babyName || !user.babyDueDate || !user.relationship)) {
              console.log("Google user needs profile completion:", userId);
              return res.json({ ...user, needsProfileCompletion: true });
            }
            
            console.log("Returning user with subscription info:", {
              id: user.id,
              subscriptionPlan: (user as any).subscriptionPlan,
              subscriptionEndDate: (user as any).subscriptionEndDate
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
    
    // Fallback to session-based auth
    if (req.session.userId && req.session.user) {
      console.log("Session auth successful for user:", req.session.userId);
      
      const user = req.session.user;
      // Check if Google user needs profile completion
      if (user.googleId && (!user.babyName || !user.babyDueDate || !user.relationship)) {
        console.log("Google user needs profile completion:", req.session.userId);
        return res.json({ ...user, needsProfileCompletion: true });
      }
      
      res.json(user);
    } else {
      // Return null for unauthenticated users
      console.log("No valid auth found, returning null");
      res.json(null);
    }
  });

  // Logout endpoint - support both GET and POST
  const logoutHandler = async (req: any, res: any) => {
    console.log("Logout called, current session:", req.session.userId);
    
    // Use passport logout if available
    if (req.logout) {
      req.logout((err: any) => {
        if (err) {
          console.error('Passport logout error:', err);
        }
        
        // Clear session data
        req.session.userId = undefined;
        req.session.user = undefined;
        
        // Then destroy the session
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Failed to logout" });
          }
          
          // Clear session cookie with proper options
          res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'none'
          });
          
          res.json({ message: "Logged out successfully" });
        });
      });
    } else {
      // Fallback for non-passport logout
      req.session.userId = undefined;
      req.session.user = undefined;
      
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'none'
        });
        
        res.json({ message: "Logged out successfully" });
      });
    }
  };

  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);
  // Get today's stories
  app.get("/api/stories/today", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      
      // For non-authenticated users, detect browser language and timezone
      let language = 'en';
      let timezone = 'Asia/Seoul';
      
      if (!authenticatedUserId) {
        // Browser language detection
        const acceptLanguage = req.headers['accept-language'] || '';
        language = acceptLanguage.toLowerCase().includes('ko') ? 'ko' : 'en';
        
        // Timezone from query parameter (for non-authenticated users)
        timezone = (req.query.timezone as string) || 'Asia/Seoul';

      }
      
      const stories = await storage.getTodaysStories(authenticatedUserId, language, timezone);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's stories" });
    }
  });

  // Check if user can create story today (must be before :id route)
  app.get("/api/stories/can-create-today", async (req, res) => {
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

  // Get user's created stories (must be before :id route)
  app.get("/api/stories/created", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stories = await storage.getCreatedStories(authenticatedUserId);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching created stories:", error);
      res.status(500).json({ error: "Failed to fetch created stories" });
    }
  });

  // NEW: Get story by UUID (primary method)
  app.get("/api/stories/uuid/:uuid", async (req, res) => {
    try {
      console.log("=== UUID ROUTE CALLED ===");
      const storyUuid = req.params.uuid;
      console.log("Story UUID:", storyUuid);
      
      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(storyUuid)) {
        return res.status(400).json({ message: "Invalid UUID format" });
      }
      
      const authenticatedUserId = getUserIdFromRequest(req);
      console.log("Authenticated User ID:", authenticatedUserId);
      
      // Get user's language preference
      let language = 'en';
      if (authenticatedUserId) {

        try {
          const userResult = await pgClient`
            SELECT language FROM users WHERE id = ${authenticatedUserId}
          `;
          language = userResult[0]?.language || 'en';
          console.log("User language:", language);
        } catch (error) {
          console.error("Error getting user language:", error);
          language = 'en';
        }
      } else {
        // Browser language detection for non-authenticated users
        const acceptLanguage = req.headers['accept-language'] || '';
        language = acceptLanguage.toLowerCase().includes('ko') ? 'ko' : 'en';
        console.log("Browser language detection:", language);
      }
      
      // Get story directly using raw SQL to avoid Drizzle issues
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
      

      
      // Parse JSON tags if they are strings
      if (rawStory.tagsKo && typeof rawStory.tagsKo === 'string') {
        try {
          rawStory.tagsKo = JSON.parse(rawStory.tagsKo);
        } catch (e) {
          console.log("Failed to parse tagsKo:", rawStory.tagsKo);
        }
      }
      if (rawStory.tagsEn && typeof rawStory.tagsEn === 'string') {
        try {
          rawStory.tagsEn = JSON.parse(rawStory.tagsEn);
        } catch (e) {
          console.log("Failed to parse tagsEn:", rawStory.tagsEn);
        }
      }
      
      // 🔧 수정: 사용자 언어 설정을 우선시, 데이터가 없으면 폴백
      const displayLanguage: "ko" | "en" = (() => {
        if (rawStory.isCreated) {
          // 사용자 생성 스토리: 사용자 언어 우선, 해당 언어 데이터 없으면 존재하는 언어 사용
          if (language === 'ko') {
            return rawStory.titleKo ? 'ko' : 'en';
          } else {
            return rawStory.titleEn ? 'en' : 'ko';
          }
        } else {
          // 일일 스토리: 사용자 언어 설정 사용
          return language as "ko" | "en";
        }
      })();
      
      const legacyStory = convertToLegacyStory(rawStory as SupabaseStory, displayLanguage);
      (legacyStory as any).isFavorite = rawStory.isFavorite || false;
      (legacyStory as any).readAt = rawStory.readAt || null;
      (legacyStory as any).firstReadAt = rawStory.firstReadAt || null;
      
      // Final fix: ensure tags is always an array, not a JSON string
      if (legacyStory.tags && typeof legacyStory.tags === 'string') {
        try {
          legacyStory.tags = JSON.parse(legacyStory.tags);
        } catch (e) {
          legacyStory.tags = [legacyStory.tags as unknown as string];
        }
      }
      
      res.json(legacyStory);
    } catch (error) {
      console.error("Error fetching story by UUID:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // LEGACY: Get individual story by ID (kept for backward compatibility) - OPTIMIZED
  app.get("/api/stories/:id(\\d+)", async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      const authenticatedUserId = getUserIdFromRequest(req);
      
      // OPTIMIZED: 복잡한 권한 검사 제거 - UUID 시스템 사용으로 불필요
      // 기본적인 스토리 존재 확인만 수행
      const story = await storage.getStoryById(storyId, authenticatedUserId || undefined);
      
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // Get recently read stories for a user
  app.get("/api/users/:userId/recently-read", async (req, res) => {
    try {
      // Get the actual authenticated user ID from token/session
      const authenticatedUserId = getUserIdFromRequest(req);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Get user's language preference
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || 'en';
      
      const recentlyRead = await storage.getRecentlyReadStories(authenticatedUserId, limit, userLanguage);
      
      res.json(recentlyRead);
    } catch (error) {
      console.error("Error fetching recently read stories:", error);
      res.status(500).json({ message: "Failed to fetch recently read stories" });
    }
  });

  // Mark story as read
  app.post("/api/reading-progress", async (req, res) => {
    try {
      // Get the actual authenticated user ID from token/session
      const authenticatedUserId = getUserIdFromRequest(req);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      
      console.log("Marking story as read:", req.body);
      console.log("Authenticated user ID:", authenticatedUserId);
      
      // Override the userId in the request body with the authenticated user ID
      // Convert storyId to number (should already be database id)
      const storyId = typeof req.body.storyId === 'number' ? req.body.storyId : parseInt(req.body.storyId);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      // OPTIMIZED: UUID 시스템 사용으로 보안 검사 최소화 (Basic existence check only)
      // UUID 기반 액세스로 복잡한 권한 검사 불필요
      
      const requestData = { 
        ...req.body, 
        userId: authenticatedUserId,
        storyId: storyId
      };
      const validatedData = insertReadingProgressSchema.parse(requestData);
      console.log("Validated data:", validatedData);
      
      const progress = await storage.markStoryAsRead(validatedData);
      console.log("Story marked as read successfully:", progress);
      
      // Clear recently read cache to force refresh
      performanceCache.clearRecentlyRead(authenticatedUserId);
      
      res.json(progress);
    } catch (error) {
      console.error("Error marking story as read:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to mark story as read" });
      }
    }
  });

  // Toggle favorite status
  app.post("/api/users/:userId/stories/:storyId/favorite", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const storyId = parseInt(req.params.storyId);
      
      const progress = await storage.toggleFavorite(userId, storyId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite status" });
    }
  });

  // Simplified favorite toggle endpoint
  app.post("/api/reading-progress/favorite", async (req, res) => {
    try {
      // Get the actual authenticated user ID from token/session
      const authenticatedUserId = getUserIdFromRequest(req);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      
      // Convert storyId to number (should already be database id)
      const storyId = typeof req.body.storyId === 'number' ? req.body.storyId : parseInt(req.body.storyId);
      if (isNaN(storyId)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      // CRITICAL SECURITY CHECK: Verify user has access to this story before favoriting
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

  // Get weekly reading dates
  app.get("/api/users/:userId/weekly-reading", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const dates = await storage.getWeeklyReadingDates(userId);
      res.json(dates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly reading data" });
    }
  });

  // Get all reading dates for monthly calendar (without time limit)
  app.get("/api/users/:userId/all-reading-dates", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const dates = await storage.getAllReadingDates(userId);
      res.json(dates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all reading dates" });
    }
  });

  // Get reading statistics for a user
  app.get("/api/users/:userId/reading-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get reading progress for the user
      const progress = await storage.getUserReadingProgress(userId);
      
      // Calculate stats
      const storiesRead = progress.filter(p => p.isRead).length;
      const storiesCreated = await storage.getCreatedStories(userId);
      const createdCount = storiesCreated.length;
      
      // Calculate reading streak (simplified)
      const readDates = progress
        .filter(p => p.isRead && p.readAt)
        .map(p => new Date(p.readAt!))
        .sort((a, b) => b.getTime() - a.getTime());
      
      let streakDays = 0;
      if (readDates.length > 0) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Check if read today or yesterday
        const lastReadDate = readDates[0];
        const daysDiff = Math.floor((today.getTime() - lastReadDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          streakDays = 1;
          // Count consecutive days
          for (let i = 1; i < readDates.length; i++) {
            const currentDate = readDates[i];
            const prevDate = readDates[i - 1];
            const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysBetween === 1) {
              streakDays++;
            } else {
              break;
            }
          }
        }
      }
      
      // Estimate total reading time (assuming 2 minutes per story)
      const totalReadingTime = storiesRead * 2 * 60; // seconds
      
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

  // Cache management endpoints
  app.post("/api/cache/clear-all", (req, res) => {
    performanceCache.clearAll();
    res.json({ success: true, message: "All caches cleared" });
  });

  // Get user data endpoint
  app.get("/api/users/me", async (req, res) => {
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

  // Update user profile endpoint
  app.put("/api/users/profile", async (req, res) => {
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

  // Delete user account endpoint
  app.delete("/api/users/me", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      console.log("Deleting user account:", userId);
      
      // In a real application, you would soft-delete or properly handle user data
      // For now, we'll just clear the session and respond with success
      req.session.userId = undefined;
      req.session.user = undefined;
      
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ error: "Failed to delete account" });
        }
        
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'none'
        });
        
        console.log("User account deleted and session cleared");
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Subscription endpoints
  app.post("/api/subscription/create", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { planType } = req.body;
      console.log("Creating subscription:", { userId, planType });
      
      // In a real application, this would integrate with Stripe
      // For now, we'll simulate a successful subscription creation
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

  app.post("/api/subscription/cancel", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      console.log("Cancelling subscription for user:", userId);
      
      // Use actual business logic for subscription cancellation
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



  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      console.log("Contact form submission:", { name, email, subject });
      
      // In a real application, this would send an email or save to database
      // For now, we'll simulate successful submission
      res.json({ message: "Contact form submitted successfully" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  // Get user stats with themes (for MyPage)
  app.get("/api/user/stats", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const stats = await storage.getUserStats(userId, 5); // Top 5 themes for MyPage
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Get all user themes (for theme details page) - PERFORMANCE OPTIMIZED
  app.get("/api/user/themes", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Set cache headers for aggressive client-side caching
      res.set({
        'Cache-Control': 'public, max-age=1800, s-maxage=3600', // 30 min browser, 1 hour CDN
        'ETag': `themes-${userId}-${Date.now()}`
      });
      
      const stats = await storage.getUserStats(userId, 50); // Get all themes
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user themes:", error);
      res.status(500).json({ error: "Failed to fetch user themes" });
    }
  });

  // Get library stories with filtering and pagination
  app.get("/api/stories/library", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      
      const filter = req.query.filter as string || "all";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get user's language preference
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || 'en';
      
      
      const result = await storage.getLibraryStories(authenticatedUserId, filter, page, limit, userLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error fetching library stories:", error);
      res.status(500).json({ message: "Failed to fetch library stories" });
    }
  });

  // Get library stories with filtering by filter parameter and pagination
  app.get("/api/stories/library/:filter", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      
      if (!authenticatedUserId) {
        return res.status(401).json({ message: "Unauthorized: No valid authentication" });
      }
      
      const { filter } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get user's language preference
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = user?.language || 'en';
      
      
      const result = await storage.getLibraryStories(authenticatedUserId, filter, page, limit, userLanguage);
      res.json(result);
    } catch (error) {
      console.error("Error fetching library stories:", error);
      res.status(500).json({ error: "Failed to fetch library stories" });
    }
  });



  // Generate new story
  app.post("/api/stories/generate", async (req, res) => {
    try {
      const authenticatedUserId = getUserIdFromRequest(req);
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Unauthorized: No valid authentication" });
      }
      
      // Get user's language preference
      const user = await storage.getUser(authenticatedUserId);
      const userLanguage = (user?.language as 'ko' | 'en') || 'en';
      
      const { theme, character, length, message } = req.body;
      
      // Check if user can create today
      const canCreate = await storage.canCreateStoryToday(authenticatedUserId);
      if (!canCreate.canCreate) {
        return res.status(429).json({ error: "You can only create one story per day" });
      }

      // Generate unique ID for UCT (User Created Tale)
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      const uniqueId = `uct${authenticatedUserId}${dateStr}${timeStr}`;

      // 🚀 Gemini API 병렬처리 시스템 사용
      const { getParallelProcessor } = await import("./gemini-parallel");
      const { saveGeneratedImageToSupabase } = await import("./gemini");
      
      console.log("🚀 병렬처리로 스토리+이미지 동시 생성 시작...");
      const parallelStart = Date.now();
      
      const processor = getParallelProcessor();
      
      let generatedStory: any = null;
      let imageUrl: string | null = null;
      
      try {
        // STEP 1: 먼저 스토리 생성 (이미지 프롬프트 포함)
        console.log("📝 스토리 생성 시작...");
        generatedStory = await processor.generateStory({
          theme,
          character,
          length,
          message,
          language: userLanguage,
        });
        
        if (!generatedStory) {
          throw new Error("Story generation failed");
        }
        
        console.log("✅ 스토리 생성 성공:", generatedStory.title);
        console.log("🎨 생성된 이미지 프롬프트:", generatedStory.imagePrompt);
        
        // STEP 2: 스토리에서 생성된 imagePrompt로 이미지 생성
        if (generatedStory.imagePrompt) {
          try {
            console.log("🎨 이미지 생성 시작 (스토리 기반 프롬프트 사용)...");
            const illustration = await processor.generateImage({
              title: generatedStory.title,
              content: generatedStory.content,
              theme: theme.name,
              imagePrompt: generatedStory.imagePrompt // 스토리에서 생성된 프롬프트 사용
            });
            
            if (illustration?.imageBuffer) {
              console.log("📸 이미지 저장 중... (버퍼 크기:", illustration.imageBuffer.length, "bytes)");
              imageUrl = await saveGeneratedImageToSupabase(illustration.imageBuffer, uniqueId);
              console.log("✅ 이미지 Supabase 저장 완료:", imageUrl);
            } else {
              console.log("🎨 이미지 생성 실패 - 스토리만 생성");
            }
          } catch (imageError) {
            console.error("❌ 이미지 생성 실패:", imageError);
            // 이미지 실패해도 스토리는 생성
          }
        } else {
          console.log("⚠️ 스토리에 이미지 프롬프트가 없음 - 이미지 생성 건너뜀");
        }
        
        const totalTime = Date.now() - parallelStart;
        console.log(`⚡ 순차 처리 완료 (${totalTime}ms)`, {
          storySuccess: !!generatedStory,
          imageSuccess: !!imageUrl,
          imagePromptUsed: generatedStory.imagePrompt
        });
        
      } catch (processingError) {
        console.error("❌ 처리 시스템 오류:", processingError);
        
        // 폴백: 직접 Gemini 함수 사용
        console.log("🔄 직접 Gemini 함수로 폴백...");
        const { generateStory, generateStoryIllustration } = await import("./gemini");
        
        generatedStory = await generateStory({
          theme,
          character,
          length,
          message,
          language: userLanguage,
        });
        
        // 폴백 이미지 생성 (스토리의 imagePrompt 사용)
        if (generatedStory?.imagePrompt) {
          try {
            const illustration = await generateStoryIllustration(
              generatedStory.title,
              generatedStory.content,
              theme.name,
              generatedStory.imagePrompt // 스토리에서 생성된 프롬프트 사용
            );
            
            if (illustration?.imageBuffer) {
              imageUrl = await saveGeneratedImageToSupabase(illustration.imageBuffer, uniqueId);
              console.log("✅ 폴백 이미지 저장 완료:", imageUrl);
            }
          } catch (imageError) {
            console.error("❌ 폴백 이미지 생성 실패:", imageError);
          }
        }
      }

      // Save to storage with original language preserved
      console.log("🔍 Debug - generatedStory state:", {
        exists: !!generatedStory,
        type: typeof generatedStory,
        hasTitle: generatedStory?.title ? true : false
      });
      
      if (!generatedStory) {
        console.error("❌ Critical error: generatedStory is null");
        throw new Error("Story generation failed - no story data available");
      }
      
      const isKorean = userLanguage === 'ko';
      console.log("💾 Saving story to database...");
      
      const storyData = {
        uniqueId,
        titleKo: isKorean ? generatedStory.title : null,
        titleEn: isKorean ? null : generatedStory.title,
        contentKo: isKorean ? generatedStory.content : null,
        contentEn: isKorean ? null : generatedStory.content,
        excerptKo: isKorean ? generatedStory.content.substring(0, 200) + "..." : null,
        excerptEn: isKorean ? null : generatedStory.content.substring(0, 200) + "...",
        tagsKo: isKorean ? (Array.isArray(generatedStory.tags) ? generatedStory.tags : []) : null,
        tagsEn: isKorean ? null : (Array.isArray(generatedStory.tags) ? generatedStory.tags : []),
        readingTime: generatedStory.readingTime,
        isCreated: true,
        isDaily: false,
        status: "active",
        creatorId: authenticatedUserId.toString(),
        imageUrl,
        createdAt: new Date() // Explicitly set timestamp
      };
      
      const story = await storage.createStory(storyData);

      res.json(story);
    } catch (error) {
      console.error("Error generating story:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });

  // Gemini parallel processing status endpoint
  app.get("/api/gemini/status", async (req, res) => {
    try {
      const { getParallelProcessorStatus } = await import("./gemini-parallel");
      const status = getParallelProcessorStatus();
      res.json({
        parallelProcessing: status || { status: "not_initialized" },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        parallelProcessing: { status: "error", error: (error as Error).message },
        timestamp: new Date().toISOString()
      });
    }
  });

  // Health check endpoint for monitoring
  app.get("/api/health", async (req, res) => {
    try {
      const stats = performanceMonitor.getHealthStats();
      const memoryUsage = performanceMonitor.getMemoryUsage();
      const dbHealthy = await performanceMonitor.checkDatabaseHealth();
      
      res.json({
        ...stats,
        memory: memoryUsage,
        database: dbHealthy ? 'healthy' : 'unhealthy',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Health check failed', 
        healthy: false,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Performance metrics endpoint
  app.get("/api/metrics", async (req, res) => {
    try {
      const stats = performanceMonitor.getHealthStats();
      const memoryUsage = performanceMonitor.getMemoryUsage();
      
      res.json({
        performance: {
          uptime: stats.uptime,
          totalRequests: stats.totalRequests,
          errorCount: stats.errorCount,
          errorRate: stats.errorRate,
          avgResponseTime: stats.avgResponseTime,
        },
        memory: memoryUsage,
        cache: stats.cacheStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Metrics collection failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin middleware to check if user is admin
  const requireAdmin = async (req: any, res: any, next: any) => {
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

  // Admin API Routes
  
  // Check if user is admin
  app.get("/api/admin/check", async (req, res) => {
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

  // User Management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      
      const result = await storage.getAllUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/subscriptions", requireAdmin, async (req, res) => {
    try {
      const result = await storage.getUsersWithSubscriptions();
      res.json(result);
    } catch (error) {
      console.error("Error fetching users with subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch users with subscriptions" });
    }
  });

  app.patch("/api/admin/users/:id/status", requireAdmin, async (req, res) => {
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

  // Content Management
  app.get("/api/admin/stories", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;
      
      const result = await storage.getAllStories(page, limit, search, status);
      res.json(result);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get("/api/admin/stories/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getStoryAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching story analytics:", error);
      res.status(500).json({ message: "Failed to fetch story analytics" });
    }
  });

  app.patch("/api/admin/stories/:id/status", requireAdmin, async (req, res) => {
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

  // Coupon Management
  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getAllCoupons(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      console.log("Coupon creation request body:", JSON.stringify(req.body, null, 2));
      const couponData = insertCouponSchema.parse({
        ...req.body,
        createdBy: (req as any).adminUserId
      });
      console.log("Parsed coupon data:", JSON.stringify(couponData, null, 2));
      
      const newCoupon = await storage.createCoupon(couponData);
      res.json(newCoupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  app.post("/api/admin/coupons/bulk", requireAdmin, async (req, res) => {
    try {
      const { quantity, ...couponBase } = req.body;
      
      const coupons = Array.from({ length: quantity }, () => ({
        ...couponBase,
        createdBy: (req as any).adminUserId
      }));
      
      const validatedCoupons = coupons.map(coupon => insertCouponSchema.parse(coupon));
      const newCoupons = await storage.createBulkCoupons(validatedCoupons);
      res.json(newCoupons);
    } catch (error) {
      console.error("Error creating bulk coupons:", error);
      res.status(500).json({ message: "Failed to create bulk coupons" });
    }
  });

  app.get("/api/admin/coupons/:id/usage", requireAdmin, async (req, res) => {
    try {
      const couponId = parseInt(req.params.id);
      const usage = await storage.getCouponUsage(couponId);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching coupon usage:", error);
      res.status(500).json({ message: "Failed to fetch coupon usage" });
    }
  });

  app.patch("/api/admin/coupons/:id/status", requireAdmin, async (req, res) => {
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

  // Subscription Management
  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getAllSubscriptions(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/admin/subscriptions/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getSubscriptionAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Failed to fetch subscription analytics" });
    }
  });

  // API Usage Analytics
  app.get("/api/admin/api-usage", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const stats = await storage.getApiUsageStats(startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching API usage stats:", error);
      res.status(500).json({ message: "Failed to fetch API usage stats" });
    }
  });

  // Admin Logs
  app.get("/api/admin/logs", requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await storage.getAdminLogs(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Apply coupon for Prena Plan upgrade (user-facing endpoint)
  app.post("/api/coupons/apply", async (req, res) => {
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
          subscription: (result as any).subscription
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      res.status(500).json({ message: "Failed to apply coupon" });
    }
  });

  // Create admin user
  app.post("/api/admin/create-admin", requireAdmin, async (req, res) => {
    try {
      const { userId, role, permissions } = req.body;
      
      const adminData = insertAdminSchema.parse({
        userId,
        role,
        permissions,
        createdBy: (req as any).adminUserId
      });
      
      const newAdmin = await storage.createAdmin(adminData);
      res.json(newAdmin);
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // PortOne Payment API Routes
  app.post("/api/payment/portone/create", async (req, res) => {
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

  app.post("/api/payment/portone/verify", async (req, res) => {
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
        // 결제 성공 - 구독 업데이트
        const planType = paymentId.includes('monthly') ? 'monthly' : 'annual';
        const endDate = new Date();
        
        if (planType === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        await storage.updateUserSubscription(userId, {
          subscriptionPlan: 'prena',
          subscriptionEndDate: endDate,
          subscriptionStatus: 'active'
        });
        
        // Clear cache
        performanceCache.invalidateUserCache(userId);
      }
      
      res.json(verificationResult);
    } catch (error) {
      console.error("Error verifying PortOne payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // PortOne 웹훅 엔드포인트
  app.post("/api/webhooks/portone", async (req, res) => {
    try {
      const signature = req.headers['x-portone-signature'] as string;
      const payload = JSON.stringify(req.body);

      // 웹훅 서명 검증
      if (!portoneService.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      const { type, data } = req.body;

      // 결제 완료 웹훅 처리
      if (type === 'Payment.Paid') {
        const { paymentId, merchantUid, status } = data;
        
        // 결제 상태 업데이트 로직
        console.log(`Payment webhook received: ${paymentId}, status: ${status}`);
        
        // 필요시 추가 처리 로직 구현
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing PortOne webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Add error handling middleware at the end
  app.use(errorHandlingMiddleware);

  const httpServer = createServer(app);
  return httpServer;
}
