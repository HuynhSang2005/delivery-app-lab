import { z } from 'zod';

export const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3001,http://localhost:8081'),

  // Database (Neon PostgreSQL)
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DIRECT: z.string().url(),

  // Redis (Upstash)
  REDIS_URL: z.string().optional(),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // Goong Maps
  GOONG_API_KEY: z.string().min(1),

  // Rate Limiting
  THROTTLE_TTL: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;
