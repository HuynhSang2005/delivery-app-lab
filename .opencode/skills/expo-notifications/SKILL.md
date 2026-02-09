---
name: expo-notifications
description: Use when implementing push notifications in Expo SDK 54 with Firebase Cloud Messaging (FCM), handling permissions, notification channels, and deep linking.
---

# Expo Notifications

## Overview

Complete push notification setup for Expo SDK 54 with Firebase Cloud Messaging (FCM). Covers device token registration, permission handling, notification channels (Android), foreground/background handling, and deep linking.

## When to Use

**Use this skill when:**
- Setting up push notifications in Expo
- Integrating with Firebase Cloud Messaging
- Handling notification permissions
- Configuring notification channels (Android)
- Implementing deep linking from notifications
- Sending notifications from backend

**Don't use when:**
- Using OneSignal or other third-party services
- Local-only notifications (use expo-notifications directly)
- Bare React Native without Expo

## Core Patterns

### Pattern 1: Setup and Configuration

```json
// app.json
{
  "expo": {
    "plugins": [
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

```bash
# Install dependencies
npx expo install expo-notifications expo-device expo-constants

# For Firebase integration
npx expo install @react-native-firebase/app @react-native-firebase/messaging
```

### Pattern 2: Notification Service

```typescript
// src/services/notification.service.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<string | null> {
    // Check if physical device
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    this.token = tokenData.data;

    // Configure Android channel
    if (Platform.OS === 'android') {
      await this.setupAndroidChannel();
    }

    return this.token;
  }

  private async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thông báo mặc định',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Order notifications channel
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Đơn hàng',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      sound: 'order_sound.wav', // Place in assets
    });

    // Chat notifications channel
    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Tin nhắn',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  getToken(): string | null {
    return this.token;
  }

  // Listen for incoming notifications
  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Listen for notification responses (user taps)
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Remove listeners
  removeNotificationListener(listener: any) {
    Notifications.removeNotificationSubscription(listener);
  }
}
```

### Pattern 3: React Hook

```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '@/services/notification.service';

interface UseNotificationsReturn {
  token: string | null;
  permissionGranted: boolean;
  initialize: () => Promise<void>;
}

export function useNotifications(
  onNotification?: (notification: Notifications.Notification) => void,
  onNotificationTap?: (data: any) => void
): UseNotificationsReturn {
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const initialize = useCallback(async () => {
    const service = NotificationService.getInstance();
    const pushToken = await service.initialize();
    
    if (pushToken) {
      setToken(pushToken);
      setPermissionGranted(true);
      
      // Send token to your backend
      await registerTokenWithBackend(pushToken);
    }
  }, []);

  useEffect(() => {
    const service = NotificationService.getInstance();

    // Listen for notifications
    const notificationListener = onNotification
      ? service.addNotificationListener(onNotification)
      : null;

    // Listen for notification taps
    const responseListener = onNotificationTap
      ? service.addNotificationResponseListener((response) => {
          const data = response.notification.request.content.data;
          onNotificationTap(data);
        })
      : null;

    return () => {
      if (notificationListener) {
        service.removeNotificationListener(notificationListener);
      }
      if (responseListener) {
        service.removeNotificationListener(responseListener);
      }
    };
  }, [onNotification, onNotificationTap]);

  return { token, permissionGranted, initialize };
}

async function registerTokenWithBackend(token: string) {
  // Send token to your backend
  try {
    await fetch('/api/users/push-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}

async function getAuthToken(): Promise<string> {
  // Get your auth token
  return '';
}
```

### Pattern 4: Deep Linking from Notifications

```typescript
// src/navigation/NotificationNavigator.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '@/services/notification.service';

export function NotificationNavigator() {
  const router = useRouter();

  useEffect(() => {
    const service = NotificationService.getInstance();

    // Handle notification tap when app is in background
    const responseListener = service.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    );

    // Check if app was opened from notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    });

    return () => {
      service.removeNotificationListener(responseListener);
    };
  }, [router]);

  const handleNotificationNavigation = (data: any) => {
    switch (data.type) {
      case 'NEW_ORDER':
        router.push(`/orders/${data.orderId}`);
        break;
      case 'ORDER_STATUS':
        router.push(`/orders/${data.orderId}/tracking`);
        break;
      case 'CHAT_MESSAGE':
        router.push(`/chat/${data.orderId}`);
        break;
      case 'PROMOTION':
        router.push('/promotions');
        break;
      default:
        router.push('/');
    }
  };

  return null;
}
```

### Pattern 5: Backend Notification Service (NestJS)

```typescript
// backend/src/modules/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface NotificationPayload {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'high' | 'normal';
  channelId?: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async sendNotification(payload: NotificationPayload) {
    const message = {
      to: payload.to,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: payload.priority || 'high',
      channelId: payload.channelId || 'default',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      // Log notification
      await this.prisma.notificationLog.create({
        data: {
          token: payload.to,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          status: result.data?.status || 'unknown',
          sentAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  async sendToUser(userId: string, payload: Omit<NotificationPayload, 'to'>) {
    // Get user's push tokens
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
    });

    // Send to all user devices
    const results = await Promise.all(
      tokens.map((token) =>
        this.sendNotification({ ...payload, to: token.token })
      )
    );

    return results;
  }

  async broadcast(
    userIds: string[],
    payload: Omit<NotificationPayload, 'to'>
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
    });

    // Batch send (Expo allows up to 100 notifications per request)
    const chunks = this.chunkArray(tokens, 100);

    for (const chunk of chunks) {
      const messages = chunk.map((token) => ({
        to: token.token,
        sound: payload.sound || 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        priority: payload.priority,
        channelId: payload.channelId,
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

## Notification Types

| Type | Channel | Use Case |
|------|---------|----------|
| `default` | default | General notifications |
| `orders` | orders | New order, status updates |
| `chat` | chat | New messages |
| `promotions` | default | Marketing, discounts |

## Quick Reference

| Task | Function |
|------|----------|
| Get permissions | `Notifications.getPermissionsAsync()` |
| Request permissions | `Notifications.requestPermissionsAsync()` |
| Get token | `Notifications.getExpoPushTokenAsync()` |
| Set channel | `Notifications.setNotificationChannelAsync()` |
| Listen | `Notifications.addNotificationReceivedListener()` |
| Handle tap | `Notifications.addNotificationResponseReceivedListener()` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not checking Device.isDevice | Notifications don't work in simulator |
| Missing Android channel | Always create channels for Android 8+ |
| Not handling permissions | Check and request before getting token |
| Forgetting to register token | Send token to backend after getting it |
| No deep linking | Implement navigation from notification tap |

## Dependencies

```json
{
  "dependencies": {
    "expo-notifications": "~0.29.0",
    "expo-device": "~7.1.0",
    "expo-constants": "~17.1.0",
    "@react-native-firebase/app": "^22.0.0",
    "@react-native-firebase/messaging": "^22.0.0"
  }
}
```

## Related Skills

- **firebase-auth** - User authentication
- **delivery-order-matching** - Order notifications
- **socket-io-nestjs-react-native** - Real-time updates
