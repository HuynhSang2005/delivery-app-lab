---
name: vietnam-phone-validation
description: Use when validating Vietnamese phone numbers for Firebase Phone Auth, formatting numbers to E.164 standard, and identifying mobile carriers (Viettel, Mobifone, Vinaphone, etc.).
---

# Vietnam Phone Number Validation

## Overview

Validation and formatting utilities for Vietnamese mobile phone numbers. Supports all major carriers (Viettel, Mobifone, Vinaphone, Vietnamobile, Gmobile), formats to E.164 standard for Firebase Phone Auth, and validates number structure.

## When to Use

**Use this skill when:**
- Validating phone numbers in registration forms
- Formatting numbers for Firebase Phone Auth
- Identifying mobile carriers
- Normalizing user input
- Implementing SMS OTP flows

**Don't use when:**
- Validating landline numbers (different patterns)
- International numbers outside Vietnam
- Non-mobile phone validation

## Core Patterns

### Pattern 1: Phone Number Validation

```typescript
// src/utils/phone-validation.ts

export interface PhoneValidationResult {
  valid: boolean;
  formatted?: string; // E.164 format: +84xxxxxxxxxx
  carrier?: string;
  error?: string;
}

// Vietnamese mobile number prefixes by carrier
const CARRIER_PREFIXES: Record<string, string[]> = {
  Viettel: ['032', '033', '034', '035', '036', '037', '038', '039', '096', '097', '098', '086'],
  Vinaphone: ['081', '082', '083', '084', '085', '088', '091', '094'],
  Mobifone: ['070', '076', '077', '078', '079', '089', '090', '093'],
  Vietnamobile: ['052', '056', '058', '092'],
  Gmobile: ['059', '099'],
};

// Main validation function
export function validateVietnamPhone(phone: string): PhoneValidationResult {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if empty
  if (!digits) {
    return { valid: false, error: 'Vui lòng nhập số điện thoại' };
  }

  // Handle different input formats
  let normalized = digits;

  // If starts with 84 and has 11 digits, it's already in international format
  if (digits.startsWith('84') && digits.length === 11) {
    normalized = digits;
  }
  // If starts with 0 and has 10 digits, convert to international
  else if (digits.startsWith('0') && digits.length === 10) {
    normalized = '84' + digits.slice(1);
  }
  // If no prefix and has 9 digits, assume missing country code
  else if (digits.length === 9 && !digits.startsWith('0')) {
    normalized = '84' + digits;
  }
  // Invalid length
  else {
    return { valid: false, error: 'Số điện thoại không hợp lệ (cần 10 số)' };
  }

  // Validate the normalized number
  const isValid = isValidVietnamMobile(normalized);

  if (!isValid) {
    return { valid: false, error: 'Số điện thoại không hợp lệ' };
  }

  // Identify carrier
  const carrier = identifyCarrier(normalized);

  // Format to E.164
  const formatted = '+' + normalized;

  return { valid: true, formatted, carrier };
}

// Validate normalized number (84xxxxxxxxxx format)
function isValidVietnamMobile(normalized: string): boolean {
  // Must be 11 digits starting with 84
  if (!/^84\d{9}$/.test(normalized)) {
    return false;
  }

  // Extract prefix (first 2 digits after 84)
  const prefix = normalized.slice(2, 4);

  // Check if it's a valid mobile prefix
  const validPrefixes = Object.values(CARRIER_PREFIXES).flat();
  return validPrefixes.includes('0' + prefix) || validPrefixes.includes(prefix);
}

// Identify carrier from normalized number
function identifyCarrier(normalized: string): string {
  // Get first 3 digits after country code
  const prefix3 = '0' + normalized.slice(2, 4);

  for (const [carrier, prefixes] of Object.entries(CARRIER_PREFIXES)) {
    if (prefixes.includes(prefix3)) {
      return carrier;
    }
  }

  return 'Unknown';
}
```

### Pattern 2: React Hook for Phone Input

```typescript
// src/hooks/usePhoneInput.ts
import { useState, useCallback } from 'react';
import { validateVietnamPhone, PhoneValidationResult } from '@/utils/phone-validation';

interface UsePhoneInputReturn {
  value: string;
  setValue: (value: string) => void;
  formatted: string;
  isValid: boolean;
  carrier?: string;
  error?: string;
  validate: () => PhoneValidationResult;
}

export function usePhoneInput(initialValue = ''): UsePhoneInputReturn {
  const [value, setValue] = useState(initialValue);
  const [validation, setValidation] = useState<PhoneValidationResult>({
    valid: false,
  });

  const handleChange = useCallback((newValue: string) => {
    // Allow only digits, spaces, and +-
    const cleaned = newValue.replace(/[^\d\s\-+]/g, '');
    setValue(cleaned);

    // Auto-validate on change if length is sufficient
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length >= 9) {
      const result = validateVietnamPhone(cleaned);
      setValidation(result);
    } else {
      setValidation({ valid: false });
    }
  }, []);

  const validate = useCallback(() => {
    const result = validateVietnamPhone(value);
    setValidation(result);
    return result;
  }, [value]);

  return {
    value,
    setValue: handleChange,
    formatted: validation.formatted || '',
    isValid: validation.valid,
    carrier: validation.carrier,
    error: validation.error,
    validate,
  };
}
```

### Pattern 3: Phone Input Component

```tsx
// src/components/PhoneInput.tsx
import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { usePhoneInput } from '@/hooks/usePhoneInput';

interface PhoneInputProps {
  onValidPhone: (formatted: string, carrier?: string) => void;
  placeholder?: string;
}

export function PhoneInput({ onValidPhone, placeholder = 'Nhập số điện thoại' }: PhoneInputProps) {
  const { value, setValue, isValid, formatted, carrier, error } = usePhoneInput();

  const handleBlur = () => {
    if (isValid) {
      onValidPhone(formatted, carrier);
    }
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={setValue}
        onBlur={handleBlur}
        placeholder={placeholder}
        keyboardType="phone-pad"
        maxLength={15}
        style={{
          borderWidth: 1,
          borderColor: error ? 'red' : isValid ? 'green' : '#ccc',
          padding: 12,
          borderRadius: 8,
          fontSize: 16,
        }}
      />
      
      {carrier && (
        <Text style={{ color: '#666', marginTop: 4, fontSize: 12 }}>
          Nhà mạng: {carrier}
        </Text>
      )}
      
      {error && (
        <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>
          {error}
        </Text>
      )}
      
      {isValid && (
        <Text style={{ color: 'green', marginTop: 4, fontSize: 12 }}>
          ✓ Số điện thoại hợp lệ
        </Text>
      )}
    </View>
  );
}
```

### Pattern 4: Firebase Phone Auth Integration

```typescript
// src/services/firebase-phone-auth.ts
import auth from '@react-native-firebase/auth';
import { validateVietnamPhone } from '@/utils/phone-validation';

export class FirebasePhoneAuth {
  private confirmationResult: any = null;

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    // Validate and format phone number
    const validation = validateVietnamPhone(phoneNumber);
    
    if (!validation.valid || !validation.formatted) {
      return { success: false, error: validation.error };
    }

    try {
      // Send OTP using formatted E.164 number
      this.confirmationResult = await auth().signInWithPhoneNumber(
        validation.formatted
      );
      
      return { success: true };
    } catch (error: any) {
      console.error('Firebase OTP Error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        return { success: false, error: 'Số điện thoại không hợp lệ' };
      }
      if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' };
      }
      
      return { success: false, error: 'Không thể gửi mã OTP. Vui lòng thử lại.' };
    }
  }

  async verifyOTP(code: string): Promise<{ 
    success: boolean; 
    user?: any; 
    token?: string;
    error?: string;
  }> {
    if (!this.confirmationResult) {
      return { success: false, error: 'Không có yêu cầu xác thực' };
    }

    try {
      const result = await this.confirmationResult.confirm(code);
      const token = await result.user.getIdToken();
      
      return {
        success: true,
        user: result.user,
        token,
      };
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        return { success: false, error: 'Mã xác thực không đúng' };
      }
      
      return { success: false, error: 'Xác thực thất bại. Vui lòng thử lại.' };
    }
  }

  // Auto-verification for Android
  onAuthStateChanged(callback: (user: any, token?: string) => void) {
    return auth().onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        callback(user, token);
      } else {
        callback(null);
      }
    });
  }
}
```

## Carrier Prefix Reference

| Carrier | Prefixes |
|---------|----------|
| **Viettel** | 032, 033, 034, 035, 036, 037, 038, 039, 096, 097, 098, 086 |
| **Vinaphone** | 081, 082, 083, 084, 085, 088, 091, 094 |
| **Mobifone** | 070, 076, 077, 078, 079, 089, 090, 093 |
| **Vietnamobile** | 052, 056, 058, 092 |
| **Gmobile** | 059, 099 |

## Validation Rules

| Format | Example | Valid |
|--------|---------|-------|
| National (10 digits) | 0912345678 | ✓ |
| With spaces | 091 234 5678 | ✓ (normalized) |
| International | +84912345678 | ✓ |
| International (no +) | 84912345678 | ✓ |
| Missing leading 0 | 912345678 | ✓ (auto-corrected) |
| 9 digits only | 91234567 | ✗ |
| 11 digits | 09123456789 | ✗ |
| Invalid prefix | 0112345678 | ✗ |

## Quick Reference

| Task | Function |
|------|----------|
| Validate | `validateVietnamPhone(phone)` |
| Format to E.164 | Result includes `formatted` field |
| Get carrier | Result includes `carrier` field |
| Extract digits | `phone.replace(/\D/g, '')` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not normalizing input | Always remove non-digits first |
| Forgetting E.164 format | Firebase requires +84 prefix |
| Missing carrier validation | Some prefixes are invalid |
| Not handling auto-verification | Implement onAuthStateChanged |
| Storing formatted number | Store normalized, display formatted |

## Dependencies

```json
{
  "dependencies": {
    "@react-native-firebase/auth": "^22.0.0"
  }
}
```

## Related Skills

- **firebase-auth** - Firebase Phone Auth implementation
- **react-hook-form** - Form validation integration
