---
name: firebase-auth-patterns
description: Use when implementing Firebase Phone Authentication in React Native with OTP verification, JWT token exchange, and secure token storage using Expo SecureStore.
---

# Firebase Auth Patterns

## Overview

Production-ready patterns for Firebase Phone Authentication in React Native + Expo. Covers OTP flow, token exchange with backend, secure storage, and automatic token refresh.

## When to Use

**Use this skill when:**
- Implementing phone-based authentication with Firebase
- Building apps for markets where phone auth is preferred (Vietnam, India, etc.)
- Need OTP verification flow with automatic code detection
- Exchanging Firebase ID tokens for backend JWT tokens
- Storing tokens securely on mobile devices
- Implementing automatic token refresh

**Don't use when:**
- Using email/password authentication (use Firebase Email Auth directly)
- Building web-only applications
- Using social OAuth providers (Google, Facebook) exclusively

## Core Patterns

### Pattern 1: Firebase Auth Service

Centralized service for Firebase Auth operations:

```typescript
// src/services/firebaseAuth.service.ts
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

class FirebaseAuthService {
  private confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone number with country code
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      this.confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      return { success: true };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(code: string): Promise<{ 
    success: boolean; 
    idToken?: string;
    error?: string;
  }> {
    try {
      if (!this.confirmationResult) {
        return { success: false, error: 'No OTP request found. Please request OTP first.' };
      }

      const userCredential = await this.confirmationResult.confirm(code);
      const idToken = await userCredential.user.getIdToken();
      
      return { success: true, idToken };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  /**
   * Get current Firebase ID token (for API calls)
   */
  async getIdToken(): Promise<string | null> {
    const user = auth().currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken(true); // Force refresh
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }

  /**
   * Sign out from Firebase
   */
  async signOut(): Promise<void> {
    await auth().signOut();
    this.confirmationResult = null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return auth().onAuthStateChanged(callback);
  }

  /**
   * Format phone number with +84 country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with +84
    if (digits.startsWith('0')) {
      return `+84${digits.slice(1)}`;
    }
    
    // If already has country code
    if (digits.startsWith('84')) {
      return `+${digits}`;
    }
    
    return `+${digits}`;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
      'auth/invalid-verification-code': 'Mã OTP không đúng',
      'auth/code-expired': 'Mã OTP đã hết hạn',
      'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau',
      'auth/network-request-failed': 'Lỗi kết nối mạng',
    };
    
    return errorMessages[code] || 'Có lỗi xảy ra. Vui lòng thử lại';
  }
}

export const firebaseAuthService = new FirebaseAuthService();
```

### Pattern 2: Backend Token Exchange

Exchange Firebase ID token for backend JWT:

```typescript
// src/services/auth.service.ts
import { firebaseAuthService } from './firebaseAuth.service';
import { api } from './api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: 'USER' | 'DRIVER' | 'ADMIN';
}

export const authService = {
  /**
   * Verify OTP and get backend tokens
   */
  async verifyOTPAndLogin(phone: string, otp: string): Promise<{
    success: boolean;
    tokens?: AuthTokens;
    user?: User;
    error?: string;
  }> {
    // Step 1: Verify OTP with Firebase
    const firebaseResult = await firebaseAuthService.verifyOTP(otp);
    
    if (!firebaseResult.success || !firebaseResult.idToken) {
      return { 
        success: false, 
        error: firebaseResult.error || 'OTP verification failed' 
      };
    }

    // Step 2: Exchange Firebase token for backend JWT
    try {
      const response = await api.post('/auth/otp/verify', {
        phone,
        otp,
        firebaseToken: firebaseResult.idToken,
      });

      return {
        success: true,
        tokens: {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn,
        },
        user: response.data.user,
      };
    } catch (error: any) {
      console.error('Backend auth error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Login failed' 
      };
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken,
      });

      return {
        success: true,
        accessToken: response.data.accessToken,
        expiresIn: response.data.expiresIn,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'Token refresh failed' 
      };
    }
  },

  /**
   * Logout from both Firebase and backend
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Backend logout
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Backend logout error:', error);
    }

    // Firebase logout
    await firebaseAuthService.signOut();
  },
};
```

### Pattern 3: Secure Token Storage

Store tokens securely using Expo SecureStore:

```typescript
// src/lib/storage.ts
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
} as const;

export const secureStorage = {
  /**
   * Save auth tokens
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Save user data
   */
  async saveUser(user: object): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  /**
   * Get user data
   */
  async getUser(): Promise<object | null> {
    const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Clear all auth data
   */
  async clearAuth(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  },
};
```

### Pattern 4: Auth Store with Zustand

Manage auth state with persistence:

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/storage';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: 'USER' | 'DRIVER' | 'ADMIN';
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// SecureStore adapter for Zustand persist
const secureStorageAdapter = {
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
      storage: createJSONStorage(() => secureStorageAdapter),
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

### Pattern 5: Axios Interceptor for Token Refresh

Automatic token refresh on 401 errors:

```typescript
// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { authService } from './auth.service';
import { secureStorage } from '@/lib/storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth header
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Wait for token refresh
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await secureStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const result = await authService.refreshToken(refreshToken);

      if (!result.success || !result.accessToken) {
        throw new Error('Token refresh failed');
      }

      // Update store with new token
      useAuthStore.getState().setTokens(result.accessToken);

      // Notify subscribers
      onTokenRefreshed(result.accessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout user
      useAuthStore.getState().logout();
      await secureStorage.clearAuth();
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { api };
```

### Pattern 6: OTP Screen Component

Complete OTP flow UI:

```typescript
// src/app/(auth)/otp.tsx
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { firebaseAuthService } from '@/services/firebaseAuth.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<TextInput>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ 6 số');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyOTPAndLogin(phone, code);

      if (!result.success) {
        Alert.alert('Lỗi', result.error || 'Xác thực thất bại');
        return;
      }

      // Save auth state
      setAuth(
        result.user!,
        result.tokens!.accessToken,
        result.tokens!.refreshToken
      );

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    const result = await firebaseAuthService.sendOTP(phone);
    
    if (result.success) {
      setCountdown(60);
      Alert.alert('Thành công', 'Mã OTP đã được gửi lại');
    } else {
      Alert.alert('Lỗi', result.error || 'Không thể gửi lại mã');
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-2">Nhập mã OTP</Text>
      <Text className="text-gray-600 mb-8">
        Mã xác thực đã được gửi đến {phone}
      </Text>

      {/* OTP Input */}
      <TextInput
        ref={inputRef}
        className="border border-gray-300 rounded-xl p-4 text-center text-2xl tracking-[8px] mb-6"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        placeholder="000000"
      />

      {/* Verify Button */}
      <TouchableOpacity
        className={`bg-indigo-600 py-4 rounded-xl ${isLoading ? 'opacity-50' : ''}`}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
        </Text>
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        className="mt-6"
        onPress={handleResend}
        disabled={countdown > 0}
      >
        <Text className={`text-center ${countdown > 0 ? 'text-gray-400' : 'text-indigo-600'}`}>
          {countdown > 0 
            ? `Gửi lại mã sau ${countdown}s` 
            : 'Gửi lại mã OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Quick Reference

| Task | Method | Notes |
|------|--------|-------|
| Send OTP | `signInWithPhoneNumber()` | Returns ConfirmationResult |
| Verify OTP | `confirmationResult.confirm()` | Returns UserCredential |
| Get ID token | `user.getIdToken()` | Use `true` to force refresh |
| Listen auth state | `onAuthStateChanged()` | Returns unsubscribe function |
| Sign out | `signOut()` | Clears Firebase session |

## Configuration

### app.json

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth"
    ]
  }
}
```

### Environment Variables

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.yourapp.com
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not formatting phone | Always add country code (+84) |
| Storing tokens in AsyncStorage | Use SecureStore for tokens |
| No token refresh | Implement axios interceptor |
| Missing error handling | Map Firebase error codes |
| No logout cleanup | Clear both Firebase and backend |

## Dependencies

```json
{
  "dependencies": {
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/auth": "^21.0.0",
    "expo-secure-store": "~14.0.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.0"
  }
}
```

## Related Skills

- **zustand-state-management** - Auth state with persistence
- **native-data-fetching** - API calls with axios
- **nestjs-best-practices** - Backend JWT implementation
