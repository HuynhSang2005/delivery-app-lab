import path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Path to schema file
  schema: path.join('prisma', 'schema.prisma'),

  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'bunx tsx prisma/seed.ts',
  },

  // Use DATABASE_URL_DIRECT for migrations (non-pooled connection required by Prisma)
  datasource: {
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? '',
  },
});
