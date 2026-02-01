# Logship-MVP: Mobile App Technical Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Platform:** React Native + Expo SDK 54  
**Target:** iOS 14+ / Android 10+  

---

## 1. Overview

This document specifies the technical implementation for Logship-MVP mobile applications (User App & Driver App) using React Native with Expo.

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
| Development builds | Custom native modules when needed |

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
│   ├── order/
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
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── maps/                 # Map components
│   │   │   ├── MapView.tsx
│   │   │   ├── DriverMarker.tsx
│   │   │   └── RoutePolyline.tsx
│   │   ├── order/                # Order components
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── OrderTimeline.tsx
│   │   └── chat/                 # Chat components
│   │       ├── MessageBubble.tsx
│   │       ├── ChatInput.tsx
│   │       └── TypingIndicator.tsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   ├── useSocket.ts
│   │   └── useOrders.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── locationStore.ts
│   │   └── notificationStore.ts
│   ├── services/                 # API services
│   │   ├── api.ts                # Axios instance
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   └── socket.service.ts
│   ├── lib/                      # Utilities
│   │   ├── queryClient.ts        # TanStack Query setup
│   │   ├── storage.ts            # SecureStore wrapper
│   │   └── constants.ts
│   └── types/                    # TypeScript types
│       ├── api.types.ts
│       ├── order.types.ts
│       └── user.types.ts
├── assets/                       # Images, fonts
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── metro.config.js
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 3. Core Dependencies

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-location": "~18.0.0",
    "expo-task-manager": "~12.0.0",
    "expo-notifications": "~0.29.0",
    "expo-secure-store": "~14.0.0",
    "expo-image": "~2.0.0",
    "expo-image-picker": "~16.0.0",
    
    "react-native-maps": "1.18.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    
    "@tanstack/react-query": "^5.60.0",
    "zustand": "^5.0.0",
    "socket.io-client": "^4.8.0",
    "axios": "^1.7.0",
    
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/auth": "^21.0.0",
    
    "date-fns": "^4.1.0",
    "clsx": "^2.1.0"
  }
}
```

---

## 4. State Management

### 4.1. Zustand Stores

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
  
  // Actions
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

#### Location Store (Driver)

```typescript
// src/stores/locationStore.ts
import { create } from 'zustand';

interface LocationState {
  currentLocation: {
    lat: number;
    lng: number;
    heading: number | null;
    speed: number | null;
    accuracy: number | null;
  } | null;
  isTracking: boolean;
  lastUpdated: Date | null;
  
  // Actions
  setLocation: (location: LocationState['currentLocation']) => void;
  setTracking: (isTracking: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  isTracking: false,
  lastUpdated: null,

  setLocation: (location) =>
    set({
      currentLocation: location,
      lastUpdated: new Date(),
    }),

  setTracking: (isTracking) => set({ isTracking }),
}));
```

### 4.2. TanStack Query Setup

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Mobile doesn't have window focus
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 4.3. Query Hooks Example

```typescript
// src/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import type { Order, CreateOrderDto } from '@/types/order.types';

// Query keys factory
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: string) => [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// Get user's orders
export function useOrders(status?: string) {
  return useQuery({
    queryKey: orderKeys.list(status ?? 'all'),
    queryFn: () => orderService.getOrders({ status }),
  });
}

// Get single order
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  });
}

// Create order mutation
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (dto: CreateOrderDto) => orderService.createOrder(dto),
    onSuccess: (newOrder) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      // Optionally set the new order in cache
      queryClient.setQueryData(orderKeys.detail(newOrder.id), newOrder);
    },
  });
}

// Accept order (driver)
export function useAcceptOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => orderService.acceptOrder(orderId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

// Update order status (driver)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status, proofImageUrl }: {
      orderId: string;
      status: string;
      proofImageUrl?: string;
    }) => orderService.updateStatus(orderId, { status, proofImageUrl }),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
```

---

## 5. Location Tracking

### 5.1. Foreground Location (User - Order Tracking)

```typescript
// src/hooks/useWatchLocation.ts
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null;
}

export function useWatchLocation(enabled = true) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation({
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
          });
        }
      );
    };

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, [enabled]);

  return { location, error };
}
```

### 5.2. Background Location (Driver - Active Delivery)

```typescript
// src/services/backgroundLocation.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { socketService } from './socket.service';
import { useLocationStore } from '@/stores/locationStore';

const LOCATION_TASK_NAME = 'DRIVER_BACKGROUND_LOCATION';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    
    if (location) {
      const locationData = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        accuracy: location.coords.accuracy,
      };
      
      // Update store
      useLocationStore.getState().setLocation(locationData);
      
      // Send to server via WebSocket
      socketService.emitDriverLocation(locationData);
    }
  }
});

export const backgroundLocationService = {
  async startTracking(): Promise<boolean> {
    // Check permissions
    const { status: foregroundStatus } = 
      await Location.requestForegroundPermissionsAsync();
      
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission denied');
      return false;
    }

    const { status: backgroundStatus } = 
      await Location.requestBackgroundPermissionsAsync();
      
    if (backgroundStatus !== 'granted') {
      console.error('Background location permission denied');
      return false;
    }

    // Check if already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isRunning) {
      console.log('Background location already running');
      return true;
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000, // 5 seconds
      distanceInterval: 50, // 50 meters
      deferredUpdatesInterval: 5000,
      deferredUpdatesDistance: 50,
      showsBackgroundLocationIndicator: true, // iOS blue bar
      foregroundService: {
        notificationTitle: 'Đang giao hàng',
        notificationBody: 'Vị trí của bạn đang được cập nhật',
        notificationColor: '#4F46E5',
      },
      pausesUpdatesAutomatically: false,
    });

    useLocationStore.getState().setTracking(true);
    console.log('Background location tracking started');
    return true;
  },

  async stopTracking(): Promise<void> {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      useLocationStore.getState().setTracking(false);
      console.log('Background location tracking stopped');
    }
  },

  async isTracking(): Promise<boolean> {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  },
};
```

### 5.3. Location Permission Flow

```typescript
// src/components/LocationPermissionGate.tsx
import { useState, useEffect } from 'react';
import { View, Text, Button, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

interface Props {
  children: React.ReactNode;
  requireBackground?: boolean;
}

export function LocationPermissionGate({ children, requireBackground = false }: Props) {
  const [foregroundGranted, setForegroundGranted] = useState<boolean | null>(null);
  const [backgroundGranted, setBackgroundGranted] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const foreground = await Location.getForegroundPermissionsAsync();
    setForegroundGranted(foreground.status === 'granted');

    if (requireBackground) {
      const background = await Location.getBackgroundPermissionsAsync();
      setBackgroundGranted(background.status === 'granted');
    }
  };

  const requestPermissions = async () => {
    const foreground = await Location.requestForegroundPermissionsAsync();
    setForegroundGranted(foreground.status === 'granted');

    if (requireBackground && foreground.status === 'granted') {
      const background = await Location.requestBackgroundPermissionsAsync();
      setBackgroundGranted(background.status === 'granted');
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Loading state
  if (foregroundGranted === null) {
    return <View><Text>Checking permissions...</Text></View>;
  }

  // Permission denied
  if (!foregroundGranted || (requireBackground && !backgroundGranted)) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold mb-4">Cần quyền vị trí</Text>
        <Text className="text-gray-600 text-center mb-6">
          {requireBackground
            ? 'Ứng dụng cần quyền truy cập vị trí trong nền để theo dõi giao hàng.'
            : 'Ứng dụng cần quyền vị trí để hiển thị bản đồ.'}
        </Text>
        <Button title="Cấp quyền" onPress={requestPermissions} />
        <Button title="Mở Cài đặt" onPress={openSettings} />
      </View>
    );
  }

  return <>{children}</>;
}
```

---

## 6. Maps Integration

### 6.0. Vietnam Map Strategy - Goong Maps

> **Important:** Google Maps has billing issues in Vietnam (blocked billing account creation). We use **Goong Maps** as the primary map provider for Vietnam market.

#### Why Goong Maps?

| Feature | Goong Maps | Google Maps |
|---------|------------|-------------|
| **Vietnam Support** | Native, optimized | Limited |
| **Billing** | VND payments, local bank | Often blocked in VN |
| **Data Quality** | Excellent in Vietnam | Good, but some gaps |
| **Pricing** | Competitive for VN market | Expensive |
| **Geocoding** | Vietnamese address format | Mixed results |
| **Routing** | Vietnam road network | Good |

#### Goong Maps Services

```typescript
// src/services/goong.service.ts
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

interface GoongPlace {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  geometry: {
    location: { lat: number; lng: number };
  };
}

interface GoongRoute {
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    steps: Array<{
      polyline: { points: string };
      distance: { value: number };
      duration: { value: number };
    }>;
  }>;
  overview_polyline: { points: string };
}

export const goongService = {
  /**
   * Autocomplete places search (for location picker)
   */
  async autocomplete(input: string, location?: { lat: number; lng: number }): Promise<GoongPlace[]> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      input,
      ...(location && { location: `${location.lat},${location.lng}` }),
      radius: '50000', // 50km radius
      more_compound: 'true',
    });

    const response = await fetch(`${GOONG_BASE_URL}/Place/AutoComplete?${params}`);
    const data = await response.json();
    return data.predictions || [];
  },

  /**
   * Get place details by place_id
   */
  async getPlaceDetail(placeId: string): Promise<GoongPlace | null> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      place_id: placeId,
    });

    const response = await fetch(`${GOONG_BASE_URL}/Place/Detail?${params}`);
    const data = await response.json();
    return data.result || null;
  },

  /**
   * Reverse geocode (coordinates to address)
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      latlng: `${lat},${lng}`,
    });

    const response = await fetch(`${GOONG_BASE_URL}/Geocode?${params}`);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return 'Unknown location';
  },

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<GoongRoute | null> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle: 'bike', // bike, car, taxi
    });

    const response = await fetch(`${GOONG_BASE_URL}/Direction?${params}`);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  },

  /**
   * Decode polyline from Goong directions
   */
  decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
    const points: Array<{ latitude: number; longitude: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  },
};
```

#### Goong Place Autocomplete Component

```typescript
// src/components/maps/GoongPlaceAutocomplete.tsx
import { useState, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { goongService } from '@/services/goong.service';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  placeholder?: string;
  onPlaceSelect: (place: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
}

export function GoongPlaceAutocomplete({ placeholder = 'Nhập địa chỉ...', onPlaceSelect }: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch predictions when query changes
  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        const results = await goongService.autocomplete(debouncedQuery);
        setPredictions(results);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [debouncedQuery]);

  const handleSelect = async (prediction: any) => {
    setQuery(prediction.description);
    setPredictions([]);

    // Get place details for coordinates
    const detail = await goongService.getPlaceDetail(prediction.place_id);
    if (detail?.geometry?.location) {
      onPlaceSelect({
        address: prediction.description,
        lat: detail.geometry.location.lat,
        lng: detail.geometry.location.lng,
      });
    }
  };

  return (
    <View className="relative">
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
        <TextInput
          className="flex-1 py-3 text-base"
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#9CA3AF"
        />
        {isLoading && <ActivityIndicator size="small" color="#6366F1" />}
      </View>

      {predictions.length > 0 && (
        <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-lg z-50 max-h-60">
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="px-4 py-3 border-b border-gray-100"
                onPress={() => handleSelect(item)}
              >
                <Text className="font-medium text-gray-900">
                  {item.structured_formatting.main_text}
                </Text>
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
```

#### Goong Map Tiles (Optional - for custom map styling)

```typescript
// For web admin dashboard using Goong map tiles
// apps/admin/src/components/maps/GoongMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl'; // Goong uses Mapbox GL JS compatible tiles

const GOONG_MAPTILES_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;

interface Props {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    id: string;
    lng: number;
    lat: number;
    color?: string;
  }>;
}

export function GoongMap({ center, zoom = 14, markers = [] }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`,
      center,
      zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current) return;

    markers.forEach((marker) => {
      new mapboxgl.Marker({ color: marker.color || '#4F46E5' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);
    });
  }, [markers]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
```

---

### 6.1. Map Component with Driver Marker

```typescript
// src/components/maps/TrackingMap.tsx
import { useRef, useEffect } from 'react';
import MapView, { Marker, Polyline, AnimatedRegion, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform, StyleSheet } from 'react-native';

interface Props {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number; heading?: number };
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
}

export function TrackingMap({ pickup, dropoff, driverLocation, routeCoordinates }: Props) {
  const mapRef = useRef<MapView>(null);
  const driverMarkerRef = useRef<Marker>(null);
  
  // Animated driver position for smooth movement
  const animatedDriverPosition = useRef(
    new AnimatedRegion({
      latitude: driverLocation?.lat ?? pickup.lat,
      longitude: driverLocation?.lng ?? pickup.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  // Animate driver marker when location updates
  useEffect(() => {
    if (driverLocation) {
      const duration = 1000; // 1 second animation
      
      if (Platform.OS === 'android') {
        driverMarkerRef.current?.animateMarkerToCoordinate(
          {
            latitude: driverLocation.lat,
            longitude: driverLocation.lng,
          },
          duration
        );
      } else {
        animatedDriverPosition.timing({
          latitude: driverLocation.lat,
          longitude: driverLocation.lng,
          duration,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [driverLocation]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current) {
      const coordinates = [
        { latitude: pickup.lat, longitude: pickup.lng },
        { latitude: dropoff.lat, longitude: dropoff.lng },
      ];
      
      if (driverLocation) {
        coordinates.push({
          latitude: driverLocation.lat,
          longitude: driverLocation.lng,
        });
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  }, [pickup, dropoff, driverLocation]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: pickup.lat,
        longitude: pickup.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {/* Pickup marker */}
      <Marker
        coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
        title="Điểm lấy hàng"
        pinColor="green"
      />

      {/* Dropoff marker */}
      <Marker
        coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
        title="Điểm giao hàng"
        pinColor="red"
      />

      {/* Driver marker (animated) */}
      {driverLocation && (
        <Marker.Animated
          ref={driverMarkerRef}
          coordinate={animatedDriverPosition}
          title="Tài xế"
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={driverLocation.heading ?? 0}
        >
          <DriverMarkerIcon />
        </Marker.Animated>
      )}

      {/* Route polyline */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#4F46E5"
          strokeWidth={4}
          lineDashPattern={[0]}
        />
      )}
    </MapView>
  );
}

// Custom driver marker icon
function DriverMarkerIcon() {
  return (
    <View className="bg-indigo-600 rounded-full p-2 shadow-lg">
      <Image
        source={require('@/assets/icons/motorcycle.png')}
        style={{ width: 24, height: 24, tintColor: 'white' }}
      />
    </View>
  );
}
```

### 6.2. Location Picker Component

```typescript
// src/components/maps/LocationPicker.tsx
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

interface Props {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

export function LocationPicker({ onLocationSelect, initialLocation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.lat ?? 10.7769, // Default: Ho Chi Minh City
    longitude: initialLocation?.lng ?? 106.7009,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Reverse geocode when region changes
  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    setIsLoading(true);

    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });

      if (results.length > 0) {
        const place = results[0];
        const formattedAddress = [
          place.streetNumber,
          place.street,
          place.district,
          place.city,
        ]
          .filter(Boolean)
          .join(', ');
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setAddress('Không thể lấy địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  // Go to current location
  const goToCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      lat: region.latitude,
      lng: region.longitude,
      address,
    });
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
      />

      {/* Center pin (static overlay) */}
      <View className="absolute top-1/2 left-1/2 -ml-4 -mt-8">
        <Text className="text-4xl">📍</Text>
      </View>

      {/* Current location button */}
      <TouchableOpacity
        className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg"
        onPress={goToCurrentLocation}
      >
        <Text>📍</Text>
      </TouchableOpacity>

      {/* Address display and confirm button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-xl shadow-lg">
        <Text className="text-gray-500 text-sm mb-1">Địa chỉ đã chọn</Text>
        <Text className="text-lg font-medium mb-4" numberOfLines={2}>
          {isLoading ? 'Đang tải...' : address || 'Di chuyển bản đồ để chọn vị trí'}
        </Text>
        <TouchableOpacity
          className="bg-indigo-600 py-3 rounded-lg"
          onPress={handleConfirm}
          disabled={!address || isLoading}
        >
          <Text className="text-white text-center font-semibold">Xác nhận vị trí</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 7. Socket.io Integration

### 7.1. Socket Service

```typescript
// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { orderKeys } from '@/hooks/useOrders';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    const token = useAuthStore.getState().accessToken;
    
    if (!token) {
      console.error('No auth token available');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Order events
    this.socket.on('order:status', (data) => {
      console.log('Order status updated:', data);
      // Update cache
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.orderId) });
    });

    this.socket.on('order:assigned', (data) => {
      console.log('Order assigned:', data);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    });

    this.socket.on('order:new', (data) => {
      console.log('New order available:', data);
      // Show notification to driver
      // notificationService.showLocalNotification(...)
    });

    // Location events
    this.socket.on('location:updated', (data) => {
      console.log('Driver location updated:', data);
      // Update order query with new driver location
      queryClient.setQueryData(orderKeys.detail(data.orderId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          driver: {
            ...old.driver,
            currentLocation: { lat: data.lat, lng: data.lng },
          },
        };
      });
    });

    // Chat events
    this.socket.on('chat:message', (message) => {
      console.log('New message:', message);
      // Update messages query
      queryClient.invalidateQueries({ 
        queryKey: ['messages', message.orderId] 
      });
    });

    this.socket.on('chat:typing', (data) => {
      console.log('User typing:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room management
  joinOrderRoom(orderId: string): void {
    this.socket?.emit('order:join', { orderId });
  }

  leaveOrderRoom(orderId: string): void {
    this.socket?.emit('order:leave', { orderId });
  }

  // Driver location
  emitDriverLocation(location: {
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
    orderId?: string;
  }): void {
    this.socket?.emit('driver:location', location);
  }

  // Chat
  sendMessage(orderId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT'): void {
    this.socket?.emit('chat:message', { orderId, content, type });
  }

  sendTyping(orderId: string): void {
    this.socket?.emit('chat:typing', { orderId });
  }

  markMessagesRead(orderId: string): void {
    this.socket?.emit('chat:read', { orderId });
  }

  // Getters
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
```

### 7.2. Socket Hook

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/stores/authStore';

export function useSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - reconnect if needed
        if (isAuthenticated && !socketService.isConnected()) {
          socketService.connect();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  return {
    isConnected: socketService.isConnected(),
    joinOrderRoom: socketService.joinOrderRoom.bind(socketService),
    leaveOrderRoom: socketService.leaveOrderRoom.bind(socketService),
    sendMessage: socketService.sendMessage.bind(socketService),
    sendTyping: socketService.sendTyping.bind(socketService),
  };
}
```

---

## 8. Screen Examples

### 8.1. Order Tracking Screen

```typescript
// app/order/tracking.tsx
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useOrder } from '@/hooks/useOrders';
import { useSocket } from '@/hooks/useSocket';
import { TrackingMap } from '@/components/maps/TrackingMap';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);
  const { joinOrderRoom, leaveOrderRoom } = useSocket();

  // Join order room for real-time updates
  useEffect(() => {
    if (id) {
      joinOrderRoom(id);
      return () => leaveOrderRoom(id);
    }
  }, [id]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !order) {
    return <ErrorScreen message="Không thể tải đơn hàng" />;
  }

  const canChat = ['ASSIGNED', 'PICKING_UP', 'DELIVERING'].includes(order.status);

  return (
    <View className="flex-1">
      {/* Map - takes upper 60% of screen */}
      <View className="flex-[0.6]">
        <TrackingMap
          pickup={{ lat: order.pickup.lat, lng: order.pickup.lng }}
          dropoff={{ lat: order.dropoff.lat, lng: order.dropoff.lng }}
          driverLocation={order.driver?.currentLocation}
        />
      </View>

      {/* Order details - bottom sheet style */}
      <View className="flex-[0.4] bg-white rounded-t-3xl -mt-6 p-4 shadow-lg">
        {/* Status badge */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold">#{order.orderNumber}</Text>
          <OrderStatusBadge status={order.status} />
        </View>

        {/* Driver info (if assigned) */}
        {order.driver && (
          <View className="flex-row items-center bg-gray-50 p-3 rounded-xl mb-4">
            <Image
              source={{ uri: order.driver.avatarUrl || DEFAULT_AVATAR }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="font-semibold">{order.driver.name}</Text>
              <Text className="text-gray-500">{order.driver.vehiclePlate}</Text>
            </View>
            
            {/* Call button */}
            <TouchableOpacity
              className="bg-green-500 p-3 rounded-full mr-2"
              onPress={() => Linking.openURL(`tel:${order.driver.phone}`)}
            >
              <PhoneIcon color="white" size={20} />
            </TouchableOpacity>
            
            {/* Chat button */}
            {canChat && (
              <TouchableOpacity
                className="bg-indigo-500 p-3 rounded-full"
                onPress={() => router.push(`/chat/${order.id}`)}
              >
                <ChatIcon color="white" size={20} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Timeline */}
        <OrderTimeline order={order} />
      </View>
    </View>
  );
}
```

### 8.2. Driver Home Screen

```typescript
// app/(tabs)/index.tsx (for Driver role)
import { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePendingOrders, useAcceptOrder } from '@/hooks/useOrders';
import { useWatchLocation } from '@/hooks/useWatchLocation';
import { backgroundLocationService } from '@/services/backgroundLocation';
import { OrderCard } from '@/components/order/OrderCard';
import { DriverStatusToggle } from '@/components/driver/DriverStatusToggle';
import { LocationPermissionGate } from '@/components/LocationPermissionGate';

export default function DriverHomeScreen() {
  const user = useAuthStore((state) => state.user);
  const driver = user?.driver;
  
  const [isOnline, setIsOnline] = useState(driver?.status === 'ACTIVE');
  const { location } = useWatchLocation(isOnline);
  
  const { 
    data: pendingOrders, 
    isLoading, 
    refetch,
    isRefetching,
  } = usePendingOrders({
    lat: location?.lat,
    lng: location?.lng,
    enabled: isOnline && !!location,
  });
  
  const acceptOrderMutation = useAcceptOrder();

  // Handle status toggle
  const handleStatusToggle = async (newStatus: boolean) => {
    setIsOnline(newStatus);
    
    if (newStatus) {
      await backgroundLocationService.startTracking();
    } else {
      await backgroundLocationService.stopTracking();
    }
    
    // API call to update driver status
    // await driverService.updateStatus(newStatus ? 'ACTIVE' : 'OFFLINE');
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrderMutation.mutateAsync(orderId);
      // Navigate to order details
      router.push(`/order/${orderId}`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể nhận đơn hàng. Vui lòng thử lại.');
    }
  };

  if (!driver?.isApproved) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold mb-2">Đang chờ phê duyệt</Text>
        <Text className="text-gray-600 text-center">
          Tài khoản tài xế của bạn đang được xem xét. 
          Vui lòng đợi admin phê duyệt.
        </Text>
      </View>
    );
  }

  return (
    <LocationPermissionGate requireBackground>
      <View className="flex-1 bg-gray-50">
        {/* Header with status toggle */}
        <View className="bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold">Xin chào, {user?.name}</Text>
              <Text className="text-gray-500">
                {isOnline ? '🟢 Đang hoạt động' : '⚫ Ngoại tuyến'}
              </Text>
            </View>
            <DriverStatusToggle
              isOnline={isOnline}
              onToggle={handleStatusToggle}
            />
          </View>
        </View>

        {/* Today's stats */}
        <View className="flex-row p-4 gap-4">
          <View className="flex-1 bg-white p-4 rounded-xl">
            <Text className="text-gray-500">Đơn hôm nay</Text>
            <Text className="text-2xl font-bold">5</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl">
            <Text className="text-gray-500">Thu nhập</Text>
            <Text className="text-2xl font-bold text-green-600">350K</Text>
          </View>
        </View>

        {/* Pending orders list */}
        {isOnline ? (
          <FlatList
            data={pendingOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onAccept={() => handleAcceptOrder(item.id)}
                isAccepting={acceptOrderMutation.isPending}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            contentContainerStyle={{ padding: 16, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Text className="text-gray-500">Không có đơn hàng mới</Text>
              </View>
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-center px-6">
              Bật trạng thái hoạt động để nhận đơn hàng mới
            </Text>
          </View>
        )}
      </View>
    </LocationPermissionGate>
  );
}
```

---

## 9. Build & Deployment

### 9.1. EAS Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 9.2. App Configuration

```json
// app.json
{
  "expo": {
    "name": "Logship",
    "slug": "logship",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4F46E5"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.logship",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Ứng dụng cần vị trí để hiển thị bản đồ và theo dõi giao hàng.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Ứng dụng cần quyền vị trí trong nền để cập nhật vị trí khi giao hàng.",
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4F46E5"
      },
      "package": "com.yourcompany.logship",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Cho phép $(PRODUCT_NAME) sử dụng vị trí của bạn.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Cho phép $(PRODUCT_NAME) truy cập ảnh của bạn."
        }
      ],
      "@react-native-firebase/app"
    ],
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 9.3. Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Development build (for testing on device)
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview build (internal testing)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform android
eas submit --platform ios

# OTA Update
eas update --branch production --message "Bug fixes"
```

---

## 10. Testing Checklist

### 10.1. Core Flows

- [ ] Phone OTP login/logout
- [ ] Create order with location picker
- [ ] Real-time order tracking with driver marker animation
- [ ] Chat messaging (text + image)
- [ ] Driver status toggle (online/offline)
- [ ] Driver accept order
- [ ] Driver update order status (pickup → delivering → completed)
- [ ] Background location tracking (driver)
- [ ] Push notifications

### 10.2. Edge Cases

- [ ] Network offline handling
- [ ] Location permission denied
- [ ] Token refresh when expired
- [ ] Deep linking to specific order
- [ ] App killed and restored
- [ ] Multiple orders (driver can only have one active)

### 10.3. Performance

- [ ] Map smooth scrolling with many markers
- [ ] Driver marker animation (no jank)
- [ ] List virtualization for orders/messages
- [ ] Image upload compression
- [ ] Memory usage during long tracking sessions
