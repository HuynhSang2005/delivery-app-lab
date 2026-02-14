# Setup Checklist

Complete checklist for setting up Logship-MVP development environment.

## Prerequisites Checklist

### Required Software

- [ ] **Bun** 1.3+ installed
  ```bash
  # Check version
  bun --version
  
  # Install if needed
  curl -fsSL https://bun.sh/install | bash
  ```

- [ ] **Node.js** 22.x LTS installed (for compatibility)
  ```bash
  # Check version
  node --version
  
  # Download from https://nodejs.org/
  ```

- [ ] **Git** installed
  ```bash
  git --version
  ```

- [ ] **VS Code** (recommended) or preferred IDE
  - Extensions recommended:
    - [ ] ESLint
    - [ ] Prettier
    - [ ] Tailwind CSS IntelliSense
    - [ ] Prisma
    - [ ] NestJS snippets

### Accounts Required

- [ ] **GitHub** account
- [ ] **Neon** account (database)
  - Sign up: https://neon.tech/
- [ ] **Upstash** account (Redis)
  - Sign up: https://upstash.com/
- [ ] **Firebase** account (authentication)
  - Sign up: https://firebase.google.com/
- [ ] **Cloudinary** account (image storage)
  - Sign up: https://cloudinary.com/
- [ ] **Goong** account (maps)
  - Sign up: https://goong.io/
- [ ] **Expo** account (mobile builds)
  - Sign up: https://expo.dev/

### Mobile Development

- [ ] **Expo Go** app installed on physical device
  - iOS: App Store
  - Android: Google Play Store
- [ ] Physical device for testing (recommended over simulator)
  - Background location doesn't work on simulators

## Repository Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/logship-mvp.git
cd logship-mvp

# Verify structure
ls -la
```

### 2. Install Dependencies

```bash
# Install all dependencies for monorepo
bun install

# Verify installation
ls node_modules
ls apps/api/node_modules
ls apps/mobile/node_modules
ls apps/admin/node_modules
```

## Database Setup (Neon)

### 1. Create Neon Project

- [ ] Go to [Neon Console](https://console.neon.tech/)
- [ ] Click "New Project"
- [ ] Name: `logship-mvp`
- [ ] Region: Select closest to you (Singapore for Vietnam/Asia)
- [ ] Click "Create Project"

### 2. Get Connection String

- [ ] In Neon Dashboard, click "Connection Details"
- [ ] Copy the **Pooled connection string** (ends with `-pooler`)
- [ ] Save for later: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

### 3. Enable PostGIS

- [ ] In Neon SQL Editor, run:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```
- [ ] Verify: `SELECT * FROM pg_extension WHERE extname = 'postgis';`

## Redis Setup (Upstash)

### 1. Create Redis Database

- [ ] Go to [Upstash Console](https://console.upstash.com/)
- [ ] Click "Create Database"
- [ ] Name: `logship-redis`
- [ ] Region: Same as Neon (Singapore for Asia)
- [ ] Type: Regional (not Global)
- [ ] Click "Create"

### 2. Get Connection String

- [ ] In database details, find "redis://..." URL
- [ ] Copy the **TLS (rediss://)** URL
- [ ] Save for later: `rediss://default:pass@host.upstash.io:6379`

## Firebase Setup

### 1. Create Firebase Project

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Click "Add project"
- [ ] Name: `logship-mvp` (or your preferred name)
- [ ] Disable Google Analytics (or enable if you want)
- [ ] Click "Create project"

### 2. Enable Phone Authentication

- [ ] Go to "Build" → "Authentication"
- [ ] Click "Get started"
- [ ] Enable "Phone" provider
- [ ] Save

### 3. Get Firebase Config (for mobile/web)

- [ ] Click "Project settings" (gear icon)
- [ ] Go to "General" tab
- [ ] Scroll to "Your apps" section
- [ ] Click "</>" (Web) to create web app
- [ ] Copy configuration object

### 4. Get Service Account (for backend)

- [ ] Go to "Project settings" → "Service accounts"
- [ ] Click "Generate new private key"
- [ ] Save the JSON file securely (DO NOT COMMIT)
- [ ] Note the values:
  - `project_id`
  - `private_key`
  - `client_email`

## Cloudinary Setup

### 1. Get Credentials

- [ ] Go to [Cloudinary Console](https://console.cloudinary.com/)
- [ ] Dashboard shows:
  - Cloud Name
  - API Key
  - API Secret
- [ ] Save all three values

### 2. Create Upload Preset (Optional)

- [ ] Go to "Settings" → "Upload"
- [ ] Scroll to "Upload presets"
- [ ] Click "Add upload preset"
- [ ] Name: `logship_uploads`
- [ ] Signing Mode: `Unsigned`
- [ ] Save

## Goong Maps Setup

### 1. Get API Keys

- [ ] Go to [Goong Console](https://goong.io/)
- [ ] Sign up/login
- [ ] Go to "API Keys"
- [ ] Copy:
  - **REST API Key** (for geocoding/directions)
  - **Map Tiles Key** (for map display)

### 2. Enable APIs

- [ ] Ensure these APIs are enabled:
  - Place API (autocomplete)
  - Direction API (routing)
  - Static Map API (tiles)

## Environment Variables Setup

### 1. Backend (.env)

Create `apps/api/.env`:

```bash
cd apps/api
cp .env.example .env
```

Fill in the values:

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:pass@host.upstash.io:6379

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Goong Maps
GOONG_API_KEY=your-goong-rest-api-key

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3001,http://localhost:8081
```

### 2. Mobile (.env)

Create `apps/mobile/.env`:

```bash
cd apps/mobile
cp .env.example .env
```

Fill in the values:

```env
# API
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.xxx:3000

# Goong Maps
EXPO_PUBLIC_GOONG_API_KEY=your-goong-rest-api-key

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Note**: Use your computer's local IP, not `localhost`, for mobile testing.

### 3. Admin Dashboard (.env)

Create `apps/admin/.env.local`:

```bash
cd apps/admin
cp .env.example .env.local
```

Fill in the values:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Goong Maps
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your-goong-maptiles-key
NEXT_PUBLIC_GOONG_API_KEY=your-goong-rest-api-key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Database Initialization

### 1. Generate Prisma Client

> **⚠️ Prisma 7.4.0 Setup Required:**

```bash
# Install driver adapter first
bun add @prisma/adapter-pg

# From project root
bun run db:generate

# Or from api directory
cd apps/api
bunx prisma generate
```

**Prisma 7.4.0 Additional Setup:**
- [ ] Create `prisma.config.ts` file in apps/api/
- [ ] Update `prisma/schema.prisma` with output path
- [ ] Add `"type": "module"` to package.json
- [ ] Update all PrismaClient imports to use generated path

### 2. Run Migrations

```bash
# Create and apply initial migration
bun run --filter @logship/api db:migrate

# Name it: init
```

### 3. Verify Database

```bash
# Open Prisma Studio
bun run db:studio

# Should open browser with database tables
```

### 4. Seed Database (Optional)

> **⚠️ Prisma 7.4.0 Change:** Seed is no longer automatic during migrations.

```bash
# If you have seed data
bun run --filter @logship/api db:seed

# Or run directly
bunx prisma db seed
```

**Configure seed script in package.json:**
```json
{
  "prisma": {
    "seed": "bunx ts-node prisma/seed.ts"
  }
}
```

## Development Verification

### 1. Start Backend

```bash
# Terminal 1
bun run dev:api

# Should see: Nest application successfully started
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

**Verify:**
- [ ] No errors in console
- [ ] Can access http://localhost:3000/api/docs
- [ ] Health check works: http://localhost:3000/health (if configured)

### 2. Start Admin Dashboard

> **⚠️ Next.js 16 Note:** Turbopack is now the default build tool.

```bash
# Terminal 2
bun run dev:admin

# Should see: Ready on http://localhost:3001
# Turbopack is now default (no --turbo flag needed)
```

**Verify:**
- [ ] No errors in console
- [ ] Can access http://localhost:3001
- [ ] Login page loads
- [ ] Turbopack is running (check console output)

### 3. Start Mobile App

```bash
# Terminal 3
bun run dev:mobile

# Should see: Metro bundler ready
# QR code displayed
```

**Verify:**
- [ ] Metro bundler starts without errors
- [ ] Can scan QR code with Expo Go
- [ ] App loads on device

### 4. Test End-to-End

- [ ] **Backend API test:**
  ```bash
  curl http://localhost:3000/api/v1/health
  # Should return: { "status": "ok" }
  ```

- [ ] **Mobile app test:**
  - [ ] Can see login screen
  - [ ] Can enter phone number
  - [ ] Firebase OTP is sent (check logs if using test numbers)

- [ ] **Admin dashboard test:**
  - [ ] Can access login page
  - [ ] Can login with admin credentials

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### VS Code Extensions

Install these extensions:

- [ ] **ESLint** - Code linting
- [ ] **Prettier** - Code formatting
- [ ] **Tailwind CSS IntelliSense** - Tailwind autocomplete
- [ ] **Prisma** - Prisma schema support
- [ ] **NestJS Snippets** - NestJS code snippets
- [ ] **Expo Tools** - Expo development (optional)
- [ ] **Thunder Client** - API testing (optional)

## Git Configuration

### 1. Configure Git

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2. Setup Pre-commit Hooks (Optional)

```bash
# Install husky (if configured)
bun add -d husky
bunx husky install
```

## Prisma 7.4.0 Setup Steps

### Additional Configuration Required

1. **Create prisma.config.ts:**
   ```typescript
   // apps/api/prisma.config.ts
   import 'dotenv/config'
   import { defineConfig, env } from 'prisma/config'
   
   export default defineConfig({
     schema: 'prisma/schema.prisma',
     datasource: {
       url: env('DATABASE_URL'),
     },
   })
   ```

2. **Update package.json:**
   ```json
   {
     "name": "@logship/api",
     "type": "module",
     "scripts": {
       "db:generate": "bunx prisma generate",
       "db:migrate": "bunx prisma migrate dev",
       "db:seed": "bunx prisma db seed"
     },
     "prisma": {
       "seed": "bunx ts-node prisma/seed.ts"
     }
   }
   ```

3. **Update prisma/schema.prisma:**
   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "../generated/prisma"
   }
   
   datasource db {
     provider = "postgresql"
   }
   ```

4. **Install driver adapter:**
   ```bash
   bun add @prisma/adapter-pg
   ```

## Next.js 16 Setup Steps

### Additional Configuration Required

1. **Rename middleware.ts to proxy.ts:**
   ```typescript
   // apps/admin/proxy.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   
   export async function proxy(request: NextRequest) {
     // Your middleware logic
     return NextResponse.next();
   }
   ```

2. **Update next.config.ts:**
   ```typescript
   const nextConfig = {
     turbopack: {},  // Now default, not experimental
     cacheComponents: true,  // Was experimental.ppr
     reactCompiler: true,    // Now stable
   };
   ```

3. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "bunx next dev -p 3001",
       "build": "bunx next build",
       "lint": "bunx eslint ."  // next lint removed
     }
   }
   ```

## Troubleshooting Setup Issues

If you encounter issues during setup, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

Common issues:
- [ ] `bun install` fails → Clear cache and retry
- [ ] Database connection fails → Check DATABASE_URL format
- [ ] Prisma errors → Run `bun run db:generate`
- [ ] Mobile app won't connect → Use IP address, not localhost
- [ ] Prisma 7 ESM errors → Ensure `"type": "module"` is in package.json
- [ ] Next.js 16 async errors → Await cookies(), headers(), params, searchParams
- [ ] Turbopack issues → Check for webpack-specific configurations

## Next Steps

After completing this checklist:

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for development workflow
2. Review [06-Development-Phases.md](./06-Development-Phases.md) for project timeline
3. Start with Phase 1: Project Setup & Infrastructure
4. Join team discussions on GitHub

## Verification Summary

### General Setup
- [ ] All prerequisites installed
- [ ] All accounts created
- [ ] Repository cloned and dependencies installed
- [ ] Database (Neon) created and connected
- [ ] Redis (Upstash) created and connected
- [ ] Firebase project created and configured
- [ ] Cloudinary account ready
- [ ] Goong Maps API keys obtained
- [ ] All .env files created and filled

### Prisma 7.4.0 Setup
- [ ] `prisma.config.ts` file created
- [ ] `prisma/schema.prisma` updated with output path
- [ ] `"type": "module"` added to package.json
- [ ] `@prisma/adapter-pg` installed
- [ ] PrismaClient updated with driver adapter
- [ ] Database migrations applied
- [ ] Seed script configured in package.json

### Next.js 16 Setup
- [ ] `middleware.ts` renamed to `proxy.ts`
- [ ] `next.config.ts` updated (turbopack, cacheComponents)
- [ ] `next lint` removed from package.json scripts
- [ ] Async APIs (cookies, headers, params) properly awaited
- [ ] React Compiler enabled (optional)

### Development Verification
- [ ] Backend running on localhost:3000
- [ ] Admin dashboard running on localhost:3001 (Turbopack)
- [ ] Mobile app running in Expo Go
- [ ] All services communicating correctly

---

**Setup Complete!** You're ready to start development. 🚀

**Last Updated**: 2026-02-09
