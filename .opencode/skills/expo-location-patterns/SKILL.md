---
name: expo-location-patterns
description: Use when implementing location tracking in Expo SDK 54 with expo-location, handling foreground/background tracking, permissions, and battery optimization for delivery/logistics apps.
---

# Expo Location Patterns

## Overview

Production-ready patterns for location tracking in Expo SDK 54. Covers foreground tracking for users, background tracking for drivers, permission handling, and battery optimization.

## When to Use

**Use this skill when:**
- Implementing real-time location tracking in React Native + Expo
- Building delivery/logistics apps with driver location updates
- Need foreground location for order tracking screens
- Need background location for active delivery sessions
- Handling iOS/Android location permission flows
- Optimizing battery usage during location tracking

**Don't use when:**
- Using bare React Native without Expo
- Only need one-time location fetch (use `getCurrentPositionAsync` directly)
- Building simple apps without background tracking needs

## Core Patterns

### Pattern 1: Foreground Location (User - Order Tracking)

For tracking screens where app is in foreground:

```typescript
import { useState, useEffect } from 'react';
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
          timeInterval: 5000,      // Update every 5 seconds
          distanceInterval: 10,    // Or every 10 meters
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

### Pattern 2: Background Location (Driver - Active Delivery)

For continuous tracking even when app is backgrounded:

```typescript
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'DRIVER_BACKGROUND_LOCATION';

// Define background task BEFORE any other code
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
      
      // Send to server via WebSocket/HTTP
      await sendLocationToServer(locationData);
    }
  }
});

export const backgroundLocationService = {
  async startTracking(): Promise<boolean> {
    // Check foreground permission first
    const { status: foregroundStatus } = 
      await Location.requestForegroundPermissionsAsync();
      
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission denied');
      return false;
    }

    // Check background permission
    const { status: backgroundStatus } = 
      await Location.requestBackgroundPermissionsAsync();
      
    if (backgroundStatus !== 'granted') {
      console.error('Background location permission denied');
      return false;
    }

    // Check if already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isRunning) {
      return true;
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,           // 5 seconds
      distanceInterval: 50,         // 50 meters
      deferredUpdatesInterval: 5000,
      deferredUpdatesDistance: 50,
      showsBackgroundLocationIndicator: true,  // iOS blue bar
      foregroundService: {
        notificationTitle: 'Đang giao hàng',
        notificationBody: 'Vị trí của bạn đang được cập nhật',
        notificationColor: '#4F46E5',
      },
      pausesUpdatesAutomatically: false,
    });

    return true;
  },

  async stopTracking(): Promise<void> {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  },

  async isTracking(): Promise<boolean> {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  },
};
```

### Pattern 3: Permission Gate Component

Handle permission UI consistently:

```typescript
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

## Quick Reference

| Task | Function | Notes |
|------|----------|-------|
| One-time location | `getCurrentPositionAsync()` | Use for single fetch |
| Foreground tracking | `watchPositionAsync()` | Returns subscription, call `.remove()` to stop |
| Background tracking | `startLocationUpdatesAsync()` | Requires TaskManager, works in background |
| Stop background | `stopLocationUpdatesAsync()` | Use when delivery complete |
| Check permission | `getForegroundPermissionsAsync()` | Check without prompting |
| Request permission | `requestForegroundPermissionsAsync()` | Shows system dialog |
| Check background | `getBackgroundPermissionsAsync()` | iOS: "Always" permission |
| Request background | `requestBackgroundPermissionsAsync()` | Must request foreground first |

## Configuration

### app.json

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Ứng dụng cần vị trí để hiển thị bản đồ.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Ứng dụng cần vị trí trong nền để theo dõi giao hàng.",
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Cho phép $(PRODUCT_NAME) sử dụng vị trí của bạn.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ]
  }
}
```

## Battery Optimization

### Accuracy Levels

```typescript
// High accuracy - uses GPS, drains battery faster
accuracy: Location.Accuracy.High

// Balanced - uses WiFi/cellular, good for background
accuracy: Location.Accuracy.Balanced

// Low - significant power savings
accuracy: Location.Accuracy.Low
```

### Update Intervals

```typescript
// Conservative settings for background tracking
{
  timeInterval: 10000,      // 10 seconds
  distanceInterval: 100,    // 100 meters
  deferredUpdatesInterval: 30000,  // Batch updates every 30s
  deferredUpdatesDistance: 100,    // Or every 100m
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not checking permissions | Always check/request before tracking |
| Forgetting cleanup | Remove subscriptions, stop background updates |
| Background without task | Must use `TaskManager.defineTask()` |
| Wrong accuracy | Use `Balanced` for background, `High` for foreground |
| No foreground service | Required for Android background tracking |
| iOS background indicator | Set `showsBackgroundLocationIndicator: true` |

## Integration Example

```typescript
// Driver screen with background tracking
export function DriverScreen() {
  const [isOnline, setIsOnline] = useState(false);

  const toggleOnline = async (online: boolean) => {
    if (online) {
      const started = await backgroundLocationService.startTracking();
      if (started) {
        setIsOnline(true);
        // Notify server driver is active
      }
    } else {
      await backgroundLocationService.stopTracking();
      setIsOnline(false);
      // Notify server driver is offline
    }
  };

  return (
    <LocationPermissionGate requireBackground>
      <View>
        <Switch
          value={isOnline}
          onValueChange={toggleOnline}
        />
        <Text>{isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
      </View>
    </LocationPermissionGate>
  );
}
```

## Dependencies

```json
{
  "dependencies": {
    "expo-location": "~18.0.0",
    "expo-task-manager": "~12.0.0"
  }
}
```

## Related Skills

- **socket-io-nestjs-react-native** - Send location updates to server
- **react-native-best-practices** - Performance optimization
- **upgrading-expo** - Expo SDK 54 migration
