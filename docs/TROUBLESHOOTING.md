# Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** February 2026  

Common issues and solutions for Logship-MVP development.

---

## Table of Contents

1. [Development Issues](#1-development-issues)
2. [Database Issues](#2-database-issues)
3. [Mobile App Issues](#3-mobile-app-issues)
4. [Backend Issues](#4-backend-issues)
5. [Deployment Issues](#5-deployment-issues)
6. [Environment Setup Issues](#6-environment-setup-issues)

---

## 1. Development Issues

### Issue: Bun install fails

**Symptoms:**
```text
error: Failed to install
```

**Solutions:**
1. Update Bun to latest version:
   ```bash
   bun upgrade
   ```

2. Clear Bun cache:
   ```bash
   bun pm cache rm
   bun install
   ```

3. Delete lockfile and reinstall:
   ```bash
   rm bun.lockb
   bun install
   ```

---

### Issue: TypeScript errors after updating packages

**Symptoms:**
```text
TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solutions:**
1. Regenerate Prisma Client:
   ```bash
   bun run db:generate
   ```

2. Regenerate API client:
   ```bash
   bun run generate:api
   ```

3. Restart TypeScript server in IDE

---

## 2. Database Issues

### Issue: Prisma migrate fails

**Symptoms:**
```text
Error: P3005: The database schema is not empty
```

**Solutions:**
1. Reset database (development only):
   ```bash
   bunx prisma migrate reset
   ```

2. Create baseline migration:
   ```bash
   bunx prisma migrate resolve --applied 0_init
   ```

---

### Issue: Prisma 7 ESM errors

**Symptoms:**
```text
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

**Solutions:**
1. Add `"type": "module"` to package.json:
   ```json
   {
     "name": "@logship/api",
     "type": "module"
   }
   ```

2. Use `.js` extension for imports:
   ```typescript
   import { prisma } from './prisma/client.js';
   ```

3. Update tsconfig.json for ESM:
   ```json
   {
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "bundler"
     }
   }
   ```

---

### Issue: Prisma 7 driver adapter errors

**Symptoms:**
```text
Error: No driver adapter provided
```

**Solutions:**
1. Install driver adapter:
   ```bash
   bun add @prisma/adapter-pg
   ```

2. Update PrismaClient instantiation:
   ```typescript
   import { PrismaClient } from '../generated/prisma/client';
   import { PrismaPg } from '@prisma/adapter-pg';
   
   const adapter = new PrismaPg({
     connectionString: process.env.DATABASE_URL,
   });
   
   export const prisma = new PrismaClient({ adapter });
   ```

3. Ensure `prisma.config.ts` exists:
   ```typescript
   import 'dotenv/config'
   import { defineConfig, env } from 'prisma/config'
   
   export default defineConfig({
     schema: 'prisma/schema.prisma',
     datasource: {
       url: env('DATABASE_URL'),
     },
   })
   ```

---

### Issue: Prisma 7 environment variables not loading

**Symptoms:**
```text
Error: DATABASE_URL is not defined
```

**Solutions:**
1. Import dotenv in prisma.config.ts:
   ```typescript
   import 'dotenv/config'
   ```

2. Ensure .env file exists in project root or api directory

3. Load dotenv in entry files:
   ```typescript
   // main.ts
   import 'dotenv/config';
   ```

---

### Issue: Prisma 7 seed not running automatically

**Symptoms:**
```text
Seed script not executed after migration
```

**Solutions:**
1. Run seed manually (Prisma 7 no longer auto-seeds):
   ```bash
   bunx prisma db seed
   ```

2. Configure seed in package.json:
   ```json
   {
     "prisma": {
       "seed": "bunx ts-node prisma/seed.ts"
     }
   }
   ```

---

### Issue: PostGIS functions not working

**Symptoms:**
```text
ERROR: function st_distance(unknown, unknown) does not exist
```

**Solutions:**
1. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. Verify extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'postgis';
   ```

---

### Issue: Neon connection timeout

**Symptoms:**
```text
Error: P1001: Can't reach database server
```

**Solutions:**
1. Check DATABASE_URL format:
   ```env
   DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   ```

2. Use pooled connection for serverless
3. Check firewall rules
4. Verify Neon project is active

---

## 3. Mobile App Issues

### Issue: Expo Go crashes on startup

**Symptoms:**
```text
App crashes immediately after opening
```

**Solutions:**
1. Clear Expo cache:
   ```bash
   bunx expo start --clear
   ```

2. Reinstall node_modules:
   ```bash
   rm -rf node_modules bun.lockb
   bun install
   ```

3. Check for incompatible native modules

---

### Issue: Background location not working

**Symptoms:**
```text
Location updates stop when app is in background
```

**Solutions:**
1. Use development build (not Expo Go):
   ```bash
   bunx eas build --profile development
   ```

2. Verify permissions in app.json:
   ```json
   {
     "expo": {
       "plugins": [
         ["expo-location", {
           "isAndroidBackgroundLocationEnabled": true
         }]
       ]
     }
   }
   ```

3. Check iOS/Android permissions are granted

---

### Issue: Maps not showing (Goong Maps)

**Symptoms:**
```text
Blank map or tiles not loading
```

**Solutions:**
1. Verify API keys in .env:
   ```env
   EXPO_PUBLIC_GOONG_API_KEY=your_api_key
   EXPO_PUBLIC_GOONG_MAPTILES_KEY=your_maptiles_key
   ```

2. Check UrlTile component usage:
   ```tsx
   <UrlTile
     urlTemplate={`https://tiles.goong.io/tiles/{z}/{x}/{y}.png?api_key=${GOONG_MAPTILES_KEY}`}
   />
   ```

3. Verify network connectivity
4. Check API quota limits

---

## 4. Backend Issues

### Issue: NestJS won't start

**Symptoms:**
```text
Error: Cannot find module '@nestjs/core'
```

**Solutions:**
1. Install dependencies:
   ```bash
   cd apps/api
   bun install
   ```

2. Check for missing environment variables:
   ```bash
   cp .env.example .env
   ```

3. Build the project:
   ```bash
   bun run build
   ```

---

### Issue: Next.js 16 async params errors

**Symptoms:**
```text
Error: params should be awaited
```

**Solutions:**
1. Make page component async and await params:
   ```typescript
   export default async function Page({ 
     params 
   }: { 
     params: Promise<{ slug: string }> 
   }) {
     const { slug } = await params;
     return <div>{slug}</div>;
   }
   ```

2. Await cookies() and headers():
   ```typescript
   import { cookies } from 'next/headers';
   
   export default async function Page() {
     const cookieStore = await cookies();
     const token = cookieStore.get('token');
     // ...
   }
   ```

---

### Issue: Next.js 16 middleware not working

**Symptoms:**
```text
middleware.ts not being executed
```

**Solutions:**
1. Rename `middleware.ts` to `proxy.ts`:
   ```typescript
   // proxy.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   
   export async function proxy(request: NextRequest) {
     return NextResponse.next();
   }
   ```

2. Ensure proxy.ts is in the root of app directory

---

### Issue: Next.js 16 Turbopack errors

**Symptoms:**
```text
Error: Module not found with Turbopack
```

**Solutions:**
1. Check for webpack-specific configurations and update for Turbopack:
   ```typescript
   // next.config.ts
   const nextConfig = {
     turbopack: {
       resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
     },
   };
   ```

2. Some webpack plugins may need alternatives for Turbopack

3. Force webpack if needed (not recommended):
   ```bash
   bunx next dev --webpack
   ```

---

### Issue: Firebase Auth verification fails

**Symptoms:**
```text
Error: Firebase ID token has incorrect "aud" (audience) claim
```

**Solutions:**
1. Verify Firebase project configuration:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
   ```

2. Check private key format (must include newlines)
3. Verify token is from correct Firebase project

---

### Issue: WebSocket connection fails

**Symptoms:**
```text
Error: Connection refused
```

**Solutions:**
1. Check CORS configuration:
   ```typescript
   @WebSocketGateway({
     cors: { origin: process.env.CORS_ORIGINS?.split(',') }
   })
   ```

2. Verify Redis connection (if using Redis adapter)
3. Check firewall rules for WebSocket port

---

## 5. Deployment Issues

### Issue: Build fails on Vercel

**Symptoms:**
```text
Error: Command "bun run build" exited with 1
```

**Solutions:**
1. Set Node.js version:
   ```json
   {
     "engines": {
       "node": "20.x"
     }
   }
   ```

2. Check build command:
   ```bash
   bun run build
   ```

3. Verify environment variables are set in Vercel dashboard

---

### Issue: EAS Build fails

**Symptoms:**
```text
Build fails with native module errors
```

**Solutions:**
1. Update EAS CLI:
   ```bash
   bun install -g eas-cli
   ```

2. Clear build cache:
   ```bash
   eas build --platform ios --clear-cache
   ```

3. Check app.json configuration
4. Verify Apple Developer account (for iOS)

---

## 6. Environment Setup Issues

### Issue: Environment variables not loading

**Symptoms:**
```text
Error: DATABASE_URL is not defined
```

**Solutions:**
1. Check .env file exists:
   ```bash
   ls -la .env
   ```

2. Verify variable names (no spaces around =)
3. Restart development server
4. For mobile: Use EXPO_PUBLIC_ prefix

---

### Issue: Git hooks not running

**Symptoms:**
```text
Pre-commit hooks don't execute
```

**Solutions:**
1. Install husky:
   ```bash
   bunx husky install
   ```

2. Make hooks executable:
   ```bash
   chmod +x .husky/*
   ```

3. Check package.json scripts

---

## Quick Fixes

### Reset Everything

```bash
# Clean install
rm -rf node_modules bun.lockb
bun install

# Reset database
bunx prisma migrate reset

# Clear all caches
bun pm cache rm
bunx expo start --clear
```

### Check Versions

```bash
# Check all versions
bun --version
node --version
bunx expo --version
bunx prisma --version
bunx next --version
```

### Prisma 7 Verification

```bash
# Verify Prisma 7 installation
bunx prisma --version
# Should show: prisma 7.4.0 or higher

# Check generated client
ls apps/api/generated/prisma/
# Should contain: client.d.ts, client.js, etc.

# Verify ESM configuration
cat apps/api/package.json | grep '"type"'
# Should show: "type": "module"
```

### Next.js 16 Verification

```bash
# Verify Next.js 16 installation
bunx next --version
# Should show: 16.x.x

# Check Turbopack is running
# Look for "Turbopack" in dev server output

# Verify proxy.ts exists
ls apps/admin/proxy.ts

# Check async APIs are awaited
grep -r "await cookies()" apps/admin/
grep -r "await headers()" apps/admin/
```

### Verify Environment

```bash
# Check env variables
cat .env | grep -E "^(DATABASE_URL|FIREBASE)"

# Test database connection
bunx prisma db pull
```

---

## Getting Help

1. **Check documentation:**
   - [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md)
   - [07-Backend-Architecture.md](./07-Backend-Architecture.md)
   - [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md)

2. **Search issues:**
   - GitHub Issues
   - Stack Overflow
   - Official documentation

3. **Ask for help:**
   - Team chat
   - Code review
   - Pair programming

---

**Last Updated**: 2026-02-10
