import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  REPL_ID: z.string(),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  environment: env.NODE_ENV,
  session: {
    secret: env.REPL_ID,
  },
  cors: {
    origin: env.NODE_ENV === "development" ? "*" : process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
};
