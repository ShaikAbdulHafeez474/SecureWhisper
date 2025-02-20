import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: './server/.env' });

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Optional: Use Neon WebSocket Proxy URL from .env
if (process.env.NEON_WEBSOCKET_URL) {
  neonConfig.fetchEndpoint = process.env.NEON_WEBSOCKET_URL;
}

// Ensure DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool using DATABASE_URL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Enable SSL for Neon
});

// Initialize Drizzle ORM with Pool and schema
export const db = drizzle(pool, { schema });
