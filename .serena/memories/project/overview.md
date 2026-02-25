# Logship-MVP Project Overview

## Purpose
On-demand delivery platform for Vietnam market - connects customers with drivers for package delivery.

## Tech Stack
- **Backend**: NestJS 11 + Bun 1.3.9 + Prisma 7.4.0 + Neon PostgreSQL + PostGIS
- **Mobile**: Expo SDK 54 + React Native 0.84.0 + React 19.2.4
- **Admin**: Next.js 16 + Shadcn/ui + Tailwind v4
- **Auth**: Firebase Phone OTP (NOT JWT secret)
- **Maps**: Goong Maps (Vietnam-optimized)
- **Validation**: Zod v4 + nestjs-zod
- **Queue**: BullMQ + Upstash Redis
- **Storage**: Cloudinary

## Key Rules
- Bun exclusively (NO npm/npx/yarn/pnpm)
- Repository Pattern: Controller → Service → Repository → Prisma
- Zod v4 for validation (NOT class-validator)
- Soft deletes (deletedAt)
- Vietnamese responses required

## Commands
- `bun install` - install deps
- `bun dev` - start dev server
- `bun typecheck` - type check
- `bun test` - run tests
- `bun lint` - lint code
- `bunx --bun prisma generate` - generate prisma client

## Current State
- Phase 1 Foundation: 25% complete
- Overall: 8%
- Next task: 1.2.1 Initialize Prisma
