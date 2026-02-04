# Logship-MVP: Admin Dashboard Specification

**Version:** 3.0  
**Last Updated:** February 2025  
**Framework:** React 19 / Next.js 15 (App Router)  
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
| Framework | Next.js 15 (App Router) | ^15.1.0 |
| Language | TypeScript | ^5.7.0 |
| React | React 19 | ^19.0.0 |
| State (Server) | TanStack Query | ^5.60.0 |
| State (Client) | Zustand | ^5.0.0 |
| UI Components | Shadcn/ui + Radix UI | ^1.1.0 |
| Styling | Tailwind CSS | ^4.0.0 |
| Tables | TanStack Table | ^8.20.0 |
| Charts | Recharts | ^2.13.0 |
| Maps | Goong JS (Mapbox GL compatible) | ^3.9.0 |
| Forms | React Hook Form + Zod | ^7.54.0 / ^3.24.0 |
| Icons | Lucide React | ^0.460.0 |
| Date | date-fns | ^4.1.0 |
| API Client | Hey-API | ^0.8.0 |
| Package Manager | Bun | ^1.2.0 |

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
    "typecheck": "bunx tsc --noEmit",
    "lint": "bunx next lint"
  },
  "dependencies": {
    "@hey-api/client-fetch": "^0.8.0",
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
    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-query-devtools": "^5.60.0",
    "@tanstack/react-table": "^8.20.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "cmdk": "^1.0.0",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.5.0",
    "framer-motion": "^11.15.0",
    "input-otp": "^1.4.0",
    "lodash-es": "^4.17.21",
    "lucide-react": "^0.460.0",
    "mapbox-gl": "^3.9.0",
    "next": "^15.1.0",
    "next-themes": "^0.4.0",
    "nuqs": "^2.2.0",
    "react": "^19.0.0",
    "react-day-picker": "^9.4.0",
    "react-dom": "^19.0.0",
    "react-error-boundary": "^4.1.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "react-resizable-panels": "^2.1.0",
    "recharts": "^2.13.0",
    "socket.io-client": "^4.8.0",
    "sonner": "^1.7.0",
    "tailwind-merge": "^2.5.0",
    "tailwindcss": "^4.0.0",
    "tailwindcss-animate": "^1.0.7",
    "use-debounce": "^10.0.0",
    "vaul": "^1.1.0",
    "zod": "^4.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.64.0",
    "@types/lodash-es": "^4.17.12",
    "@types/mapbox-gl": "^3.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

### 4.2. Essential Libraries Overview

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | `next` | ^15.1.0 | Next.js 15 App Router |
| **React** | `react` | ^19.0.0 | React 19 |
| **API Client** | `@hey-api/client-fetch` | ^0.8.0 | Type-safe API client |
| **State (Server)** | `@tanstack/react-query` | ^5.60.0 | Server state management |
| **State (Client)** | `zustand` | ^5.0.0 | Client state management |
| **UI Components** | `@radix-ui/react-*` | ^1.1-2.1.0 | Headless UI primitives |
| **Styling** | `tailwindcss` | ^4.0.0 | Utility-first CSS |
| **Tables** | `@tanstack/react-table` | ^8.20.0 | Data tables |
| **Charts** | `recharts` | ^2.13.0 | Charts & graphs |
| **Maps** | `mapbox-gl` | ^3.9.0 | Map rendering (Goong tiles) |
| **Forms** | `react-hook-form` | ^7.54.0 | Form handling |
| **Validation** | `zod` | ^4.0.0 | Schema validation (v4 - 14x faster) |
| **Animations** | `framer-motion` | ^11.15.0 | UI animations |
| **Command Palette** | `cmdk` | ^1.0.0 | Command menu |
| **Drawer** | `vaul` | ^1.1.0 | Drawer component |
| **URL State** | `nuqs` | ^2.2.0 | Query string state |
| **Debounce** | `use-debounce` | ^10.0.0 | Debounce hooks |
| **Themes** | `next-themes` | ^0.4.0 | Dark/light mode |
| **Error Handling** | `react-error-boundary` | ^4.1.0 | Error boundaries |
| **Real-time** | `socket.io-client` | ^4.8.0 | WebSocket client |

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
- Pricing configuration (base price, price per km)
- Driver matching radius
- Other system parameters

---

## 7. Layout & Navigation

### 7.1. Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
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

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) | Complete tech stack specification |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | System architecture |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API endpoints |
| [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md) | Mobile app details |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | Backend details |
| [08-Monorepo-Structure.md](./08-Monorepo-Structure.md) | Monorepo setup with Bun |

---

## 11. Testing Checklist

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
