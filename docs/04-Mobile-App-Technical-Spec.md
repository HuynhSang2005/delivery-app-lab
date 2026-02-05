# Logship-MVP: Mobile App Technical Specification

**Version:** 3.0  
**Last Updated:** February 2025  
**Platform:** React Native + Expo SDK 54  
**Target:** iOS 14+ / Android 10+  
**Package Manager:** Bun  

> **Reference:** See [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) for complete tech stack details.

---

## 1. Overview

This document specifies the technical implementation for Logship-MVP mobile applications (User App & Driver App) using React Native with Expo SDK 54.

### 1.1. App Variants

| App | Target Users | Key Features |
|-----|--------------|--------------|
| **User App** | Customers | Create orders, track delivery, chat with driver |
| **Driver App** | Delivery drivers | Accept orders, navigate, update status, chat |

> **Note:** Both apps share the same codebase with conditional rendering based on user role.

### 1.2. Why Expo SDK 54?

| Feature | Benefit |
|---------|---------|
| Expo Router v5 | File-based routing, deep linking |
| expo-location | Foreground/background location tracking |
| expo-task-manager | Background tasks for driver location |
| EAS Build | Cloud builds for iOS/Android |
| EAS Update | OTA updates without app store review |
| React Native 0.81 | Latest stable React Native |
| React 19.1 | Latest React version |

> **Note:** Expo SDK 54 is the latest stable release with React Native 0.81 and React 19.

---

## 2. Project Structure

```
apps/mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth screens (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── otp.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home (create order / driver dashboard)
│   │   ├── orders.tsx            # Order list
│   │   ├── notifications.tsx     # Notifications
│   │   └── profile.tsx           # Profile settings
│   ├── order/                    # Order flows
│   │   ├── [id].tsx              # Order details
│   │   ├── create.tsx            # Create order flow
│   │   └── tracking.tsx          # Live tracking screen
│   ├── chat/
│   │   └── [orderId].tsx         # Chat screen
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Base UI components
│   │   ├── maps/                 # Map components
│   │   ├── order/                # Order components
│   │   └── chat/                 # Chat components
│   ├── hooks/                    # Custom hooks
│   ├── stores/                   # Zustand stores
│   ├── services/                 # API services
│   ├── lib/                      # Utilities
│   │   ├── api/                  # Hey-API generated client
│   │   ├── queryClient.ts        # TanStack Query setup
│   │   └── storage.ts            # SecureStore wrapper
│   └── types/                    # TypeScript types
├── assets/                       # Images, fonts
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── openapi-ts.config.ts          # Hey-API config
├── package.json
├── tsconfig.json
└── bun.lockb
```

---

## 3. Core Dependencies

### 3.1. Complete Package.json

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
    "generate:api": "bunx openapi-ts",
    "typecheck": "bunx tsc --noEmit",
    "lint": "bunx eslint ."
  },
  "dependencies": {
    "@gorhom/bottom-sheet": "^5.0.0",
    "@hey-api/client-fetch": "^0.8.0",
    "@react-native-community/netinfo": "^11.4.0",
    "@react-native-firebase/app": "^22.0.0",
    "@react-native-firebase/auth": "^22.0.0",
    "@react-native-masked-view/masked-view": "^0.3.2",
    "@shopify/flash-list": "1.7.0",
    "@tanstack/react-query": "^5.60.0",
    "axios": "^1.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^4.1.0",
    "expo": "~54.0.0",
    "expo-clipboard": "~8.0.0",
    "expo-constants": "~18.0.0",
    "expo-dev-client": "~6.0.0",
    "expo-haptics": "~15.0.0",
    "expo-image": "~3.0.0",
    "expo-image-picker": "~17.0.0",
    "expo-linking": "~8.0.0",
    "expo-location": "~19.0.0",
    "expo-notifications": "~0.30.0",
    "expo-router": "~5.0.0",
    "expo-secure-store": "~15.0.0",
    "expo-splash-screen": "~0.30.0",
    "expo-status-bar": "~3.0.0",
    "expo-system-ui": "~5.0.0",
    "expo-task-manager": "~13.0.0",
    "expo-updates": "~0.28.0",
    "expo-web-browser": "~15.0.0",
    "lodash-es": "^4.17.21",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^4.0.0",
    "react-native": "0.81.0",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-maps": "1.22.0",
    "react-native-reanimated": "~4.0.0",
    "react-native-safe-area-context": "5.2.0",
    "react-native-screens": "~4.8.0",
    "react-native-svg": "15.12.0",
    "react-native-toast-message": "^2.2.0",
    "react-native-url-polyfill": "^2.0.0",
    "socket.io-client": "^4.8.0",
    "tailwindcss": "^4.0.0",
    "nativewind": "^5.0.0",
    "zod": "^4.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@hey-api/openapi-ts": "^0.64.0",
    "@types/lodash-es": "^4.17.12",
    "@types/react": "~19.0.0",
    "typescript": "^5.7.0"
  }
}
```

### 3.2. Essential Libraries Overview

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Core** | `expo` | ~54.0.0 | Expo SDK |
| **Core** | `react-native` | 0.81.0 | React Native |
| **Core** | `react` | 19.1.0 | React (Expo SDK 54 uses React 19) |
| **Navigation** | `expo-router` | ~5.0.0 | File-based routing |
| **API Client** | `@hey-api/client-fetch` | ^0.8.0 | Type-safe API client |
| **State (Server)** | `@tanstack/react-query` | ^5.60.0 | Server state management |
| **State (Client)** | `zustand` | ^5.0.0 | Client state management |
| **Forms** | `react-hook-form` | ^7.54.0 | Form handling |
| **Validation** | `zod` | ^4.0.0 | Schema validation (v4 - 14x faster) |
| **Maps** | `react-native-maps` | 1.22.0 | Map components |
| **Lists** | `@shopify/flash-list` | 1.8.0 | High-performance lists |
| **Bottom Sheet** | `@gorhom/bottom-sheet` | ^5.0.0 | Bottom sheet UI |
| **Toast** | `react-native-toast-message` | ^2.2.0 | Toast notifications |
| **Network** | `@react-native-community/netinfo` | ^11.4.0 | Network status |
| **Auth** | `@react-native-firebase/*` | ^22.0.0 | Firebase Auth |
| **Styling** | `nativewind` | ^5.0.0 | Tailwind for RN |
| **Utilities** | `lodash-es` | ^4.17.21 | Utility functions |
| **Real-time** | `socket.io-client` | ^4.8.0 | WebSocket client |

---

## 4. Hey-API Integration

### 4.1. Configuration

```typescript
// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3000/api/docs-json', // Backend Swagger JSON
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
    },
    {
      name: '@tanstack/react-query',
      output: 'queries',
      queryOptions: true,
      mutationOptions: true,
      queryKeys: true,
    },
  ],
});
```

### 4.2. Generated API Client Structure

```
src/lib/api/generated/
├── index.ts              # Re-exports all
├── client.gen.ts         # Fetch client configuration
├── sdk.gen.ts            # API functions
├── types.gen.ts          # TypeScript interfaces
├── zod.gen.ts            # Zod validation schemas
└── queries.gen.ts        # TanStack Query hooks
```

### 4.3. API Client Setup

```typescript
// src/lib/api/client.ts
import { client } from './generated/client.gen';
import { useAuthStore } from '@/stores/authStore';

// Configure base URL
client.setConfig({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

// Add auth interceptor
client.interceptors.request.use((request) => {
  const token = useAuthStore.getState().accessToken;
  
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  
  return request;
});

// Handle 401 responses
client.interceptors.response.use((response) => {
  if (response.status === 401) {
    useAuthStore.getState().logout();
  }
  
  return response;
});

export { client };
```

---

## 5. State Management

### 5.1. Zustand Stores

#### Auth Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: 'USER' | 'DRIVER' | 'ADMIN';
  avatarUrl: string | null;
  driver?: {
    id: string;
    status: 'ACTIVE' | 'OFFLINE' | 'ON_TRIP';
    isApproved: boolean;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// SecureStore adapter for Zustand persist
const secureStorage = {
  getItem: async (name: string) => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 5.2. TanStack Query Setup

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 6. Location Tracking

### 6.1. Background Location (Driver)

```typescript
// src/services/backgroundLocation.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { socketService } from './socket.service';

const LOCATION_TASK_NAME = 'DRIVER_BACKGROUND_LOCATION';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    
    if (location) {
      socketService.emitDriverLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
      });
    }
  }
});

export const backgroundLocationService = {
  async startTracking(): Promise<boolean> {
    const { status: foregroundStatus } = 
      await Location.requestForegroundPermissionsAsync();
      
    if (foregroundStatus !== 'granted') return false;

    const { status: backgroundStatus } = 
      await Location.requestBackgroundPermissionsAsync();
      
    if (backgroundStatus !== 'granted') return false;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 50,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Đang giao hàng',
        notificationBody: 'Vị trí của bạn đang được cập nhật',
        notificationColor: '#4F46E5',
      },
    });

    return true;
  },

  async stopTracking(): Promise<void> {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  },
};
```

---

## 7. Maps Integration (Goong Maps)

### 7.1. Goong Service

```typescript
// src/services/goong.service.ts
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

export const goongService = {
  async autocomplete(input: string, location?: { lat: number; lng: number }) {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      input,
      radius: '50000',
      more_compound: 'true',
      ...(location && { location: `${location.lat},${location.lng}` }),
    });

    const response = await fetch(`${GOONG_BASE_URL}/Place/AutoComplete?${params}`);
    const data = await response.json();
    return data.predictions || [];
  },

  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ) {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle: 'bike',
    });

    const response = await fetch(`${GOONG_BASE_URL}/Direction?${params}`);
    const data = await response.json();
    return data.routes?.[0] || null;
  },
};
```

---

## 8. Socket.io Integration

### 8.1. Socket Service

```typescript
// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    const token = useAuthStore.getState().accessToken;
    
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('order:status', (data) => {
      // Handle order status update
    });

    this.socket.on('location:updated', (data) => {
      // Handle driver location update
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinOrderRoom(orderId: string): void {
    this.socket?.emit('order:join', { orderId });
  }

  emitDriverLocation(location: {
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
    orderId?: string;
  }): void {
    this.socket?.emit('driver:location', location);
  }

  sendMessage(orderId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT'): void {
    this.socket?.emit('chat:message', { orderId, content, type });
  }
}

export const socketService = new SocketService();
```

---

## 9. Environment Variables

### 9.1. .env File

```env
# API
EXPO_PUBLIC_API_URL=https://api.logship.app/api/v1
EXPO_PUBLIC_SOCKET_URL=wss://api.logship.app

# Goong Maps (Vietnam-optimized)
EXPO_PUBLIC_GOONG_API_KEY=your-goong-api-key

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
```

---

## 10. Commands Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Start Expo development server |
| `bun run dev:android` | Start with Android |
| `bun run dev:ios` | Start with iOS |
| `bun run generate:api` | Generate API client from OpenAPI |
| `bun run build:android` | Build Android with EAS |
| `bun run build:ios` | Build iOS with EAS |
| `bun run typecheck` | TypeScript type check |
| `bun run lint` | Run ESLint |

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md) | Complete tech stack specification |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | System architecture |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API endpoints |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | Backend details |
| [08-Monorepo-Structure.md](./08-Monorepo-Structure.md) | Monorepo setup with Bun |

---

**END OF DOCUMENT**
