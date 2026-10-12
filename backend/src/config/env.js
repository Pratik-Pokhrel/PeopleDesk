/* This app loads the .env file (present at /PeopleDesk/backend),validates every variable with zod, and
    exports one typed config object to be used across the app
*/

// If anything is missing or invalid or tampered, the app stops/fails at startup

import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// since .env file is at backend, it is two level above this directory (.../src/config)
dotenv.config({
  path: path.resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGIN: z.string().default("http://192.168.18.50:5173"),
});

const parsed = schema.safeParse(process.env); // parse the .env file and validate it with zod

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
