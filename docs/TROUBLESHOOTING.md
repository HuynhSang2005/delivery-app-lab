# Troubleshooting Guide

Common issues and solutions for Logship-MVP development and deployment.

## Table of Contents

- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Mobile App Issues](#mobile-app-issues)
- [Backend Issues](#backend-issues)
- [Deployment Issues](#deployment-issues)
- [Environment Setup Issues](#environment-setup-issues)

## Development Issues

### Issue: `bun install` fails

**Symptoms:**
```
error: Failed to install packages
```

**Solutions:**

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules bun.lockb
   bun install
   ```

2. **Check Bun version:**
   ```bash
   bun --version  # Should be 1.2+
   ```

3. **Update Bun:**
   ```bash
   bun upgrade
   ```

### Issue: TypeScript errors after pulling latest code

**Symptoms:**
```
Type error: Cannot find module '@logship/shared-types'
```

**Solutions:**

1. **Rebuild shared packages:**
   ```bash
   bun run --filter @logship/shared-types build
   ```

2. **Type check all packages:**
   ```bash
   bun run typecheck
   ```

3. **Restart TypeScript server** (VS Code):
   - Press `Cmd/Ctrl + Shift + P`
   - Type "TypeScript: Restart TS Server"

### Issue: Changes not reflecting in development

**Symptoms:**
Code changes not showing in browser/app

**Solutions:**

1. **Clear cache:**
   ```bash
   # For Next.js
   rm -rf apps/admin/.next
   
   # For all
   bun run clean
   bun install
   ```

2. **Restart development server:**
   ```bash
   # Stop current server (Ctrl+C)
   bun run dev
   ```

## Database Issues

### Issue: Prisma Client not found

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solutions:**

1. **Generate Prisma Client:**
   ```bash
   bun run db:generate
   # or
   bun run --filter @logship/api db:generate
   ```

2. **Check Prisma schema exists:**
   ```bash
   ls apps/api/prisma/schema.prisma
   ```

### Issue: Database connection failed

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Solutions:**

1. **Check DATABASE_URL:**
   ```bash
   # Verify .env file exists
cat apps/api/.env | grep DATABASE_URL
   ```

2. **Test connection manually:**
   ```bash
   cd apps/api
   bunx prisma db pull
   ```

3. **Check Neon database status:**
   - Go to [Neon Console](https://console.neon.tech/)
   - Verify project is active
   - Check connection limits

4. **Use pooled connection:**
   ```env
   # Use the -pooler endpoint
   DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

### Issue: Migration fails

**Symptoms:**
```
Error: P3005: The database schema is not empty
```

**Solutions:**

1. **Baseline existing database:**
   ```bash
   bunx prisma migrate resolve --applied 0_init
   ```

2. **Reset database (development only):**
   ```bash
   bunx prisma migrate reset
   ```

3. **Check migration status:**
   ```bash
   bunx prisma migrate status
   ```

### Issue: PostGIS queries not working

**Symptoms:**
```
Error: function st_makepoint does not exist
```

**Solutions:**

1. **Enable PostGIS extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **Verify extension is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'postgis';
   ```

3. **Check Prisma schema:**
   ```prisma
   datasource db {
     provider   = "postgresql"
     url        = env("DATABASE_URL")
     extensions = [postgis]
   }
   ```

## Mobile App Issues

### Issue: Expo Go crashes on start

**Symptoms:**
App crashes immediately when opening in Expo Go

**Solutions:**

1. **Clear Expo Go cache:**
   - iOS: Delete and reinstall Expo Go app
   - Android: Settings → Apps → Expo Go → Clear Cache

2. **Reset Metro bundler:**
   ```bash
   # Press 'r' in terminal to reload
   # Or stop and restart
   bun run dev:mobile
   ```

3. **Check for native module issues:**
   ```bash
   # Some features require development build
   bunx eas build --profile development
   ```

### Issue: Background location not working

**Symptoms:**
Driver location not updating when app is in background

**Solutions:**

1. **Use development build:**
   ```bash
   # Background location doesn't work in Expo Go
   bunx eas build --profile development
   ```

2. **Check permissions:**
   ```typescript
   const { status } = await Location.requestBackgroundPermissionsAsync();
   if (status !== 'granted') {
     console.error('Background location permission denied');
   }
   ```

3. **Verify task is registered:**
   ```typescript
   // In app.json or app.config.js
   {
     "expo": {
       "plugins": [
         [
           "expo-location",
           {
             "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
           }
         ]
       ]
     }
   }
   ```

### Issue: API calls failing in mobile app

**Symptoms:**
Network errors when calling backend API

**Solutions:**

1. **Check API URL:**
   ```env
   # Make sure you're not using localhost from device
   EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3000/api/v1  # Your computer's IP
   ```

2. **Allow cleartext traffic (Android):**
   ```json
   {
     "expo": {
       "android": {
         "usesCleartextTraffic": true
       }
     }
   }
   ```

3. **Check CORS on backend:**
   ```typescript
   // In NestJS main.ts
   app.enableCors({
     origin: ['http://localhost:8081'], // Expo development
   });
   ```

### Issue: Maps not displaying

**Symptoms:**
Blank map or map tiles not loading

**Solutions:**

1. **Check Goong API key:**
   ```env
   EXPO_PUBLIC_GOONG_API_KEY=your-goong-api-key
   ```

2. **Verify react-native-maps setup:**
   ```bash
   # For iOS
   cd ios && pod install
   
   # For Android, check AndroidManifest.xml
   ```

3. **Use Goong tiles URL:**
   ```typescript
   <MapView
     provider={PROVIDER_DEFAULT}
     urlTemplate="https://tiles.goong.io/tiles/{z}/{x}/{y}.png?api_key=YOUR_KEY"
   />
   ```

### Issue: Firebase Auth not working

**Symptoms:**
OTP not sending or verification failing

**Solutions:**

1. **Check Firebase config:**
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=correct-api-key
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=correct-project-id
   ```

2. **Enable Phone Auth in Firebase:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Phone" provider
   - Add SHA-1 fingerprint for Android (if needed)

3. **Test with test numbers:**
   - Firebase Console → Authentication → Sign-in method → Phone
   - Add test phone numbers

## Backend Issues

### Issue: NestJS won't start

**Symptoms:**
```
Error: Cannot find module './app.module'
```

**Solutions:**

1. **Check for TypeScript compilation errors:**
   ```bash
   bun run typecheck
   ```

2. **Rebuild:**
   ```bash
   bun run build
   ```

3. **Check imports:**
   ```typescript
   // Use relative imports
   import { AppModule } from './app.module';
   
   // Not absolute
   import { AppModule } from 'src/app.module'; // ❌
   ```

### Issue: WebSocket connections failing

**Symptoms:**
```
Error: Connection refused
```

**Solutions:**

1. **Check WebSocket gateway is registered:**
   ```typescript
   @WebSocketGateway({
     cors: { origin: '*' }, // Configure properly for production
   })
   ```

2. **Verify Redis adapter (if using):**
   ```typescript
   // Check Redis connection
   const redisAdapter = new RedisAdapter(pubClient, subClient);
   ```

3. **Check firewall/port:**
   ```bash
   # WebSocket uses same port as HTTP (3000)
   # Ensure port is open
   ```

### Issue: JWT token validation failing

**Symptoms:**
```
Error: Unauthorized
```

**Solutions:**

1. **Check JWT secret:**
   ```env
   JWT_SECRET=your-secret-key-min-32-characters
   ```

2. **Verify token format:**
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

3. **Check token expiration:**
   ```typescript
   // Default is 15 minutes
   JWT_EXPIRES_IN=15m
   ```

### Issue: File uploads failing

**Symptoms:**
```
Error: File too large
```

**Solutions:**

1. **Increase body parser limit:**
   ```typescript
   // In main.ts
   app.use(bodyParser.json({ limit: '10mb' }));
   app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
   ```

2. **Use Cloudinary for large files:**
   ```typescript
   // Upload to Cloudinary instead of local storage
   ```

### Issue: Rate limiting blocking requests

**Symptoms:**
```
Error: Too Many Requests
```

**Solutions:**

1. **Adjust rate limits for development:**
   ```typescript
   ThrottlerModule.forRoot({
     throttlers: [{
       ttl: 60000,
       limit: 100, // Increase for dev
     }],
   }),
   ```

2. **Whitelist local IPs:**
   ```typescript
   // In throttler config
   skipIf: (context) => {
     const request = context.switchToHttp().getRequest();
     return request.ip === '127.0.0.1';
   }
   ```

## Deployment Issues

### Issue: Build fails on Railway/Render

**Symptoms:**
```
Error: Cannot find module '@logship/shared-types'
```

**Solutions:**

1. **Build shared packages first:**
   ```json
   {
     "scripts": {
       "build": "bun run --filter @logship/shared-types build && bun run build:api"
     }
   }
   ```

2. **Check build command:**
   ```bash
   # Should install all dependencies
   bun install && bun run build
   ```

### Issue: Environment variables not loading

**Symptoms:**
```
Error: DATABASE_URL is not defined
```

**Solutions:**

1. **Check variable names:**
   - Railway/Render: Variables are case-sensitive
   - Vercel: Must prefix client-side vars with `NEXT_PUBLIC_`

2. **Verify in dashboard:**
   - Go to hosting dashboard
   - Check Environment Variables section
   - Redeploy after changing variables

3. **For mobile:**
   ```bash
   # Must rebuild to update env vars in binary
   eas build --profile production
   ```

### Issue: CORS errors in production

**Symptoms:**
```
Access to fetch at 'https://api.example.com' blocked by CORS policy
```

**Solutions:**

1. **Update CORS origins:**
   ```typescript
   app.enableCors({
     origin: [
       'https://admin.logship.app',
       'https://app.logship.app',
       // Add your production domains
     ],
     credentials: true,
   });
   ```

2. **Don't use wildcard in production:**
   ```typescript
   // ❌ Bad for production
   origin: '*'
   
   // ✅ Good
   origin: ['https://yourdomain.com']
   ```

## Environment Setup Issues

### Issue: Firebase service account key errors

**Symptoms:**
```
Error: Failed to parse private key
```

**Solutions:**

1. **Format private key correctly:**
   ```env
   # Replace newlines with \n
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

2. **Or use JSON format:**
   ```typescript
   // Save as firebase-service-account.json
   // Load in code
   const serviceAccount = JSON.parse(
     fs.readFileSync('./firebase-service-account.json', 'utf8')
   );
   ```

### Issue: Redis connection timeout

**Symptoms:**
```
Error: Connection timeout
```

**Solutions:**

1. **Use TLS for Upstash:**
   ```typescript
   const redis = new Redis(process.env.REDIS_URL, {
     tls: { rejectUnauthorized: false }
   });
   ```

2. **Check Redis URL format:**
   ```env
   # Should start with rediss:// (with double s)
   REDIS_URL=rediss://default:pass@host.upstash.io:6379
   ```

### Issue: Cloudinary upload fails

**Symptoms:**
```
Error: Invalid API Key
```

**Solutions:**

1. **Verify credentials:**
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

2. **Check upload preset (if using):**
   ```typescript
   cloudinary.uploader.upload(file, {
     upload_preset: 'your_preset_name'
   })
   ```

## Getting Help

If you can't resolve an issue:

1. **Check documentation:**
   - [Expo Docs](https://docs.expo.dev/)
   - [NestJS Docs](https://docs.nestjs.com/)
   - [Prisma Docs](https://www.prisma.io/docs)
   - [Neon Docs](https://neon.tech/docs)

2. **Search issues:**
   - [GitHub Issues](https://github.com/yourusername/logship-mvp/issues)
   - Stack Overflow

3. **Ask for help:**
   - Create a GitHub issue with:
     - Clear description
     - Steps to reproduce
     - Expected vs actual behavior
     - Environment details (OS, versions)
     - Error messages/logs

## Common Error Messages Reference

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `P1001` | Database unreachable | Check DATABASE_URL, network |
| `P3005` | Migration conflict | Run `prisma migrate resolve` |
| `EADDRINUSE` | Port already in use | Kill process or change port |
| `MODULE_NOT_FOUND` | Missing dependency | Run `bun install` |
| `CORS` | CORS not configured | Update CORS origins |
| `JWT_EXPIRED` | Token expired | Refresh token or login again |
| `ENOTFOUND` | DNS lookup failed | Check API URL, network |

---

**Last Updated**: 2025-02-03
