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
```
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

3. Use npm as fallback:
   ```bash
   npm install
   ```

---

### Issue: TypeScript errors after updating packages

**Symptoms:**
```
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
```
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

### Issue: PostGIS functions not working

**Symptoms:**
```
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
```
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
App crashes immediately after opening

**Solutions:**
1. Clear Expo cache:
   ```bash
   npx expo start --clear
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
Location updates stop when app is in background

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
Blank map or tiles not loading

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
```
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

### Issue: Firebase Auth verification fails

**Symptoms:**
```
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
```
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
```
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
Build fails with native module errors

**Solutions:**
1. Update EAS CLI:
   ```bash
   npm install -g eas-cli
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
```
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
Pre-commit hooks don't execute

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
npx expo start --clear
```

### Check Versions

```bash
# Check all versions
bun --version
node --version
npx expo --version
bunx prisma --version
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
