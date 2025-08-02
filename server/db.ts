import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection pool for high-concurrency processing
const client = postgres(process.env.DATABASE_URL, {
  // Core connection settings (high-concurrency)
  max: 50,                    // Increased to 50 for 20 concurrent stories
  min: 3,                     // Slightly higher minimum
  idle_timeout: 60,           // 1 minute timeout (was 30s)
  connect_timeout: 30,        // Connection timeout
  max_lifetime: 20 * 60,      // 20min lifetime
  
  // Performance optimization
  prepare: true,              // Prepared statements
  transform: postgres.camel,  // camelCase transform
  fetch_types: false,         // Skip type fetching
  debug: process.env.NODE_ENV === 'development', // Debug only in dev
  
  // Connection reliability
  retry: 3,                   // Retry attempts
  max_backoff: 1000,          // Max backoff time
  backoff: (attemptNum) => Math.min(attemptNum * 100, 1000), // Progressive backoff
  
  // Supabase optimizations
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  keepalive: true,            // Keep connections alive
  keepalive_idle: 600,        // 10min keepalive
  
  // Error handling
  onnotify: () => {},         // NOTIFY/LISTEN handler
  onparameter: () => {},      // Parameter change handler
});

export const db = drizzle(client, { schema });
export const pgClient = client;

// Connection pool monitoring
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 PostgreSQL connection pool initialized:', {
    max: client.options.max,
    min: client.options.min,
    idle_timeout: client.options.idle_timeout,
    connect_timeout: client.options.connect_timeout,
    ssl: !!client.options.ssl
  });
}