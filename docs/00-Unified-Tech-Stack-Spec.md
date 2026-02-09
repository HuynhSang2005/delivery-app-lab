# Logship-MVP: Unified Tech Stack Specification

**Version:** 3.0  
**Last Updated:** February 2025  
**Status:** Single Source of Truth for All Documentation

---

## 1. Core Philosophy

This document serves as the **single source of truth** for all technology decisions in the Logship-MVP project. All other documentation MUST reference this specification to ensure consistency.

### 1.1. Package Manager & Runtime

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Package Manager** | **Bun** | Fast, all-in-one JavaScript runtime & package manager |
| **Bun Version** | ^1.3.9 | Latest stable with workspace support |
| **Monorepo Tool** | Bun Workspaces | Native workspace support, no need for Turborepo/pnpm |
| **Runtime** | Bun | Replaces Node.js for running JavaScript |

**CRITICAL:** This project uses **Bun exclusively**. No npm, no pnpm, no yarn, no npx.

### 1.2. Runtime Environment

| Component | Version | Notes |
|-----------|---------|-------|
| **Runtime** | Bun 1.3.9+ | All-in-one JavaScript runtime |
| **TypeScript** | ^5.7.3 | Strict mode enabled across all projects |

---

## 2. Backend Stack (NestJS)

### 2.1. Framework & Core

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/core` | ^11.1.6 | NestJS framework core |
| `@nestjs/common` | ^11.1.6 | Common utilities |
| `@nestjs/platform-express` | ^11.1.6 | HTTP platform adapter |
| `@nestjs/config` | ^4.0.0 | Configuration management |

### 2.2. Database (Neon PostgreSQL + PostGIS)

| Component | Role | Version/Details |
|-----------|------|-----------------|
| **Neon** | Database Provider | Serverless PostgreSQL 17+ |
| **PostGIS** | Geospatial Extension | Enabled on Neon |
| **Prisma** | ORM | ^7.3.0 |
| `@prisma/client` | Prisma Client | ^7.3.0 |
| `prisma` | CLI | ^7.3.0 |

**CRITICAL:** Prisma is the ORM, Neon is the database. Never confuse these.

### 2.3. Authentication & Security

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/jwt` | ^11.0.0 | JWT tokens |
| `@nestjs/passport` | ^11.0.0 | Passport integration |
| `passport-jwt` | ^4.0.1 | JWT strategy |
| `firebase-admin` | ^13.1.0 | Firebase Auth (OTP) |
| `@nestjs/throttler` | ^6.4.0 | Rate limiting |

### 2.4. Real-time & Messaging

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/websockets` | ^11.1.6 | WebSocket support |
| `@nestjs/platform-socket.io` | ^11.1.6 | Socket.io adapter |
| `socket.io` | ^4.8.1 | WebSocket server |
| `@nestjs/bullmq` | ^11.1.6 | Queue integration |
| `bullmq` | ^5.50.0 | Message queues |
| `ioredis` | ^5.5.0 | Redis client (Upstash) |

### 2.5. API Documentation

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/swagger` | ^11.1.6 | OpenAPI/Swagger docs |

### 2.6. Validation & Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `class-validator` | ^0.14.1 | DTO validation |
| `class-transformer` | ^0.5.1 | Object transformation |
| `zod` | ^4.3.6 | Schema validation (Zod v4 - latest) |
| `cloudinary` | ^2.5.1 | Image storage |
| `lodash` | ^4.17.21 | Utilities |
| `uuid` | ^11.0.5 | UUID generation |
| `date-fns` | ^4.1.0 | Date formatting |

---

## 3. Mobile Stack (React Native + Expo)

### 3.1. Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.0 | Expo SDK |
| `react-native` | 0.81.0 | React Native |
| `react` | 19.0.0 | React (Expo SDK 54 uses React 19) |
| `expo-router` | ~5.0.0 | File-based routing |

**NOTE:** Expo SDK 54 is the latest stable with React Native 0.81 and React 19.

### 3.2. State Management

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.66.0 | Server state |
| `zustand` | ^5.0.3 | Client state |

### 3.3. Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.54.2 | Form handling |
| `@hookform/resolvers` | ^4.0.0 | Resolver integration (Zod v4 compatible) |
| `zod` | ^4.3.6 | Schema validation (Zod v4 - latest) |

### 3.4. Maps & Location

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-maps` | 1.22.0 | Map components |
| `expo-location` | ~19.0.0 | Location services |
| `expo-task-manager` | ~13.0.0 | Background tasks |

### 3.5. API Client

| Package | Version | Purpose |
|---------|---------|---------|
| `@hey-api/client-fetch` | ^0.8.1 | Type-safe API client |
| `@hey-api/openapi-ts` | ^0.64.4 | Code generation (dev) |

### 3.6. UI Components

| Package | Version | Purpose |
|---------|---------|---------|
| `nativewind` | ^4.1.0 | Tailwind for RN |
| `tailwindcss` | ^4.0.0 | CSS framework |
| `@gorhom/bottom-sheet` | ^5.1.1 | Bottom sheets |
| `@shopify/flash-list` | 1.7.1 | High-performance lists |
| `react-native-toast-message` | ^2.2.1 | Toast notifications |
| `react-native-gesture-handler` | ~2.24.0 | Gestures |
| `react-native-reanimated` | ~4.0.0 | Animations |
| `react-native-safe-area-context` | 4.12.0 | Safe areas |
| `react-native-screens` | ~4.4.0 | Screen optimization |
| `react-native-svg` | 15.8.0 | SVG support |

### 3.7. Firebase & Auth

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-firebase/app` | ^22.0.0 | Firebase core |
| `@react-native-firebase/auth` | ^22.0.0 | Firebase Auth |

### 3.8. Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io-client` | ^4.8.1 | WebSocket client |
| `expo-secure-store` | ~15.0.0 | Secure storage |
| `expo-image` | ~3.0.0 | Image handling |
| `expo-image-picker` | ~17.0.0 | Image picker |
| `expo-notifications` | ~0.30.0 | Push notifications |
| `expo-clipboard` | ~8.0.0 | Clipboard |
| `expo-haptics` | ~15.0.0 | Haptic feedback |
| `expo-linking` | ~8.0.0 | Deep linking |
| `expo-constants` | ~18.0.0 | App constants |
| `expo-updates` | ~0.28.0 | OTA updates |
| `expo-dev-client` | ~6.0.0 | Dev client |
| `expo-splash-screen` | ~0.30.0 | Splash screen |
| `expo-status-bar` | ~3.0.0 | Status bar |
| `expo-system-ui` | ~5.0.0 | System UI |
| `expo-web-browser` | ~15.0.0 | Web browser |
| `@react-native-community/netinfo` | ^11.4.1 | Network info |
| `@react-native-masked-view/masked-view` | ^0.3.2 | Masked views |
| `lodash-es` | ^4.17.21 | Utilities |
| `date-fns` | ^4.1.0 | Date formatting |
| `clsx` | ^2.1.1 | Class name utilities |
| `react-native-url-polyfill` | ^2.0.0 | URL polyfill |

---

## 4. Admin Dashboard Stack (Next.js)

### 4.1. Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.2.0 | Next.js framework |
| `react` | ^19.0.0 | React 19 |
| `react-dom` | ^19.0.0 | React DOM |

### 4.2. State Management

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.66.0 | Server state |
| `zustand` | ^5.0.3 | Client state |

### 4.3. UI Components (Shadcn/ui + Radix)

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-*` | ^1.1.0 | Headless UI primitives |
| `class-variance-authority` | ^0.7.1 | Component variants |
| `clsx` | ^2.1.1 | Class utilities |
| `tailwind-merge` | ^3.0.1 | Tailwind class merging |
| `tailwindcss` | ^4.0.0 | CSS framework |
| `tailwindcss-animate` | ^1.0.7 | Animations |

### 4.4. Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.54.2 | Form handling |
| `@hookform/resolvers` | ^3.10.0 | Resolvers |
| `zod` | ^4.3.6 | Validation (Zod v4 - latest) |

### 4.5. API Client

| Package | Version | Purpose |
|---------|---------|---------|
| `@hey-api/client-fetch` | ^0.8.1 | Type-safe client |
| `@hey-api/openapi-ts` | ^0.64.4 | Code generation (dev) |

### 4.6. Tables & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-table` | ^8.21.2 | Data tables |
| `@tanstack/react-query-devtools` | ^5.66.0 | Query devtools |

### 4.7. Charts & Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | ^2.15.1 | Charts |

### 4.8. Maps

| Package | Version | Purpose |
|---------|---------|---------|
| `mapbox-gl` | ^3.10.0 | Map rendering |

### 4.9. Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.475.0 | Icons |
| `date-fns` | ^4.1.0 | Date formatting |
| `framer-motion` | ^12.4.2 | Animations |
| `cmdk` | ^1.0.4 | Command palette |
| `vaul` | ^1.1.2 | Drawer component |
| `nuqs` | ^2.3.2 | URL query state |
| `use-debounce` | ^10.0.4 | Debounce hooks |
| `next-themes` | ^0.4.4 | Dark/light mode |
| `react-error-boundary` | ^5.0.0 | Error boundaries |
| `socket.io-client` | ^4.8.1 | WebSocket client |
| `sonner` | ^1.7.4 | Toast notifications |
| `lodash-es` | ^4.17.21 | Utilities |
| `embla-carousel-react` | ^8.5.2 | Carousel |
| `input-otp` | ^1.4.2 | OTP input |
| `react-day-picker` | ^9.5.1 | Date picker |
| `react-resizable-panels` | ^2.1.7 | Resizable panels |

---

## 5. Infrastructure & Services

### 5.1. Database

| Service | Type | Purpose |
|---------|------|---------|
| **Neon** | Serverless PostgreSQL | Primary database |
| **PostGIS** | Extension | Geospatial queries |

### 5.2. Cache & Queue

| Service | Type | Purpose |
|---------|------|---------|
| **Upstash Redis** | Serverless Redis | Cache, Pub/Sub, BullMQ |

### 5.3. Authentication

| Service | Type | Purpose |
|---------|------|---------|
| **Firebase Auth** | Managed | Phone OTP, Email verification |

### 5.4. Storage

| Service | Type | Purpose |
|---------|------|---------|
| **Cloudinary** | Cloud Storage | Images, documents |

### 5.5. Maps

| Service | Type | Purpose |
|---------|------|---------|
| **Goong Maps** | Vietnam-optimized | Geocoding, routing, tiles |

---

## 6. Monorepo Structure

### 6.1. Bun Workspaces Configuration

```json
// package.json (root)
{
  "name": "logship-mvp",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

### 6.2. Folder Structure

```
logship-mvp/
├── apps/
│   ├── mobile/          # React Native + Expo SDK 54
│   ├── admin/           # Next.js 15
│   └── api/             # NestJS 11
├── packages/
│   ├── shared-types/    # Shared TypeScript types
│   ├── shared-config/   # Shared configs
│   └── shared-utils/    # Shared utilities
├── bun.lockb
├── package.json
└── tsconfig.json
```

---

## 7. Bun Commands Reference

### 7.1. Critical Rules

1. **Bun ONLY** - No npm, no pnpm, no yarn, no npx
2. **Expo SDK 54** - Latest stable with React Native 0.81
3. **React 19 for Mobile** - Expo SDK 54 uses React 19
4. **React 19 for Web** - Next.js 15 uses React 19
5. **Prisma is ORM, Neon is Database** - Never confuse these
6. **Goong Maps for Vietnam** - Not Google Maps

### 7.2. Command Reference

| Task | Command |
|------|---------|
| Install dependencies | `bun install` |
| Add dependency | `bun add <package>` |
| Add dev dependency | `bun add -d <package>` |
| Run script | `bun run <script>` |
| Execute package | `bunx <package>` |
| Run tests | `bun test` |
| Build | `bun run build` |
| Start dev server | `bun run dev` |
| Filter workspace | `bun run --filter <package> <script>` |

### 7.3. Package.json Scripts

All package.json files MUST use Bun commands:

```json
{
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "build": "bun run --filter '*' build",
    "test": "bun test",
    "lint": "bun run --filter '*' lint"
  }
}
```

---

## 8. API Client Generation (Hey-API)

### 8.1. Backend Swagger Setup

NestJS generates OpenAPI spec → Frontend generates TypeScript client

### 8.2. Generation Flow

```
NestJS Controllers (@nestjs/swagger)
    ↓
OpenAPI JSON (/api/docs-json)
    ↓
@hey-api/openapi-ts
    ↓
TypeScript Client + Types + Zod Schemas + React Query Hooks
```

### 8.3. Configuration

```typescript
// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3000/api/docs-json',
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/sdk',
    '@hey-api/typescript',
    { name: '@hey-api/zod', output: 'zod' },
    { name: '@tanstack/react-query', output: 'queries' },
  ],
});
```

---

## 9. Environment Variables

### 9.1. Backend (.env)

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"

# Redis (Upstash)
REDIS_URL="rediss://default:pass@host.upstash.io:6379"

# Firebase
FIREBASE_PROJECT_ID="your-project"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"

# JWT
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="15m"

# Goong Maps
GOONG_API_KEY="your-goong-key"
```

### 9.2. Mobile (.env)

```env
EXPO_PUBLIC_API_URL="https://api.logship.app/api/v1"
EXPO_PUBLIC_SOCKET_URL="wss://api.logship.app"
EXPO_PUBLIC_GOONG_API_KEY="your-goong-key"
```

### 9.3. Admin (.env)

```env
NEXT_PUBLIC_API_URL="https://api.logship.app/api/v1"
NEXT_PUBLIC_SOCKET_URL="wss://api.logship.app"
NEXT_PUBLIC_GOONG_MAPTILES_KEY="your-goong-maptiles-key"
NEXT_PUBLIC_GOONG_API_KEY="your-goong-api-key"
```

---

## 10. Documentation Cross-Reference

| Document | Purpose | Must Align With |
|----------|---------|-----------------|
| `01-SDD-System-Design-Document.md` | Architecture overview | This spec |
| `02-Database-Design-Document.md` | Neon + PostGIS schema | This spec |
| `03-API-Design-Document.md` | REST + WebSocket APIs | This spec |
| `04-Mobile-App-Technical-Spec.md` | Expo + React Native | This spec |
| `05-Admin-Dashboard-Spec.md` | Next.js + Shadcn | This spec |
| `06-Development-Phases.md` | Timeline & milestones | This spec |
| `07-Backend-Architecture.md` | NestJS + BullMQ | This spec |
| `08-Monorepo-Structure.md` | Bun workspaces | This spec |

---

## 11. Common Mistakes to Avoid

### 11.1. Package Manager

❌ WRONG:
```json
{
  "scripts": {
    "dev": "npm run start",
    "build": "npx tsc"
  }
}
```

✅ CORRECT:
```json
{
  "scripts": {
    "dev": "bun run start",
    "build": "bunx tsc"
  }
}
```

### 11.2. Database vs ORM

❌ WRONG: "We use Prisma as our database"

✅ CORRECT: "We use Neon PostgreSQL as our database, with Prisma as our ORM"

### 11.3. Expo SDK Version

❌ WRONG: "Expo SDK 54" (unreleased version)

✅ CORRECT: "Expo SDK 52" (latest stable as of Feb 2025)

### 11.4. React Versions

❌ WRONG: "React 19 for mobile"

✅ CORRECT: "React 18.3.1 for mobile (Expo SDK 52), React 19 for web (Next.js 15)"

### 11.5. Bun Runtime

❌ WRONG: Using `node` to run scripts or `npm` to install packages

✅ CORRECT: Always use `bun` for everything

---

## 12. Update Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-09 | 4.0 | Updated to Expo SDK 54, React Native 0.81, Prisma 7, Bun 1.3.9 |
| 2025-02-03 | 3.0 | Updated all dependencies to latest versions, Bun-only policy |
| 2025-02-03 | 2.0 | Complete rewrite with Bun, corrected versions, unified structure |

---

**END OF SPECIFICATION**

All documentation must align with this specification. Any discrepancies should be resolved in favor of this document.
