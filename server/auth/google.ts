import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from '../storage';
import type { User } from '@shared/schema';

// Configure Google OAuth Strategy
export function configureGoogleAuth() {
  // Skip Google OAuth setup if credentials are not provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth credentials not provided. Skipping Google authentication setup.');
    return;
  }

  // Determine callback URL based on environment
  const getCallbackURL = () => {
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    
    // Check if running in production (multiple ways to detect)
    if (process.env.NODE_ENV === 'production' || 
        process.env.REPLIT_DEPLOYMENT === 'true' ||
        process.env.REPLIT_DOMAINS?.includes('prenatale.replit.app')) {
      return `https://prenatale.replit.app/api/auth/google/callback`;
    }
    
    // For development environment, use the current development URL
    return `https://549abe74-698e-4e9f-88d4-6b26329da78f-00-1knbgb0cusmos.janeway.replit.dev/api/auth/google/callback`;
  };

  const callbackURL = getCallbackURL();
  console.log('Google OAuth callback URL:', callbackURL);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth profile:', profile);
      
      // Check if user already exists by Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (user) {
        console.log('Existing Google user found:', user.id);
        // Check if profile is complete
        if (!user.babyName || !user.babyDueDate || !user.relationship) {
          user.needsProfileCompletion = true;
        }
        return done(null, user);
      }
      
      // Check if user exists by email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await storage.getUserByEmail(email);
        if (user) {
          // Link Google account to existing user
          await storage.updateUser(user.id, {
            googleId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
          });
          console.log('Linked Google account to existing user:', user.id);
          return done(null, user);
        }
      }
      
      // Create new user
      if (!email) {
        return done(new Error('No email provided by Google'));
      }
      
      // Create incomplete user record for Google OAuth
      const newUser = await storage.createUser({
        username: profile.displayName || email.split('@')[0],
        email: email,
        googleId: profile.id,
        profileImageUrl: profile.photos?.[0]?.value,
        language: 'ko', // Default to Korean
        timezone: 'Asia/Seoul', // Default timezone
        createdAt: new Date(),
        // Leave baby info empty to require profile completion
        babyName: null,
        babyDueDate: null,
        relationship: null,
      });
      
      // Mark that profile completion is needed
      newUser.needsProfileCompletion = true;
      
      console.log('Created new Google user (incomplete):', newUser.id);
      return done(null, newUser);
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    if (user) {
      done(null, user);
    } else {
      // User no longer exists in database, clear session
      console.log('User not found in database, clearing session for user:', id);
      done(null, null);
    }
  } catch (error) {
    console.error('Deserialize error:', error);
    // Don't fail on deserialize errors, just clear the session
    done(null, null);
  }
});