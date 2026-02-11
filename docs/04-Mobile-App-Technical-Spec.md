# Logship-MVP: Mobile App Technical Specification

**Version:** 4.0  
**Last Updated:** February 2026  
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
| Expo Router v4 | File-based routing, deep linking |
| expo-location | Foreground/background location tracking |
| expo-task-manager | Background tasks for driver location |
| EAS Build | Cloud builds for iOS/Android |
| EAS Update | OTA updates without app store review |
| React Native 0.81 | Latest stable React Native |
| React 19.1 | Latest React 19 version |

> **Note:** Expo SDK 54 is the latest stable release with React Native 0.81 and React 19.1.

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
    "@hey-api/client-fetch": "^0.10.0",
    "@react-native-community/netinfo": "^11.4.0",
    "@react-native-firebase/app": "^22.0.0",
    "@react-native-firebase/auth": "^22.0.0",
    "@react-native-masked-view/masked-view": "^0.3.2",
    "@shopify/flash-list": "1.7.1",
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
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.8.0",
    "react-native-svg": "15.12.0",
    "react-native-toast-message": "^2.2.0",
    "react-native-url-polyfill": "^2.0.0",
    "socket.io-client": "^4.8.0",
    "tailwindcss": "^4.0.0",
    "nativewind": "^4.1.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@hey-api/openapi-ts": "^0.92.3",
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
| **Core** | `react` | 19.1.0 | React (Expo SDK 54 uses React 19.1) |
| **Navigation** | `expo-router` | ~5.0.0 | File-based routing |
| **API Client** | `@hey-api/client-fetch` | ^0.10.0 | Type-safe API client |
| **State (Server)** | `@tanstack/react-query` | ^5.60.0 | Server state management |
| **State (Client)** | `zustand` | ^5.0.0 | Client state management |
| **Forms** | `react-hook-form` | ^7.54.0 | Form handling |
| **Validation** | `zod` | ^4.3.6 | Schema validation (Zod v4 - latest) |
| **Maps** | `react-native-maps` | 1.22.0 | Map components (with Goong tiles) |
| **Location** | `expo-location` | ~19.0.0 | GPS and location tracking |
| **Background Tasks** | `expo-task-manager` | ~13.0.0 | Background location updates |
| **Lists** | `@shopify/flash-list` | 1.8.0 | High-performance lists |
| **Bottom Sheet** | `@gorhom/bottom-sheet` | ^5.0.0 | Bottom sheet UI |
| **Toast** | `react-native-toast-message` | ^2.2.0 | Toast notifications |
| **Network** | `@react-native-community/netinfo` | ^11.4.0 | Network status |
| **Auth** | `@react-native-firebase/*` | ^22.0.0 | Firebase Auth |
| **Styling** | `nativewind` | ^4.1.0 | Tailwind for RN |
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

## 6. Location Services

### 6.1. Overview

Location services are critical for Logship-MVP, enabling:
- **User App**: Select pickup/dropoff locations, track driver
- **Driver App**: Background location tracking for order fulfillment, navigation

### 6.2. Dependencies

```json
{
  "expo-location": "~19.0.0",
  "expo-task-manager": "~13.0.0"
}
```

**Note:** `expo-location ~19.0.0` is compatible with Expo SDK 54.

### 6.3. App Configuration

Update `app.json` with required permissions:

```json
{
  "expo": {
    "plugins": [
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Cho phép Logship truy cập vị trí của bạn để theo dõi đơn hàng.",
        "isAndroidBackgroundLocationEnabled": true,
        "isAndroidForegroundServiceEnabled": true
      }]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Logship cần truy cập vị trí để hiển thị bản đồ và tính toán khoảng cách.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Logship cần truy cập vị trí liên tục để theo dõi đơn hàng ngay cả khi app ở background.",
        "NSLocationAlwaysUsageDescription": "Logship cần truy cập vị trí liên tục để theo dõi đơn hàng.",
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE"
      ]
    }
  }
}
```

### 6.4. Background Location Service (Driver)

**IMPORTANT**: Background location ONLY works in development builds, NOT in Expo Go.

```typescript
// src/services/location/BackgroundLocationService.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { apiClient } from '@/lib/api/client';

const LOCATION_TASK_NAME = 'background-location-task';

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    
    if (location) {
      try {
        // Send to backend API (preferred over socket for reliability)
        await apiClient.post('/drivers/location', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        });
      } catch (err) {
        console.error('[BackgroundLocation] Failed to update:', err);
        // Queue for retry if needed
      }
    }
  }
});

export class BackgroundLocationService {
  static async requestPermissions(): Promise<boolean> {
    // Request foreground permission first
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('[Location] Foreground permission denied');
      return false;
    }

    // Then request background permission
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.error('[Location] Background permission denied');
      return false;
    }

    return true;
  }

  static async startTracking(): Promise<boolean> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Location permissions not granted');
    }

    // Check if task is already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isRunning) {
      console.log('[Location] Tracking already started');
      return true;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // 10 seconds minimum (battery optimization)
      distanceInterval: 50, // 50 meters
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: 'Logship Driver',
        notificationBody: 'Đang cập nhật vị trí...',
        notificationColor: '#2196F3',
        killServiceOnDestroy: false,
      },
    });

    console.log('[Location] Background tracking started');
    return true;
  }

  static async stopTracking(): Promise<void> {
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[Location] Background tracking stopped');
      }
    } catch (error) {
      console.error('[Location] Error stopping tracking:', error);
    }
  }

  static async getCurrentLocation(): Promise<Location.LocationObject> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  }

  static async watchPosition(
    callback: (location: Location.LocationObject) => void
  ): Promise<Location.LocationSubscription> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      callback
    );
  }
}
```

### 6.5. Foreground Location Hook (User App)

```typescript
// src/hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface UseLocationOptions {
  enabled?: boolean;
  accuracy?: Location.LocationAccuracy;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { enabled = true, accuracy = Location.Accuracy.High } = options;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy });
      setLocation(currentLocation);
      return currentLocation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      return null;
    } finally {
      setLoading(false);
    }
  }, [accuracy]);

  useEffect(() => {
    if (enabled) {
      getLocation();
    }
  }, [enabled, getLocation]);

  return { location, error, loading, refresh: getLocation };
}
```

### 6.6. Location Permissions Helper

```typescript
// src/utils/locationPermissions.ts
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export async function checkLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();

  return {
    foreground: foreground.status === 'granted',
    background: background.status === 'granted',
  };
}

export function showLocationPermissionAlert() {
  Alert.alert(
    'Cần quyền truy cập vị trí',
    'Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này.',
    [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Mở Cài đặt', 
        onPress: () => Linking.openSettings() 
      },
    ]
  );
}
```

### 6.7. Best Practices

1. **Battery Optimization**: Use `timeInterval: 10000` (10s) and `distanceInterval: 50` (50m) minimum
2. **Error Handling**: Always handle permission denials gracefully
3. **Retry Logic**: Queue failed location updates for retry
4. **Testing**: Use development builds (`expo-dev-client`) for background location
5. **Permissions**: Request foreground first, then background
6. **Cleanup**: Always stop tracking when component unmounts or order completes
```

---

## 7. Maps Integration (Goong Maps)

### 7.1. Overview

Goong Maps is the primary map provider for Logship-MVP, offering Vietnam-optimized maps with generous free tier.

**Two API Keys Required:**
1. `EXPO_PUBLIC_GOONG_API_KEY` - For API calls (geocoding, directions)
2. `EXPO_PUBLIC_GOONG_MAPTILES_KEY` - For map tiles rendering

### 7.2. Map Components

#### A. GoongMapView Component (CORRECT IMPLEMENTATION)

**⚠️ IMPORTANT:** Use `UrlTile` component, NOT `urlTemplate` prop on MapView.

```typescript
// src/components/maps/GoongMapView.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { UrlTile, Marker, Polyline, Circle } from 'react-native-maps';

const GOONG_MAPTILES_KEY = process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY;

interface MarkerData {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  pinColor?: string;
}

interface GoongMapViewProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: MarkerData[];
  route?: Array<{ latitude: number; longitude: number }>;
  showUserLocation?: boolean;
  radius?: number; // Show radius circle (for driver search)
}

export const GoongMapView: React.FC<GoongMapViewProps> = ({
  initialRegion,
  markers = [],
  route,
  showUserLocation = true,
  radius,
}) => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* Goong Map Tiles - Use UrlTile component */}
        <UrlTile
          urlTemplate={`https://tiles.goong.io/tiles/{z}/{x}/{y}.png?api_key=${GOONG_MAPTILES_KEY}`}
          maximumZ={19}
          minimumZ={1}
          flipY={false}
          tileSize={256}
        />

        {/* Radius Circle */}
        {radius && (
          <Circle
            center={{
              latitude: initialRegion.latitude,
              longitude: initialRegion.longitude,
            }}
            radius={radius}
            fillColor="rgba(33, 150, 243, 0.1)"
            strokeColor="rgba(33, 150, 243, 0.5)"
            strokeWidth={2}
          />
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor || '#FF0000'}
          />
        ))}

        {/* Route Polyline */}
        {route && route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor="#2196F3"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
```

#### B. AddressAutocomplete Component

```typescript
// src/components/maps/AddressAutocomplete.tsx
import React, { useState, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';
import { debounce } from 'lodash';

interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressAutocompleteProps {
  placeholder?: string;
  onSelect: (address: {
    placeId: string;
    description: string;
    latitude: number;
    longitude: number;
  }) => void;
  location?: { latitude: number; longitude: number };
}

const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder = 'Nhập địa chỉ...',
  onSelect,
  location,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search (300ms)
  const searchAddresses = useCallback(
    debounce(async (input: string) => {
      if (!input || input.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          api_key: GOONG_API_KEY!,
          input,
          radius: '50000',
          ...(location && {
            location: `${location.latitude},${location.longitude}`,
          }),
        });

        const response = await fetch(
          `${GOONG_BASE_URL}/Place/AutoComplete?${params}`
        );
        const data = await response.json();

        setSuggestions(
          data.predictions?.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || '',
          })) || []
        );
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [location]
  );

  const handleSelect = async (suggestion: AddressSuggestion) => {
    try {
      // Get coordinates from place_id
      const params = new URLSearchParams({
        api_key: GOONG_API_KEY!,
        place_id: suggestion.placeId,
      });

      const response = await fetch(
        `${GOONG_BASE_URL}/Place/Detail?${params}`
      );
      const data = await response.json();
      const result = data.result;

      onSelect({
        placeId: suggestion.placeId,
        description: suggestion.description,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      });

      setQuery(suggestion.description);
      setSuggestions([]);
    } catch (error) {
      console.error('Place details error:', error);
    }
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          searchAddresses(text);
        }}
        placeholder={placeholder}
        style={{ padding: 12, borderWidth: 1, borderColor: '#ddd' }}
      />

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
            >
              <Text style={{ fontWeight: 'bold' }}>{item.mainText}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                {item.secondaryText}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
```

### 7.3. Goong Services

#### A. Geocoding Service

```typescript
// src/services/maps/geocoding.service.ts
import { debounce } from 'lodash';

const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

// Cache for geocoding results (1 hour TTL)
const geocodeCache = new Map<string, any>();

export class GeocodingService {
  // Debounced autocomplete
  static autocomplete = debounce(
    async (
      input: string,
      location?: { lat: number; lng: number }
    ): Promise<
      Array<{
        placeId: string;
        description: string;
        mainText: string;
        secondaryText: string;
      }>
    > => {
      if (!input || input.length < 3) return [];

      try {
        const params = new URLSearchParams({
          api_key: GOONG_API_KEY!,
          input,
          radius: '50000',
          location: location
            ? `${location.lat},${location.lng}`
            : '10.762622,106.660172', // Default: HCM
        });

        const response = await fetch(
          `${GOONG_BASE_URL}/Place/AutoComplete?${params}`
        );

        if (!response.ok) throw new Error('Autocomplete failed');

        const data = await response.json();

        return (
          data.predictions?.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || '',
          })) || []
        );
      } catch (error) {
        console.error('Autocomplete error:', error);
        return [];
      }
    },
    300
  );

  // Get place details (coordinates)
  static async getPlaceDetails(
    placeId: string
  ): Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
  } | null> {
    // Check cache
    if (geocodeCache.has(`place_${placeId}`)) {
      return geocodeCache.get(`place_${placeId}`);
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        api_key: GOONG_API_KEY!,
      });

      const response = await fetch(
        `${GOONG_BASE_URL}/Place/Detail?${params}`
      );

      if (!response.ok) throw new Error('Place details failed');

      const data = await response.json();
      const result = data.result;

      const details = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };

      // Cache result
      geocodeCache.set(`place_${placeId}`, details);
      setTimeout(() => geocodeCache.delete(`place_${placeId}`), 3600000);

      return details;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  // Geocode address
  static async geocode(
    address: string
  ): Promise<{ lat: number; lng: number } | null> {
    // Check cache
    if (geocodeCache.has(`geocode_${address}`)) {
      return geocodeCache.get(`geocode_${address}`);
    }

    try {
      const params = new URLSearchParams({
        address,
        api_key: GOONG_API_KEY!,
      });

      const response = await fetch(`${GOONG_BASE_URL}/Geocode?${params}`);

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();

      if (data.results?.length > 0) {
        const location = data.results[0].geometry.location;
        const result = { lat: location.lat, lng: location.lng };

        // Cache result
        geocodeCache.set(`geocode_${address}`, result);
        setTimeout(() => geocodeCache.delete(`geocode_${address}`), 3600000);

        return result;
      }

      return null;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  }

  // Reverse geocode
  static async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<string | null> {
    const cacheKey = `reverse_${lat}_${lng}`;

    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        api_key: GOONG_API_KEY!,
      });

      const response = await fetch(`${GOONG_BASE_URL}/Geocode?${params}`);

      if (!response.ok) throw new Error('Reverse geocoding failed');

      const data = await response.json();

      if (data.results?.length > 0) {
        const address = data.results[0].formatted_address;

        // Cache result
        geocodeCache.set(cacheKey, address);
        setTimeout(() => geocodeCache.delete(cacheKey), 3600000);

        return address;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }
}
```

#### B. Routing Service

```typescript
// src/services/maps/routing.service.ts
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

export interface Route {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  polyline: string;
  steps: Array<{
    instruction: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    startLocation: { lat: number; lng: number };
    endLocation: { lat: number; lng: number };
  }>;
}

export class RoutingService {
  static async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    vehicle: 'car' | 'bike' | 'taxi' = 'car'
  ): Promise<Route | null> {
    try {
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        vehicle,
        api_key: GOONG_API_KEY!,
      });

      const response = await fetch(`${GOONG_BASE_URL}/Direction?${params}`);

      if (!response.ok) throw new Error('Routing failed');

      const data = await response.json();

      if (data.routes.length === 0) return null;

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance,
        duration: leg.duration,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance,
          duration: step.duration,
          startLocation: step.start_location,
          endLocation: step.end_location,
        })),
      };
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  }

  // Decode Google polyline to coordinates
  static decodePolyline(
    encoded: string
  ): Array<{ latitude: number; longitude: number }> {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }

  // Calculate distance matrix (for multiple origins/destinations)
  static async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>,
    vehicle: 'car' | 'bike' | 'taxi' = 'car'
  ) {
    try {
      const params = new URLSearchParams({
        origins: origins.map((o) => `${o.lat},${o.lng}`).join('|'),
        destinations: destinations.map((d) => `${d.lat},${d.lng}`).join('|'),
        vehicle,
        api_key: GOONG_API_KEY!,
      });

      const response = await fetch(
        `${GOONG_BASE_URL}/DistanceMatrix?${params}`
      );

      if (!response.ok) throw new Error('Distance matrix failed');

      return await response.json();
    } catch (error) {
      console.error('Distance matrix error:', error);
      return null;
    }
  }
}
```

### 7.4. Usage Examples

#### Display Route on Map

```typescript
// Example: Display route from pickup to dropoff
const [route, setRoute] = useState<Array<{ latitude: number; longitude: number }> | null>(null);

useEffect(() => {
  async function loadRoute() {
    const routeData = await RoutingService.getRoute(
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng },
      'bike'
    );
    
    if (routeData) {
      const decodedRoute = RoutingService.decodePolyline(routeData.polyline);
      setRoute(decodedRoute);
    }
  }
  
  loadRoute();
}, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

// Render
<GoongMapView
  initialRegion={{
    latitude: pickupLat,
    longitude: pickupLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
  markers={[
    { id: 'pickup', coordinate: { latitude: pickupLat, longitude: pickupLng }, title: 'Pickup' },
    { id: 'dropoff', coordinate: { latitude: dropoffLat, longitude: dropoffLng }, title: 'Dropoff' },
  ]}
  route={route}
/>
```

#### Address Selection

```typescript
// Example: Address autocomplete in order creation
<AddressAutocomplete
  placeholder="Nhập địa chỉ lấy hàng"
  onSelect={(address) => {
    setPickupAddress(address.description);
    setPickupCoords({
      latitude: address.latitude,
      longitude: address.longitude,
    });
  }}
  location={userLocation}
/>
```

### 7.5. Best Practices

1. **Always use UrlTile component**, not urlTemplate prop
2. **Cache geocoding results** (1-hour TTL recommended)
3. **Debounce autocomplete** (300ms) to reduce API calls
4. **Handle API errors** gracefully with fallback UI
5. **Add flipY={false}** prop to UrlTile for correct orientation
6. **Use appropriate vehicle type** ('bike' for motorbike, 'car' for car)
7. **Monitor API usage** to stay within free tier limits

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
# Get both keys from: https://goong.io/
EXPO_PUBLIC_GOONG_API_KEY=your-goong-api-key          # For geocoding, directions API
EXPO_PUBLIC_GOONG_MAPTILES_KEY=your-goong-maptiles-key  # For map tiles rendering

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
