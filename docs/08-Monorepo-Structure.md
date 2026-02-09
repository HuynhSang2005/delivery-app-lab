# Logship-MVP: Monorepo Structure Specification

**Version:** 4.0  
**Last Updated:** February 2026  
**Package Manager:** Bun  
**Monorepo Tool:** Bun Workspaces  
**Runtime:** Bun 1.3.9+  

> **Reference:** See [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) for complete tech stack details.

---

## 1. Overview

This document defines the monorepo structure for the Logship-MVP project using **Bun workspaces**, enabling efficient development, building, and deployment across all three applications.

### 1.1. Why Bun Workspaces?

| Benefit | Description |
|---------|-------------|
| **Speed** | Bun is significantly faster than npm/pnpm/yarn |
| **All-in-One** | Runtime, package manager, bundler, test runner in one tool |
| **Native Workspaces** | Built-in workspace support, no additional tools needed |
| **TypeScript** | First-class TypeScript support |
| **Simplicity** | No need for Turborepo, Nx, or other monorepo tools |

### 1.2. Repository Structure Overview

```
logship-mvp/                          # Root
├── apps/                             # Application packages
│   ├── mobile/                       # React Native + Expo SDK 54
│   ├── admin/                        # Next.js 15 Admin Dashboard
│   └── api/                          # NestJS 11 Backend API
├── packages/                         # Shared packages
│   ├── shared-types/                 # TypeScript types (API contracts)
│   ├── shared-config/                # Shared configurations
│   └── shared-utils/                 # Common utility functions
├── docs/                             # Documentation (MD files)
├── .github/                          # GitHub Actions workflows
├── docker/                           # Docker configurations
├── package.json                      # Root package.json with workspaces
├── bun.lockb                         # Bun lockfile
└── tsconfig.json                     # Root TypeScript config
```

---

## 2. Workspace Configuration

### 2.1. Root package.json

```json
{
  "name": "logship-mvp",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:mobile": "bun run --filter @logship/mobile dev",
    "dev:admin": "bun run --filter @logship/admin dev",
    "dev:api": "bun run --filter @logship/api dev",
    "build": "bun run --filter '*' build",
    "build:mobile": "bun run --filter @logship/mobile build",
    "build:admin": "bun run --filter @logship/admin build",
    "build:api": "bun run --filter @logship/api build",
    "lint": "bun run --filter '*' lint",
    "test": "bun run --filter '*' test",
    "test:e2e": "bun run --filter '*' test:e2e",
    "typecheck": "bun run --filter '*' typecheck",
    "clean": "rm -rf node_modules apps/*/node_modules packages/*/node_modules bun.lockb",
    "fresh": "bun run clean && bun install",
    "format": "bunx prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "bunx prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "db:generate": "bun run --filter @logship/api db:generate",
    "db:migrate": "bun run --filter @logship/api db:migrate",
    "db:studio": "bun run --filter @logship/api db:studio"
  },
  "devDependencies": {
    "@logship/shared-config": "workspace:*",
    "prettier": "^3.5.0",
    "typescript": "^5.7.3"
  }
}
```

### 2.2. Workspace Commands

Bun workspaces use the `--filter` flag to target specific packages:

```bash
# Run command in all packages
bun run --filter '*' dev

# Run command in specific package
bun run --filter @logship/mobile dev
bun run --filter @logship/admin build
bun run --filter @logship/api test

# Install dependencies in all packages
bun install

# Add dependency to specific package
bun add --filter @logship/mobile zod

# Add dev dependency to specific package
bun add --filter @logship/api --dev @types/node
```

---

## 3. Applications Structure

### 3.1. apps/mobile - React Native + Expo SDK 54

```
apps/mobile/
├── app/                              # Expo Router (file-based routing)
│   ├── (auth)/                       # Auth screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── otp.tsx
│   ├── (tabs)/                       # Main tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Home/Dashboard
│   │   ├── orders.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── order/                        # Order flows
│   │   ├── [id].tsx
│   │   ├── create.tsx
│   │   └── tracking.tsx
│   ├── chat/
│   │   └── [orderId].tsx
│   ├── _layout.tsx                   # Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/                   # UI components
│   │   ├── ui/                       # Base components
│   │   ├── maps/                     # Map components
│   │   ├── order/                    # Order components
│   │   └── chat/                     # Chat components
│   ├── hooks/                        # Custom hooks
│   ├── stores/                       # Zustand stores
│   ├── services/                     # API services
│   ├── lib/                          # Utilities
│   │   ├── api/                      # Hey-API generated client
│   │   ├── queryClient.ts
│   │   └── storage.ts
│   └── types/                        # TypeScript types
├── assets/                           # Images, fonts
├── app.json                          # Expo configuration
├── eas.json                          # EAS Build configuration
├── openapi-ts.config.ts              # Hey-API config
├── package.json
├── tsconfig.json
└── bun.lockb
```

**package.json:**

```json
{
  "name": "@logship/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "bunx expo start",
    "dev:android": "bunx expo start --android",
    "dev:ios": "bunx expo start --ios",
    "build:android": "bunx eas build --platform android",
    "build:ios": "bunx eas build --platform ios",
    "build:web": "bunx expo export -p web",
    "lint": "bunx eslint src/",
    "typecheck": "bunx tsc --noEmit",
    "generate:api": "bunx openapi-ts"
  },
  "dependencies": {
    "@logship/shared-types": "workspace:*",
    "@hey-api/client-fetch": "^0.8.1",
    "expo": "~54.0.0",
    "expo-router": "~5.0.0",
    "react": "19.0.0",
    "react-native": "0.81.0",
    "@tanstack/react-query": "^5.66.0"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.64.4",
    "@logship/shared-config": "workspace:*",
    "typescript": "^5.7.3"
  }
}
```

### 3.2. apps/admin - Next.js 15 Dashboard

```
apps/admin/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  # Protected dashboard
│   │   ├── layout.tsx                # Sidebar + header
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── users/
│   │   ├── drivers/
│   │   ├── orders/
│   │   └── settings/
│   ├── api/                          # API routes (if any)
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── layout/                       # Layout components
│   ├── dashboard/                    # Dashboard widgets
│   ├── data-table/                   # Table components
│   └── maps/                         # Map components
├── hooks/                            # Custom hooks
├── lib/
│   ├── api/                          # Hey-API generated client
│   ├── query-client.ts
│   └── utils.ts
├── types/                            # Local types
├── public/                           # Static assets
├── .env
├── next.config.js
├── tailwind.config.ts
├── components.json                   # shadcn/ui config
├── hey-api.config.ts                 # Hey-API config
├── package.json
├── tsconfig.json
└── bun.lockb
```

**package.json:**

```json
{
  "name": "@logship/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "bunx next dev -p 3001",
    "build": "bunx next build",
    "start": "bunx next start",
    "lint": "bunx next lint",
    "typecheck": "bunx tsc --noEmit",
    "generate:api": "bunx openapi-ts"
  },
  "dependencies": {
    "@logship/shared-types": "workspace:*",
    "@hey-api/client-fetch": "^0.8.1",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.66.0"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.64.4",
    "@logship/shared-config": "workspace:*",
    "tailwindcss": "^4.0.4",
    "typescript": "^5.7.3"
  }
}
```

### 3.3. apps/api - NestJS 11 Backend

```
apps/api/
├── src/
│   ├── main.ts                       # Entry point
│   ├── app.module.ts                 # Root module
│   ├── config/                       # Configuration
│   │   ├── database.config.ts        # Neon PostgreSQL config
│   │   ├── redis.config.ts           # Upstash Redis config
│   │   ├── firebase.config.ts        # Firebase Auth config
│   │   ├── bullmq.config.ts          # Queue config
│   │   ├── swagger.config.ts         # OpenAPI/Swagger setup
│   │   └── validation.config.ts      # Global validation pipe config
│   ├── common/                       # Shared infrastructure
│   │   ├── constants/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── response.dto.ts
│   │   ├── enums/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts
│   │   │   └── prisma-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── throttler.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   ├── database/                     # Database layer (Prisma + Neon)
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts         # Prisma Client
│   │   ├── geo.service.ts            # PostGIS helpers
│   │   └── repositories/             # Repository pattern
│   │       └── base.repository.ts
│   ├── cache/                        # Redis caching (Upstash)
│   │   ├── cache.module.ts
│   │   ├── redis.service.ts
│   │   └── cache.service.ts
│   ├── queues/                       # BullMQ queues
│   │   ├── queues.module.ts
│   │   ├── notification/
│   │   │   ├── notification.queue.ts
│   │   │   ├── notification.processor.ts
│   │   │   └── notification.producer.ts
│   │   ├── location/
│   │   │   ├── location.queue.ts
│   │   │   ├── location.processor.ts
│   │   │   └── location.producer.ts
│   │   └── order-matching/
│   │       ├── matching.queue.ts
│   │       ├── matching.processor.ts
│   │       └── matching.producer.ts
│   ├── modules/                      # Feature modules
│   │   │
│   │   ├── auth/                     # Auth Module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── firebase.strategy.ts
│   │   │   └── dto/
│   │   │       ├── send-otp.dto.ts
│   │   │       ├── verify-otp.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── users/                    # Users Module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── drivers/                  # Drivers Module
│   │   │   ├── drivers.module.ts
│   │   │   ├── drivers.controller.ts
│   │   │   ├── drivers.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── orders/                   # Orders Module
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── events/
│   │   │   │   ├── order-created.event.ts
│   │   │   │   └── order-assigned.event.ts
│   │   │   └── dto/
│   │   │
│   │   ├── chat/                     # Chat Module
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── chat.service.ts
│   │   │
│   │   └── admin/                    # Admin Module
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       └── admin.service.ts
│   │
│   └── gateway/                      # WebSocket Gateway
│       ├── gateway.module.ts
│       ├── events.gateway.ts
│       ├── adapters/
│       │   └── redis-io.adapter.ts
│       └── dto/
│
├── prisma/
│   ├── schema.prisma                 # Prisma schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Seed data
│
├── test/
│   ├── setup.ts
│   ├── factories/
│   └── e2e/
│
├── .env
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── bun.lockb
```

**package.json:**

```json
{
  "name": "@logship/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "bunx nest build",
    "dev": "bunx nest start --watch",
    "start": "bun run dist/main",
    "start:debug": "bunx nest start --debug --watch",
    "start:prod": "bun run dist/main",
    "lint": "bunx eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "bunx jest",
    "test:e2e": "bunx jest --config ./test/jest-e2e.json",
    "typecheck": "bunx tsc --noEmit",
    "db:generate": "bunx prisma generate",
    "db:migrate": "bunx prisma migrate dev",
    "db:deploy": "bunx prisma migrate deploy",
    "db:seed": "bunx ts-node prisma/seed.ts",
    "db:studio": "bunx prisma studio"
  },
  "dependencies": {
    "@logship/shared-types": "workspace:*",
    "@nestjs/common": "^11.1.6",
    "@nestjs/core": "^11.1.6",
    "@nestjs/platform-express": "^11.1.6",
    "@nestjs/swagger": "^11.1.6",
    "@prisma/client": "^7.3.0",
    "bullmq": "^5.50.0",
    "ioredis": "^5.5.0"
  },
  "devDependencies": {
    "@logship/shared-config": "workspace:*",
    "prisma": "^7.3.0",
    "typescript": "^5.7.3"
  }
}
```

---

## 4. Shared Packages

### 4.1. packages/shared-types

Centralized TypeScript types shared across all applications.

```
packages/shared-types/
├── src/
│   ├── index.ts                      # Main exports
│   ├── api/                          # API types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── driver.types.ts
│   │   ├── order.types.ts
│   │   └── common.types.ts
│   ├── entities/                     # Domain entities
│   │   └── index.ts
│   ├── enums/                        # Shared enums
│   │   ├── order-status.enum.ts
│   │   ├── driver-status.enum.ts
│   │   └── notification-type.enum.ts
│   └── websocket/                    # WebSocket types
│       ├── events.ts
│       └── payloads.ts
├── package.json
└── tsconfig.json
```

**package.json:**

```json
{
  "name": "@logship/shared-types",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "bunx tsc",
    "dev": "bunx tsc --watch",
    "lint": "bunx eslint src/",
    "typecheck": "bunx tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@logship/shared-config": "workspace:*",
    "typescript": "^5.7.3"
  }
}
```

### 4.2. packages/shared-config

Shared configuration files for ESLint, TypeScript, Tailwind, and Prettier.

```
packages/shared-config/
├── eslint/
│   ├── base.js                       # Base ESLint config
│   ├── next.js                       # Next.js specific
│   ├── react-native.js               # React Native specific
│   └── nest.js                       # NestJS specific
├── typescript/
│   ├── base.json                     # Base tsconfig
│   ├── next.json                     # Next.js tsconfig
│   ├── react-native.json             # React Native tsconfig
│   └── nest.json                     # NestJS tsconfig
├── tailwind/
│   └── admin.config.ts               # Admin dashboard config
├── prettier/
│   └── index.js                      # Prettier config
├── package.json
└── README.md
```

**package.json:**

```json
{
  "name": "@logship/shared-config",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./eslint/base": "./eslint/base.js",
    "./eslint/next": "./eslint/next.js",
    "./eslint/react-native": "./eslint/react-native.js",
    "./eslint/nest": "./eslint/nest.js",
    "./typescript/base": "./typescript/base.json",
    "./typescript/next": "./typescript/next.json",
    "./typescript/react-native": "./typescript/react-native.json",
    "./typescript/nest": "./typescript/nest.json",
    "./tailwind/admin": "./tailwind/admin.config.ts",
    "./prettier": "./prettier/index.js"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.23.0",
    "@typescript-eslint/parser": "^8.23.0",
    "eslint": "^9.20.0",
    "eslint-config-prettier": "^10.0.1",
    "prettier": "^3.5.0",
    "tailwindcss": "^4.0.4",
    "typescript": "^5.7.3"
  }
}
```

### 4.3. packages/shared-utils

Common utility functions used across applications.

```
packages/shared-utils/
├── src/
│   ├── index.ts                      # Main exports
│   ├── validators/                   # Validation utilities
│   │   ├── phone.ts
│   │   └── email.ts
│   ├── formatters/                   # Data formatters
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── distance.ts
│   ├── calculations/                 # Math calculations
│   │   ├── distance.ts
│   │   └── pricing.ts
│   └── constants/                    # Shared constants
│       └── app-config.ts
├── package.json
└── tsconfig.json
```

---

## 5. Build & Development Workflows

### 5.1. Development Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run dev` | Start all apps in dev mode |
| `bun run dev:mobile` | Start mobile app only |
| `bun run dev:admin` | Start admin dashboard only |
| `bun run dev:api` | Start API server only |
| `bun run build` | Build all apps |
| `bun run lint` | Lint all packages |
| `bun run test` | Run tests in all packages |
| `bun run typecheck` | Type check all packages |
| `bun run clean` | Clean all node_modules |
| `bun run fresh` | Clean install everything |

### 5.2. API Generation Workflow

When backend API changes:

1. Update Swagger decorators in NestJS controllers
2. Backend generates OpenAPI spec at `http://localhost:3000/api/docs-json`
3. Frontend apps regenerate clients:
   - Mobile: `bun run --filter @logship/mobile generate:api`
   - Admin: `bun run --filter @logship/admin generate:api`

### 5.3. Database Workflow

```bash
# Generate Prisma client after schema changes
bun run db:generate

# Create new migration
bun run --filter @logship/api db:migrate -- --name add_user_status

# Deploy migrations to production
bun run --filter @logship/api db:deploy

# Open Prisma Studio
bun run db:studio

# Seed database
bun run --filter @logship/api db:seed
```

---

## 6. CI/CD Configuration

### 6.1. GitHub Actions Structure

```
.github/
├── workflows/
│   ├── ci.yml                        # Pull request checks
│   ├── cd-mobile.yml                 # Mobile app deployment
│   ├── cd-admin.yml                  # Admin dashboard deployment
│   └── cd-api.yml                    # API deployment
└── actions/
    └── setup-bun/
        └── action.yml
```

### 6.2. CI Workflow (Pull Requests)

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Lint
        run: bun run lint
      
      - name: Type Check
        run: bun run typecheck
      
      - name: Test
        run: bun run test

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build Packages
        run: bun run build
```

---

## 7. Deployment Strategy

### 7.1. Overview

| Component | Platform | Reason |
|-----------|----------|--------|
| **Backend API** | **VPS** (DigitalOcean/AWS Lightsail) | Full control, cost-effective for student |
| **Admin Dashboard** | **Cloudflare Pages** | Free tier, fast global CDN, custom domain support |
| **Mobile App** | **Expo EAS Free Tier** + **GitHub Actions** | 30 builds/month free + unlimited CI builds |

### 7.2. Backend Deployment (VPS)

**Recommended VPS Providers for Students:**

| Provider | Plan | Price | Specs |
|----------|------|-------|-------|
| **DigitalOcean** | Basic Droplet | $4-6/month | 1GB RAM, 1 vCPU, 25GB SSD |
| **AWS Lightsail** | Nano | $3.50/month | 512MB RAM, 1 vCPU, 20GB SSD |
| **Hetzner Cloud** | CX11 | €4.51/month | 2GB RAM, 1 vCPU, 20GB SSD |
| **Vultr** | Cloud Compute | $2.50/month | 512MB RAM, 1 vCPU, 10GB SSD |

**Deployment Process:**

```bash
# 1. Build on CI/CD
bun run build:api

# 2. Deploy to VPS via SSH
cd apps/api
rsync -avz --exclude=node_modules . user@vps-ip:/var/www/logship-api/

# 3. Install dependencies on VPS
ssh user@vps-ip "cd /var/www/logship-api && bun install --production"

# 4. Run migrations
ssh user@vps-ip "cd /var/www/logship-api && bunx prisma migrate deploy"

# 5. Restart PM2
ssh user@vps-ip "pm2 restart logship-api"
```

**PM2 Configuration (ecosystem.config.js):**

```javascript
module.exports = {
  apps: [{
    name: 'logship-api',
    script: './dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }],
};
```

### 7.3. Admin Dashboard Deployment (Cloudflare Pages)

**Why Cloudflare Pages:**
- ✅ Free tier: Unlimited requests, 500 builds/month
- ✅ Global CDN (300+ locations)
- ✅ Custom domain support (you already have one)
- ✅ Automatic HTTPS
- ✅ Fast builds

**Deployment via GitHub Actions:**

```yaml
# .github/workflows/cd-admin.yml
name: Deploy Admin to Cloudflare Pages

on:
  push:
    branches: [main]
    paths:
      - 'apps/admin/**'
      - 'packages/shared-*/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build:admin
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: logship-admin
          directory: apps/admin/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 7.4. Mobile App Deployment

**Option 1: Expo EAS (Recommended for simplicity)**

| Feature | Free Tier |
|---------|-----------|
| EAS Build | 30 builds/month |
| EAS Update | 1,000 updates/month |
| Concurrent builds | 1 |

```bash
# Build with EAS
bunx eas build --platform ios
bunx eas build --platform android

# OTA Updates
bunx eas update
```

**Option 2: GitHub Actions + Self-hosted (Free unlimited builds)**

```yaml
# .github/workflows/cd-mobile.yml
name: Build Mobile Apps

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Install dependencies
        run: bun install
      
      - name: Build Android
        run: |
          cd apps/mobile
          bunx expo prebuild --platform android
          cd android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: apps/mobile/android/app/build/outputs/apk/release/*.apk
```

**Option 3: Capacitor (Alternative)**

If you want to avoid Expo limitations, use Capacitor with Ionic:

```bash
# Convert to Capacitor
bun add @capacitor/core @capacitor/cli
bun add @capacitor/android @capacitor/ios

# Build web app
bun run build

# Sync to native platforms
bunx cap sync

# Open in Android Studio / Xcode
bunx cap open android
bunx cap open ios
```

### 7.5. Database (Neon)

**Already configured** - Neon provides serverless PostgreSQL with:
- Free tier: 0.5GB storage, 190 compute hours/month
- PostGIS extension enabled
- Branching for dev/staging/production

### 7.6. Redis (Upstash)

**Already configured** - Upstash provides serverless Redis with:
- Free tier: 10,000 commands/day, 256MB storage
- Perfect for BullMQ queues and caching

### 7.7. Domain Configuration

**Cloudflare DNS Setup:**

```
Type    Name              Value                      TTL
A       api.logship.app   <VPS_IP>                   Auto
CNAME   admin.logship.app logship-admin.pages.dev    Auto
```

---

## 8. Environment Configuration

### 7.1. Environment Variables Structure

Each app has its own `.env` files:

```
apps/{app-name}/
├── .env                  # Default (gitignored)
├── .env.local            # Local overrides (gitignored)
├── .env.development      # Development defaults
├── .env.production       # Production defaults
└── .env.example          # Example for new developers
```

### 7.2. Shared Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | API only |
| `REDIS_URL` | Upstash Redis connection string | API only |
| `FIREBASE_PROJECT_ID` | Firebase project ID | API, Mobile, Admin |
| `API_BASE_URL` | Backend API URL | Mobile, Admin |
| `WEBSOCKET_URL` | WebSocket server URL | Mobile |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | API |
| `GOONG_API_KEY` | Goong Maps API key | Mobile, Admin, API |

---

## 9. Cross-App Communication

### 8.1. Shared Types Contract

All apps use `@logship/shared-types` for type safety:

```typescript
// packages/shared-types/src/api/order.types.ts
export interface CreateOrderRequest {
  pickupAddress: string;
  deliveryAddress: string;
  vehicleTypeId: string;
  notes?: string;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  pickupLocation: GeoLocation;
  deliveryLocation: GeoLocation;
}
```

### 8.2. API Client Generation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Backend API   │────▶│  Swagger/OpenAPI│────▶│  hey-api CLI    │
│   (NestJS)      │     │  Specification  │     │  Generator      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                              ┌──────────────────────────┼──────────────────────────┐
                              ▼                          ▼                          ▼
                       ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
                       │   Mobile    │            │    Admin    │            │ Future Apps │
                       │ (React Nat) │            │  (Next.js)  │            │             │
                       └─────────────┘            └─────────────┘            └─────────────┘
```

---

## 10. Best Practices

### 9.1. Adding New Dependencies

**External Dependencies:**
```bash
# Add to specific app
bun add --filter @logship/mobile lodash-es

# Add to shared package
bun add --filter @logship/shared-utils date-fns

# Add dev dependency
bun add --filter @logship/admin --dev @types/node
```

**Workspace Dependencies:**
```bash
# Reference workspace package
bun add --filter @logship/mobile @logship/shared-types
```

### 9.2. Code Organization Rules

1. **Shared Types First:** Always add types to `shared-types` before using in apps
2. **No Cross-App Imports:** Apps should only import from `packages/*`, never from other `apps/*`
3. **Build Before Commit:** Run `bun run build` before pushing to ensure no broken references
4. **Version Pinning:** Use exact versions for critical dependencies (React Native, Next.js, NestJS)

### 9.3. Git Workflow

```bash
# Feature branch workflow
git checkout -b feat/user-profile
# Make changes
git add .
git commit -m "feat: add user profile page"
git push origin feat/user-profile
```

---

## 11. Migration from Other Package Managers

### 10.1. From npm/pnpm/yarn

1. **Delete old lockfiles:**
   ```bash
   rm package-lock.json pnpm-lock.yaml yarn.lock
   ```

2. **Update root package.json:**
   ```json
   {
     "workspaces": ["apps/*", "packages/*"]
   }
   ```

3. **Remove old config files:**
   ```bash
   rm pnpm-workspace.yaml turbo.json
   ```

4. **Install with Bun:**
   ```bash
   bun install
   ```

5. **Update scripts:**
   - Change `npm run` → `bun run`
   - Change `npx` → `bunx`
   - Change `pnpm` → `bun`

---

## 11. Commands Reference

| Task | npm/pnpm | Bun |
|------|----------|-----|
| Install | `npm install` | `bun install` |
| Add dep | `npm install pkg` | `bun add pkg` |
| Add dev | `npm install -D pkg` | `bun add -d pkg` |
| Run | `npm run dev` | `bun run dev` |
| Execute | `npx cmd` | `bunx cmd` |
| Filter | `pnpm --filter pkg` | `bun run --filter pkg` |

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) | Complete tech stack specification |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | System architecture |
| [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) | Mobile app details |
| [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md) | Admin dashboard details |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | Backend architecture |

---

**END OF DOCUMENT**
