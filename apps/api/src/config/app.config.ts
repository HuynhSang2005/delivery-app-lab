import { Logger } from '@nestjs/common';
import { ConfigModuleOptions, registerAs } from '@nestjs/config';

import { envSchema, type EnvConfig } from './env.schema';

const logger = new Logger('AppConfig');

/**
 * Validate and parse environment variables using Zod schema.
 * Throws a descriptive error on startup if validation fails.
 */
function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Environment validation failed:\n${formatted}\n\nCheck your .env file against .env.example`,
    );
  }

  logger.log('Environment variables validated successfully');
  return result.data as Record<string, unknown>;
}

/** NestJS ConfigModule options */
export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  validate: validateEnv,
  expandVariables: true,
};

/** Typed configuration namespaces for injection */

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL!,
  directUrl: process.env.DATABASE_URL_DIRECT!,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL,
}));

export const firebaseConfig = registerAs('firebase', () => ({
  projectId: process.env.FIREBASE_PROJECT_ID!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
}));

export const cloudinaryConfig = registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
}));

export const goongConfig = registerAs('goong', () => ({
  apiKey: process.env.GOONG_API_KEY!,
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));

/** All config namespaces to load */
export const configNamespaces = [
  databaseConfig,
  redisConfig,
  firebaseConfig,
  jwtConfig,
  cloudinaryConfig,
  goongConfig,
  throttleConfig,
];

export type { EnvConfig };
