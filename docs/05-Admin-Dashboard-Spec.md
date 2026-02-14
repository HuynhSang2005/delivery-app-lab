# Logship-MVP: Admin Dashboard Specification

**Version:** 5.0  
**Last Updated:** February 2026
**Framework:** React 19 / Next.js 16 (App Router)  
**UI:** Tailwind CSS v4 + Shadcn/ui  
**Package Manager:** Bun  

> **Reference:** See [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) for complete tech stack details.

---

## 1. Overview

The Admin Dashboard is a web application for system administrators to manage users, drivers, orders, and view analytics.

### 1.1. Target Users

- **System Administrators**: Full access to all features
- (Future: Operations staff with limited access)

### 1.2. Key Features

| Feature | Description |
|---------|-------------|
| Dashboard | Overview stats, charts, real-time order map |
| User Management | View/search users, toggle status |
| Driver Management | Approve/reject drivers, view documents |
| Order Management | View all orders, filter, cancel orders |
| Live Tracking | Real-time map of active deliveries |
| Settings | System configuration (pricing, etc.) |

---

## 2. Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js 16 (App Router) | ^16.1.6 |
| Language | TypeScript | ^5.9.3 |
| React | React 19 | ^19.2.4 |
| State (Server) | TanStack Query | ^5.90.21 |
| State (Client) | Zustand | ^5.0.11 |
| UI Components | Shadcn/ui + Radix UI | ^2.0.0 |
| Styling | Tailwind CSS | ^4.1.18 |
| Tables | TanStack Table | ^8.21.3 |
| Charts | Recharts | ^2.15.1 |
| Maps | Goong JS (Mapbox GL compatible) | ^3.10.0 |
| Forms | React Hook Form + Zod | ^7.71.1 / ^4.3.6 |
| Icons | Lucide React | ^0.475.0 |
| Date | date-fns | ^4.1.0 |
| API Client | Hey-API | ^0.13.1 |
| Package Manager | Bun | ^1.3.9 |

> **⚠️ BREAKING CHANGES (Next.js 16):** Turbopack is now default, async request APIs required, middleware renamed to proxy, and more. See [Next.js 16 Migration Guide](#12-nextjs-16-migration-guide) below.

---

## 3. Project Structure

```
apps/admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Dashboard home
│   │   ├── users/
│   │   │   ├── page.tsx            # Users list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # User details
│   │   ├── drivers/
│   │   │   ├── page.tsx            # Drivers list
│   │   │   ├── pending/
│   │   │   │   └── page.tsx        # Pending approvals
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Driver details
│   │   ├── orders/
│   │   │   ├── page.tsx            # Orders list
│   │   │   ├── live/
│   │   │   │   └── page.tsx        # Live tracking map
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Order details
│   │   └── settings/
│   │       └── page.tsx            # System settings
│   ├── api/                        # API routes (if needed)
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── ui/                         # Shadcn/ui components
│   ├── layout/                     # Layout components
│   ├── dashboard/                  # Dashboard widgets
│   ├── data-table/                 # Table components
│   └── maps/                       # Map components
├── hooks/                          # Custom hooks
├── lib/
│   ├── api/                        # Hey-API generated client
│   │   └── generated/
│   ├── goong.ts                    # Goong Maps service
│   ├── query-client.ts             # TanStack Query
│   └── utils.ts
├── types/                          # Local types
├── public/                         # Static assets
├── .env
├── next.config.js
├── tailwind.config.ts
├── components.json                 # shadcn/ui config
├── hey-api.config.ts               # Hey-API config
├── package.json
├── tsconfig.json
└── bun.lockb
```

---

## 4. Core Dependencies

### 4.1. Complete Package.json

```json
{
  "name": "@logship/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "bunx next dev -p 3001",
    "build": "bunx next build",
    "start": "bunx next start",
    "generate:api": "bunx openapi-ts",
    "typecheck": "bunx tsc --noEmit"
  },
  
> **⚠️ BREAKING CHANGE:** `next lint` command has been removed in Next.js 16. Use `bunx eslint` directly or configure lint script as `"lint": "bunx eslint ."`.
  "dependencies": {
    "@hey-api/client-fetch": "^0.13.1",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-hover-card": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.0",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@tanstack/react-query": "^5.90.21",
    "@tanstack/react-query-devtools": "^5.90.21",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.4",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.5.2",
    "framer-motion": "^12.4.2",
    "input-otp": "^1.4.2",
    "lodash-es": "^4.17.21",
    "lucide-react": "^0.475.0",
    "mapbox-gl": "^3.10.0",
    "next": "^16.1.6",
    "next-themes": "^0.4.4",
    "nuqs": "^2.3.2",
    "react": "^19.2.4",
    "react-day-picker": "^9.5.1",
    "react-dom": "^19.2.4",
    "react-error-boundary": "^5.0.0",
    "react-hook-form": "^7.71.1",
    "@hookform/resolvers": "^5.2.2",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.1",
    "socket.io-client": "^4.8.3",
    "sonner": "^1.7.4",
    "tailwind-merge": "^3.0.1",
    "tailwindcss": "^4.1.18",
    "tailwindcss-animate": "^1.0.7",
    "use-debounce": "^10.0.4",
    "vaul": "^1.1.2",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.92.4",
    "@types/lodash-es": "^4.17.12",
    "@types/mapbox-gl": "^3.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.2.4",
    "@types/react-dom": "^19.2.4",
    "typescript": "^5.9.3"
  }
}
```

### 4.2. Essential Libraries Overview

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | `next` | ^16.1.6 | Next.js 16 App Router |
| **React** | `react` | ^19.2.4 | React 19 |
| **React DOM** | `react-dom` | ^19.2.4 | React DOM |
| **API Client** | `@hey-api/client-fetch` | ^0.13.1 | Type-safe API client |
| **State (Server)** | `@tanstack/react-query` | ^5.90.21 | Server state management |
| **State (Client)** | `zustand` | ^5.0.11 | Client state management |
| **UI Components** | `@radix-ui/react-*` | ^1.1-2.1.0 | Headless UI primitives |
| **Styling** | `tailwindcss` | ^4.1.18 | Utility-first CSS |
| **Tables** | `@tanstack/react-table` | ^8.21.3 | Data tables |
| **Charts** | `recharts` | ^2.15.1 | Charts & graphs |
| **Maps** | `mapbox-gl` | ^3.10.0 | Map rendering (Goong tiles) |
| **Forms** | `react-hook-form` | ^7.71.1 | Form handling |
| **Validation** | `zod` | ^4.3.6 | Schema validation (Zod v4 - latest) |
| **Animations** | `framer-motion` | ^12.4.2 | UI animations |
| **Command Palette** | `cmdk` | ^1.0.4 | Command menu |
| **Drawer** | `vaul` | ^1.1.2 | Drawer component |
| **URL State** | `nuqs` | ^2.3.2 | Query string state |
| **Debounce** | `use-debounce` | ^10.0.4 | Debounce hooks |
| **Themes** | `next-themes` | ^0.4.4 | Dark/light mode |
| **Error Handling** | `react-error-boundary` | ^5.0.0 | Error boundaries |
| **Real-time** | `socket.io-client` | ^4.8.3 | WebSocket client |

> **Note:** We use `mapbox-gl` as the rendering library since Goong JS tiles are Mapbox GL compatible.

---

## 5. Hey-API Integration

### 5.1. Configuration

```typescript
// hey-api.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3000/api/docs-json',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: 'src/lib/api/generated',
  },
  plugins: [
    '@hey-api/sdk',
    '@hey-api/typescript',
    {
      name: '@hey-api/zod',
      output: 'zod',
      definitions: true,
      requests: true,
      responses: true,
    },
    {
      name: '@tanstack/react-query',
      output: 'queries',
      queryOptions: true,
      mutationOptions: true,
      queryKeys: true,
      infiniteQueryOptions: true,
    },
  ],
});
```

### 5.2. API Client Setup

```typescript
// src/lib/api/client.ts
import { client } from './generated/client.gen';

// Configure base URL
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

// Add auth interceptor
client.interceptors.request.use((request) => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  
  return request;
});

// Handle 401 responses
client.interceptors.response.use((response) => {
  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
  
  return response;
});

export { client };
```

---

## 6. Page Specifications

### 6.1. Dashboard Home

**Route:** `/`

**Features:**
- Summary stats cards (orders, revenue, users, drivers)
- Orders chart (last 7 days)
- Recent orders table
- Active drivers map (mini)

### 6.2. Users Management

**Route:** `/users`

**Features:**
- Data table with search, filter, pagination
- Quick actions: View details, toggle status
- Export to CSV

### 6.3. Driver Approvals

**Route:** `/drivers/pending`

**Features:**
- List of pending driver applications
- View uploaded documents (ID card, license, vehicle photo)
- Approve or reject with reason

### 6.4. Live Tracking Map

**Route:** `/orders/live`

**Features:**
- Real-time map showing all active orders
- Driver markers with current location
- Click marker to see order details
- Filter by order status

### 6.5. System Settings

**Route:** `/settings`

**Features:**
- **Pricing Configuration:**
  - Price per km (default: 8.000 VND)
  - Platform fee percentage (default: 15%)
  - Max order distance (default: 25km)
  - Surge pricing percentage (default: 20%)
- **Driver Matching:**
  - Initial radius (default: 3km)
  - Max radius (default: 7km)
  - Timeout (default: 5 minutes)
- **Location Tracking:**
  - Default interval (default: 30 seconds)
  - Adaptive interval (default: 10 seconds)
  - Adaptive distance threshold (default: 500m)
- **Cancellation Policy:**
  - Free cancellation window (default: 5 minutes)
  - Cancellation fee percentage (default: 10%)
  - Driver daily cancellation limit (default: 3)
  - Driver rating penalty (default: -10 points)
- **Service Area:**
  - City (default: Hồ Chí Minh)
  - Max distance (default: 25km)

---

## 7. Layout & Navigation

### 7.1. Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
```

> **⚠️ BREAKING CHANGE (Next.js 16):** Layout components can now be async. This enables using async APIs like cookies() and headers() directly in layouts.

### 7.2. Sidebar Component

```typescript
// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Map,
  Settings,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Người dùng', href: '/users', icon: Users },
  { name: 'Tài xế', href: '/drivers', icon: Truck },
  { name: 'Đơn hàng', href: '/orders', icon: Package },
  { name: 'Theo dõi', href: '/orders/live', icon: Map },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold">Logship Admin</span>
      </div>

      <nav className="flex-1 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button className="flex items-center gap-3 px-2 py-2 text-sm text-slate-400 hover:text-white w-full">
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
```

---

## 8. Environment Variables

### 8.1. .env.local

```env
# API
NEXT_PUBLIC_API_URL=https://api.logship.app/api/v1
NEXT_PUBLIC_SOCKET_URL=wss://api.logship.app

# Goong Maps (Vietnam-optimized)
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your-maptiles-key
NEXT_PUBLIC_GOONG_API_KEY=your-api-key
```

---

## 9. Commands Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start development server (port 3001) |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run generate:api` | Generate API client from OpenAPI |
| `bun run typecheck` | TypeScript type check |
| `bun run lint` | Run ESLint |

### 7.3. Async Request APIs (Next.js 16)

> **⚠️ BREAKING CHANGE:** In Next.js 16, `cookies()`, `headers()`, `params`, and `searchParams` are now async and must be awaited.

#### Old Pattern (Next.js 15 and earlier)

```typescript
// app/users/[id]/page.tsx
export default function UserPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // params was synchronous
  const { id } = params;
  return <div>User {id}</div>;
}

// Using cookies
import { cookies } from 'next/headers';

export default function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  // ...
}
```

#### New Pattern (Next.js 16)

```typescript
// app/users/[id]/page.tsx
export default async function UserPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // params is now async - must await
  const { id } = await params;
  return <div>User {id}</div>;
}

// Using cookies
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  // ...
}
```

#### SearchParams Example

```typescript
// app/search/page.tsx
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = params.q;
  
  return <div>Search results for: {query}</div>;
}
```

### 7.4. proxy.ts (Replaces middleware.ts)

> **⚠️ BREAKING CHANGE:** `middleware.ts` has been renamed to `proxy.ts` in Next.js 16.

```typescript
// proxy.ts (root of app directory)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Check authentication
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

### 7.5. next.config.ts (Next.js 16)

> **⚠️ BREAKING CHANGES:** 
> - `experimental.turbopack` is now just `turbopack`
> - `experimental.ppr` is now `cacheComponents`
> - `serverRuntimeConfig`/`publicRuntimeConfig` removed (use env vars)

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is now the default (replaces Webpack)
  turbopack: {
    // Turbopack configuration
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  
  // PPR renamed to cacheComponents
  cacheComponents: true,
  
  // React Compiler is now stable
  reactCompiler: true,
  
  // Environment variables (replaces runtimeConfig)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // New caching APIs
  experimental: {
    // Other experimental features
  },
};

export default nextConfig;
```

### 7.6. New Caching APIs (Next.js 16)

Next.js 16 introduces new caching APIs:

```typescript
import { updateTag, refresh } from 'next/cache';

// Invalidate cache by tag
export async function updateUser() {
  'use server';
  // ... update user logic
  
  // Invalidate all cached data with this tag
  updateTag('user-data');
}

// Refresh page data
export async function refreshData() {
  'use server';
  refresh();
}
```

---

## 11. Next.js 16 Migration Guide

### Breaking Changes Summary

| Feature | Old (Next.js 15) | New (Next.js 16) |
|---------|------------------|------------------|
| Build Tool | Webpack (default) | Turbopack (default) |
| Request APIs | Synchronous | Async (must await) |
| Middleware | `middleware.ts` | `proxy.ts` |
| PPR Config | `experimental.ppr` | `cacheComponents` |
| Lint Command | `next lint` | Removed (use ESLint directly) |
| Runtime Config | `serverRuntimeConfig` | Removed (use env vars) |
| React Compiler | Experimental | Stable |

### Migration Checklist

- [ ] Rename `middleware.ts` to `proxy.ts`
- [ ] Update `proxy` function to be async if using cookies/headers
- [ ] Update all page components to handle async `params` and `searchParams`
- [ ] Update all usages of `cookies()` and `headers()` to await them
- [ ] Update `next.config.ts`:
  - [ ] Move `experimental.turbopack` to `turbopack`
  - [ ] Rename `experimental.ppr` to `cacheComponents`
  - [ ] Remove `serverRuntimeConfig`/`publicRuntimeConfig`
- [ ] Update package.json scripts (remove `next lint`)
- [ ] Test thoroughly with Turbopack (now default)

### Before/After Examples

#### Page with Params

**Before:**
```typescript
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>;
}
```

**After:**
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

#### Middleware/Proxy

**Before (middleware.ts):**
```typescript
export function middleware(request: NextRequest) {
  return NextResponse.next();
}
```

**After (proxy.ts):**
```typescript
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}
```

#### next.config.ts

**Before:**
```typescript
const nextConfig = {
  experimental: {
    turbopack: {},
    ppr: true,
  },
  serverRuntimeConfig: {
    secret: process.env.SECRET,
  },
};
```

**After:**
```typescript
const nextConfig = {
  turbopack: {},
  cacheComponents: true,
  reactCompiler: true,
  env: {
    secret: process.env.SECRET,
  },
};
```

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) | Complete tech stack specification |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | System architecture |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API endpoints |
| [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) | Mobile app details |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | Backend details |
| [08-Monorepo-Structure.md](./08-Monorepo-Structure.md) | Monorepo setup with Bun |

---

## 13. Testing Checklist

- [ ] Login with admin credentials
- [ ] View dashboard stats and charts
- [ ] Search and filter users
- [ ] Toggle user active status
- [ ] View pending driver applications
- [ ] Approve/reject driver with documents review
- [ ] View orders list with filters
- [ ] Live tracking map with real-time updates
- [ ] Update system configuration
- [ ] Responsive design (tablet/desktop)
- [ ] Error states and loading skeletons

---

**END OF DOCUMENT**
