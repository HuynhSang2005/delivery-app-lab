# Deployment Guide

This guide covers deploying Logship-MVP to production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
- [Backend Deployment](#backend-deployment)
- [Admin Dashboard Deployment](#admin-dashboard-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Rollback Procedures](#rollback-procedures)

## Overview

### Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │     VPS      │  │    Vercel    │  │  Expo EAS    │           │
│  │  (Backend)   │  │    (Admin)   │  │   (Mobile)   │           │
│  │              │  │              │  │              │           │
│  │  NestJS API  │  │  Next.js 16  │  │  React Native│           │
│  │  WebSocket   │  │              │  │  + Expo SDK  │           │
│  └──────┬───────┘  └──────────────┘  └──────────────┘           │
│         │                                                       │
│         └──────────────┬────────────────────────────────────────┘
│                        │
│         ┌──────────────┼──────────────┐
│         │              │              │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  │    Neon     │ │  Upstash   │ │ Cloudinary  │
│  │ PostgreSQL  │ │   Redis    │ │  (Images)   │
│  │  + PostGIS  │ │            │ │             │
│  └─────────────┘ └────────────┘ └─────────────┘
```

### Deployment Order

1. Database (Neon) - Already provisioned
2. Redis (Upstash) - Already provisioned
3. Backend API (VPS - DigitalOcean/AWS/Hetzner)
4. Admin Dashboard (Vercel)
5. Mobile App (Expo EAS)

## Prerequisites

### Accounts Required

- [Neon](https://neon.tech/) - Database (already set up)
- [Upstash](https://upstash.com/) - Redis (already set up)
- **VPS Provider** (DigitalOcean/AWS/Hetzner) - Backend hosting
- [Vercel](https://vercel.com/) - Admin dashboard hosting
- [Expo](https://expo.dev/) - Mobile app builds
- [Cloudinary](https://cloudinary.com/) - Image storage
- [Firebase](https://firebase.google.com/) - Authentication

### Tools Required

```bash
# Install Railway CLI (optional)
bun install -g @railway/cli

# Install Vercel CLI
bun install -g vercel

# Install EAS CLI
bun install -g eas-cli

# Login to services
railway login
vercel login
eas login
```

## Infrastructure Setup

### 1. Neon Database (Production)

```bash
# Create production branch in Neon
# 1. Go to Neon Console
# 2. Create new branch from main
# 3. Name it "production"

# Get connection string
# Settings → Connection String → Pooled connection
# Copy DATABASE_URL
```

**Production Database URL:**
```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

### 2. Upstash Redis (Production)

```bash
# Create new Redis database in Upstash
# 1. Go to Upstash Console
# 2. Create Database
# 3. Select region closest to your backend (Singapore for Vietnam)
# 4. Copy REDIS_URL
```

**Production Redis URL:**
```
rediss://default:pass@host.upstash.io:6379
```

### 3. Firebase (Production)

```bash
# Create separate Firebase project for production
# 1. Go to Firebase Console
# 2. Create new project "logship-production"
# 3. Enable Authentication → Phone provider
# 4. Download service account key
# 5. Save as firebase-service-account.json (DO NOT COMMIT)
```

### 4. Cloudinary (Production)

```bash
# Use existing account or create new
# 1. Go to Cloudinary Dashboard
# 2. Copy Cloud Name, API Key, API Secret
```

## Backend Deployment

### VPS Deployment (Recommended)

We use a VPS (Virtual Private Server) for backend deployment to have full control over the environment and reduce costs.

#### Recommended VPS Providers

| Provider | Plan | Price | Specs |
|----------|------|-------|-------|
| **DigitalOcean** | Basic Droplet | $4-6/month | 1GB RAM, 1 vCPU, 25GB SSD |
| **AWS Lightsail** | Nano | $3.50/month | 512MB RAM, 1 vCPU, 20GB SSD |
| **Hetzner Cloud** | CX11 | €4.51/month | 2GB RAM, 1 vCPU, 20GB SSD |
| **Vultr** | Cloud Compute | $2.50/month | 512MB RAM, 1 vCPU, 10GB SSD |

#### Step 1: Provision VPS

1. Sign up with your preferred VPS provider
2. Create a new Ubuntu 22.04 LTS server
3. Note the server IP address
4. Add your SSH key for secure access

#### Step 2: Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install PM2 globally
bun install -g pm2

# Install Git
apt install git -y

# Create app directory
mkdir -p /var/www/logship-api
cd /var/www/logship-api
```

#### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/logship-mvp.git .

# Install dependencies
bun install

# Generate Prisma Client
cd apps/api
bunx prisma generate

# Run migrations
bunx prisma migrate deploy

# Build application
bun run build

# Start with PM2
pm2 start dist/main.js --name logship-api

# Save PM2 config
pm2 save
pm2 startup
```

#### Step 4: Environment Variables

Create `.env` file in `/var/www/logship-api/apps/api/`:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

# Redis
REDIS_URL=rediss://default:pass@host.upstash.io:6379

# Firebase
FIREBASE_PROJECT_ID=logship-production
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@logship-production.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Goong Maps
GOONG_API_KEY=your-goong-api-key

# CORS
CORS_ORIGINS=https://admin.logship.app,https://app.logship.app
```

#### Step 5: Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/logship-api << 'EOF'
server {
    listen 80;
    server_name api.logship.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/logship-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
certbot --nginx -d api.logship.app

# Auto-renewal is set up automatically
```

#### Step 7: Domain Setup

Point your domain to the VPS IP:
```
Type    Name              Value                      TTL
A       api.logship.app   <VPS_IP>                   Auto
```

### Alternative: Render (Not Recommended)

While Render is an option, we recommend using a VPS for better control and cost-effectiveness.

#### Step 1: Create Web Service (Skip - Use VPS Instead)

We recommend following the VPS deployment guide above for better performance and cost savings.

## Admin Dashboard Deployment

### Vercel Deployment

#### Step 1: Connect Repository

```bash
# Using Vercel CLI
vercel

# Or use GitHub integration:
# 1. Go to Vercel Dashboard
# 2. Import Git Repository
# 3. Select repository
```

#### Step 2: Configure Project

```yaml
# Vercel configuration
Framework Preset: Next.js
Root Directory: apps/admin
Build Command: bun run build
Output Directory: .next
```

#### Step 3: Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
# API
NEXT_PUBLIC_API_URL=https://api.logship.app/api/v1
NEXT_PUBLIC_SOCKET_URL=wss://api.logship.app

# Goong Maps
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your-goong-maptiles-key
NEXT_PUBLIC_GOONG_API_KEY=your-goong-api-key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=logship-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=logship-production
```

#### Step 4: Deploy

```bash
# Deploy using CLI
vercel --prod

# Or push to main branch (auto-deploy)
```

#### Step 5: Custom Domain

```bash
# In Vercel Dashboard
Settings → Domains → Add
Domain: admin.logship.app
```

## Mobile App Deployment

### Expo EAS Build

#### Step 1: Configure EAS

```bash
# Login to Expo
eas login

# Configure project
cd apps/mobile
eas build:configure

# Select platforms: Android, iOS
```

#### Step 2: Update app.json

```json
{
  "expo": {
    "name": "Logship",
    "slug": "logship-mvp",
    "version": "1.0.0",
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "android": {
      "package": "com.yourcompany.logship",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.logship",
      "buildNumber": "1.0.0"
    }
  }
}
```

#### Step 3: Environment Variables

Create `apps/mobile/.env.production`:

```env
EXPO_PUBLIC_API_URL=https://api.logship.app/api/v1
EXPO_PUBLIC_SOCKET_URL=wss://api.logship.app
EXPO_PUBLIC_GOONG_API_KEY=your-goong-api-key
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=logship-production.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=logship-production
```

#### Step 4: Build Production App

```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Or build both
eas build --platform all --profile production
```

#### Step 5: Submit to Stores

```bash
# Submit to Play Store (Android)
eas submit --platform android

# Submit to App Store (iOS)
eas submit --platform ios
```

### Manual Distribution

#### Android APK

```bash
# Build APK
eas build --platform android --profile preview

# Download APK from Expo dashboard
# Distribute directly to testers
```

#### iOS TestFlight

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Automatically submits to TestFlight
# Invite testers in App Store Connect
```

## Environment Variables

### Production Environment Variables Summary

#### Backend (.env.production)

```env
# Server
NODE_ENV=production
PORT=3000

# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

# Redis (Upstash)
REDIS_URL=rediss://default:pass@host.upstash.io:6379

# Firebase
FIREBASE_PROJECT_ID=logship-production
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@logship-production.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Goong Maps
GOONG_API_KEY=your-goong-key

# CORS
CORS_ORIGINS=https://admin.logship.app,https://app.logship.app
```

#### Admin Dashboard (.env.production)

```env
# API
NEXT_PUBLIC_API_URL=https://api.logship.app/api/v1
NEXT_PUBLIC_SOCKET_URL=wss://api.logship.app

# Goong Maps
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your-goong-maptiles-key
NEXT_PUBLIC_GOONG_API_KEY=your-goong-api-key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=logship-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=logship-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=logship-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### Mobile App (.env.production)

```env
# API
EXPO_PUBLIC_API_URL=https://api.logship.app/api/v1
EXPO_PUBLIC_SOCKET_URL=wss://api.logship.app

# Goong Maps
EXPO_PUBLIC_GOONG_API_KEY=your-goong-api-key

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=logship-production.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=logship-production
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=logship-production.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Post-Deployment Checklist

### Backend Verification (VPS)

- [ ] API responds to health check endpoint
- [ ] PM2 process running (`pm2 status`)
- [ ] Nginx serving requests
- [ ] SSL certificate valid
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Firebase Auth working
- [ ] Cloudinary uploads working
- [ ] WebSocket connections working
- [ ] Swagger docs accessible at `/api/docs`
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] Auto-restart on crash (PM2)
- [ ] Log rotation configured

### Admin Dashboard Verification

- [ ] Dashboard loads without errors
- [ ] API calls successful
- [ ] Authentication working
- [ ] Maps displaying correctly
- [ ] Real-time updates working
- [ ] Responsive on mobile devices

### Mobile App Verification

- [ ] App builds successfully
- [ ] Login with OTP working
- [ ] API calls successful
- [ ] Maps displaying correctly
- [ ] Location tracking working
- [ ] Push notifications working
- [ ] Chat functionality working

### Security Checks

- [ ] Environment variables not exposed in client code
- [ ] API has authentication on all protected routes
- [ ] CORS origins restricted to known domains
- [ ] Rate limiting enabled
- [ ] No sensitive data in logs
- [ ] HTTPS enforced

### Monitoring Setup

- [ ] Error tracking (Sentry) configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring active
- [ ] Database monitoring enabled
- [ ] Alert notifications configured

## Rollback Procedures

### Backend Rollback (VPS)

```bash
# SSH into VPS
ssh root@your-server-ip

# Navigate to app directory
cd /var/www/logship-api/apps/api

# Pull previous version
git revert HEAD
git pull origin main

# Rebuild and restart
bun run build
pm2 restart logship-api

# Or restore from backup if needed
```

### Admin Dashboard Rollback

```bash
# Vercel
vercel --prod

# Or use dashboard to promote previous deployment
```

### Mobile App Rollback

```bash
# Submit new build with previous version code
eas build --platform all --profile production

# Or use OTA update to fix issues without store submission
eas update --branch production --message "Hotfix"
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
      - run: bun run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railway/cli@latest
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
      - run: railway up

  deploy-admin:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action-deploy@v1
        with:
          vercel_token: ${{ secrets.VERCEL_TOKEN }}
          vercel_project_id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Troubleshooting

### Common Deployment Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Support

- Railway: [Documentation](https://docs.railway.app/)
- Render: [Documentation](https://render.com/docs)
- Vercel: [Documentation](https://vercel.com/docs)
- Expo: [Documentation](https://docs.expo.dev/build/introduction/)

---

**Last Updated**: 2026-02-09
