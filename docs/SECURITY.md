# Logship-MVP: Security Architecture Document

**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Status:** Draft  
**Owner:** Security Team

---

## 1. Security Overview

### 1.1. Security Principles

**Defense in Depth:**
- Multiple layers of security controls
- No single point of failure
- Assume breach mentality

**Least Privilege:**
- Users and services have minimum necessary permissions
- Role-based access control (RBAC)
- Regular permission audits

**Secure by Default:**
- All connections encrypted (TLS 1.3)
- Strong authentication required
- Security headers enabled

### 1.2. Threat Model

**STRIDE Analysis:**

| Threat | Component | Risk Level | Mitigation |
|--------|-----------|------------|------------|
| **Spoofing** | User authentication | High | Firebase Auth + JWT |
| **Tampering** | API requests | High | HTTPS + Request signing |
| **Repudiation** | Order transactions | Medium | Audit logs + Digital signatures |
| **Information Disclosure** | Database | High | Encryption + Access controls |
| **Denial of Service** | API endpoints | High | Rate limiting + CDN |
| **Elevation of Privilege** | Admin functions | Critical | RBAC + MFA |

---

## 2. Authentication & Authorization

### 2.1. Authentication Architecture

**Firebase Authentication Flow:**

```
User (Mobile/Web)
    ↓
Firebase Auth (Phone OTP)
    ↓
Firebase ID Token (JWT)
    ↓
Backend API (NestJS)
    ↓
Verify Token + Create Session
    ↓
Access Protected Resources
```

**Token Lifecycle:**
- **ID Token:** 1 hour expiration
- **Refresh Token:** 30 days
- **Custom Claims:** Role (customer, driver, admin)

### 2.2. JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "kid": "...",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://securetoken.google.com/logship-mvp",
    "aud": "logship-mvp",
    "auth_time": 1707811200,
    "user_id": "uid_123",
    "sub": "uid_123",
    "iat": 1707811200,
    "exp": 1707814800,
    "phone_number": "+84123456789",
    "firebase": {
      "identities": {
        "phone": ["+84123456789"]
      },
      "sign_in_provider": "phone"
    },
    "role": "customer"
  }
}
```

### 2.3. Authorization Matrix

| Role | Orders | Drivers | Users | Admin | Reports |
|------|--------|---------|-------|-------|---------|
| **Customer** | Create, View own | View assigned | View own | ❌ | ❌ |
| **Driver** | View assigned, Update | View own | View own | ❌ | View own |
| **Admin** | Full access | Full access | Full access | Full access | Full access |

**Permission Granularity:**
- `orders:create` - Create new order
- `orders:read:own` - Read own orders
- `orders:read:all` - Read all orders (admin)
- `orders:update:status` - Update order status
- `drivers:read` - View driver profiles
- `admin:full` - Full admin access

### 2.4. Multi-Factor Authentication (MFA)

**Admin Accounts:**
- ✅ Mandatory MFA (TOTP)
- ✅ IP whitelist for admin panel
- ✅ Session timeout: 30 minutes
- ✅ Concurrent session limit: 1

**Driver Onboarding:**
- ✅ Phone verification (OTP)
- ✅ Identity verification (ID card)
- ✅ Background check

---

## 3. Data Protection

### 3.1. Data Classification

**PII (Personally Identifiable Information):**
- Phone numbers
- Full names
- ID card numbers (drivers)
- Location data (real-time tracking)
- **Protection:** Encryption at rest + in transit

**Sensitive Data:**
- Payment information
- Order history
- Chat messages
- **Protection:** Encryption + Access logging

**Public Data:**
- Order status (anonymized)
- Driver ratings
- **Protection:** Rate limiting

### 3.2. Encryption Standards

**At Rest:**
- **Database:** AES-256 (Neon PostgreSQL)
- **Files:** AES-256 (Cloudinary)
- **Cache:** Encrypted Redis
- **Backups:** AES-256 + GPG

**In Transit:**
- **API:** TLS 1.3 (minimum TLS 1.2)
- **Mobile:** Certificate pinning
- **Web:** HSTS enabled
- **WebSocket:** WSS (WebSocket Secure)

**Key Management:**
- **Firebase:** Managed by Google
- **Neon:** Managed by Neon
- **Application secrets:** Environment variables
- **Never commit secrets to repository**

### 3.3. Database Security

**Access Controls:**
```sql
-- Row Level Security (RLS) enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own orders
CREATE POLICY customer_orders ON orders
  FOR SELECT
  USING (customer_id = current_user_id());

-- Drivers can only see assigned orders
CREATE POLICY driver_orders ON orders
  FOR SELECT
  USING (driver_id = current_user_id());

-- Admins can see all
CREATE POLICY admin_orders ON orders
  FOR SELECT
  TO admin_role
  USING (true);
```

**Field-Level Encryption:**
- Phone numbers: Hashed (bcrypt)
- ID numbers: Encrypted (AES-256)
- Location history: Encrypted at rest

---

## 4. API Security

### 4.1. Rate Limiting

**Tiered Rate Limits:**

| Endpoint | Anonymous | Customer | Driver | Admin |
|----------|-----------|----------|--------|-------|
| **Auth** | 5 req/min | 10 req/min | 10 req/min | 20 req/min |
| **Orders** | ❌ | 30 req/min | 60 req/min | 100 req/min |
| **Location** | ❌ | 2 req/min | 30 req/min | ❌ |
| **Admin** | ❌ | ❌ | ❌ | 100 req/min |

**Implementation:**
```typescript
// @nestjs/throttler configuration
ThrottlerModule.forRoot({
  throttlers: [
    {
      name: 'default',
      ttl: 60000, // 1 minute
      limit: 30,
    },
    {
      name: 'location',
      ttl: 60000,
      limit: 2,
    },
  ],
});
```

### 4.2. Input Validation

**Zod Schema Validation:**
```typescript
const createOrderSchema = z.object({
  pickupAddress: z.string().min(10).max(500),
  dropoffAddress: z.string().min(10).max(500),
  pickupLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  packageWeight: z.number().min(0.1).max(50), // kg
  notes: z.string().max(1000).optional(),
});
```

**Sanitization:**
- XSS prevention (escape HTML)
- SQL injection prevention (parameterized queries)
- NoSQL injection prevention (schema validation)
- Command injection prevention (input sanitization)

### 4.3. CORS Policy

```typescript
// CORS configuration
app.enableCors({
  origin: [
    'https://admin.logship.vn',
    'https://logship-mvp.vercel.app',
    'capacitor://localhost', // Mobile app
    'http://localhost:3000', // Development
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});
```

### 4.4. Security Headers

```typescript
// Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'same-origin' },
}));
```

---

## 5. Mobile App Security

### 5.1. Certificate Pinning

```typescript
// React Native certificate pinning
const pinning = {
  'api.logship.vn': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary cert
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup cert
  ],
};

// TrustKit configuration (iOS)
[kTSKPinnedDomains]: @{
  @"api.logship.vn": @{
    kTSKEnforcePinning: @YES,
    kTSKIncludeSubdomains: @YES,
    kTSKPublicKeyHashes: @[
      @"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      @"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
    ],
  },
};
```

### 5.2. Secure Storage

```typescript
// React Native Keychain/Keystore
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
async function storeToken(token: string) {
  await SecureStore.setItemAsync('auth_token', token, {
    keychainService: 'com.logship.auth',
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

// Retrieve
async function getToken() {
  return await SecureStore.getItemAsync('auth_token');
}
```

### 5.3. Root/Jailbreak Detection

```typescript
// Jailbreak detection (iOS)
import JailMonkey from 'jail-monkey';

if (JailMonkey.isJailBroken()) {
  // Alert user or block app
  Alert.alert(
    'Security Warning',
    'This app cannot run on jailbroken devices for security reasons.'
  );
}

// Root detection (Android)
import { isRooted } from 'react-native-root-detection';

if (await isRooted()) {
  // Block app
}
```

---

## 6. Secrets Management

### 6.1. Environment Variables

**Required Variables:**
```bash
# Database
DATABASE_URL="postgresql://..."

# Firebase
FIREBASE_PROJECT_ID="logship-mvp"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Note: JWT tokens are verified via Firebase Admin SDK (RS256), not a shared secret.

# API Keys
GOONG_API_KEY="..."
CLOUDINARY_API_KEY="..."

# Encryption
ENCRYPTION_KEY="32-char-hex-key"
```

**Security Rules:**
- ✅ Never commit `.env` files
- ✅ Use different secrets per environment
- ✅ Rotate secrets quarterly
- ✅ Use secret manager for production (AWS Secrets Manager, Azure Key Vault)

### 6.2. Git Secrets Prevention

```bash
# Install git-secrets
brew install git-secrets

# Setup hooks
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add 'api[_-]?key\s*=\s*.+'
git secrets --add 'private[_-]?key\s*=\s*.+'
```

---

## 7. Incident Response

### 7.1. Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 - Critical** | System down or data breach | 15 minutes | Database exposed, mass account takeover |
| **P1 - High** | Major functionality impaired | 1 hour | Payment system down, auth failures |
| **P2 - Medium** | Minor functionality issues | 4 hours | Slow API, intermittent errors |
| **P3 - Low** | Cosmetic issues | 24 hours | UI bugs, logging issues |

### 7.2. Incident Response Procedure

**1. Detection (0-5 min):**
- Automated alerts (PagerDuty, Opsgenie)
- Monitoring dashboards
- User reports

**2. Assessment (5-15 min):**
- Determine severity
- Identify affected systems
- Assess impact scope

**3. Containment (15-30 min):**
- Isolate affected systems
- Block malicious traffic
- Enable maintenance mode if needed

**4. Eradication (30 min - 2 hours):**
- Remove threat
- Patch vulnerabilities
- Reset compromised credentials

**5. Recovery (2-4 hours):**
- Restore services
- Verify functionality
- Monitor for recurrence

**6. Post-Incident (24-48 hours):**
- Root cause analysis
- Incident report
- Process improvements

### 7.3. Security Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Security Lead** | security@logship.vn | Overall security |
| **On-Call Engineer** | oncall@logship.vn | Incident response |
| **DevOps** | devops@logship.vn | Infrastructure |
| **Legal** | legal@logship.vn | Compliance |

---

## 8. Security Testing

### 8.1. Security Test Plan

**Static Analysis:**
- SAST (SonarQube, CodeQL)
- Dependency scanning (Snyk, npm audit)
- Secret scanning (git-secrets, truffleHog)

**Dynamic Analysis:**
- DAST (OWASP ZAP)
- Penetration testing (quarterly)
- Fuzz testing

**Mobile Security:**
- MobSF (Mobile Security Framework)
- iOS: Otool, Class-dump
- Android: APKTool, JADX

### 8.2. Penetration Testing Scope

**Quarterly Pentest:**
- Authentication bypass
- Authorization flaws
- Injection attacks (SQL, NoSQL, Command)
- XSS and CSRF
- Business logic flaws
- API security
- Mobile app security

**Annual Red Team:**
- Full infrastructure assessment
- Social engineering
- Physical security (if applicable)

### 8.3. Vulnerability Management

**Severity Levels:**
- **Critical:** Patch within 24 hours
- **High:** Patch within 7 days
- **Medium:** Patch within 30 days
- **Low:** Patch within 90 days

**Process:**
1. Discovery (automated scanning + manual testing)
2. Assessment (severity + impact)
3. Prioritization (business risk)
4. Remediation (patch/fix)
5. Verification (retest)
6. Documentation (lessons learned)

---

## 9. Compliance & Auditing

### 9.1. Audit Logging

**Logged Events:**
- Authentication (success/failure)
- Authorization changes
- Data access (PII)
- Order modifications
- Admin actions
- Security events

**Log Format:**
```json
{
  "timestamp": "2026-02-13T10:30:00Z",
  "level": "info",
  "event": "order.created",
  "userId": "uid_123",
  "ip": "192.168.1.1",
  "userAgent": "LogshipApp/1.0",
  "details": {
    "orderId": "ORD-123456",
    "pickup": "Quận 10",
    "dropoff": "Quận 1"
  }
}
```

**Log Retention:**
- Application logs: 90 days
- Security logs: 7 years
- Audit logs: 7 years

### 9.2. Compliance Checklist

**Data Protection:**
- [ ] Privacy policy published
- [ ] User consent obtained
- [ ] Data retention policy defined
- [ ] Right to deletion implemented
- [ ] Data breach notification procedure

**Security Standards:**
- [ ] OWASP Top 10 addressed
- [ ] Security headers implemented
- [ ] TLS 1.3 enforced
- [ ] Secrets management implemented
- [ ] Regular security assessments

**Operational:**
- [ ] Incident response plan
- [ ] Disaster recovery plan
- [ ] Business continuity plan
- [ ] Regular backups tested
- [ ] Access reviews quarterly

---

## 10. Security Checklist

### Pre-Launch Security Checklist

**Authentication & Authorization:**
- [ ] Firebase Auth configured securely
- [ ] JWT validation implemented
- [ ] RBAC implemented
- [ ] Admin MFA enabled
- [ ] Session management secure

**Data Protection:**
- [ ] Database encryption at rest
- [ ] TLS 1.3 for all connections
- [ ] PII fields encrypted
- [ ] Secure backup procedures
- [ ] Data retention policy implemented

**API Security:**
- [ ] Rate limiting enabled
- [ ] Input validation (Zod)
- [ ] CORS configured
- [ ] Security headers (Helmet)
- [ ] API versioning strategy

**Mobile Security:**
- [ ] Certificate pinning
- [ ] Secure storage (Keychain/Keystore)
- [ ] Root/jailbreak detection
- [ ] Code obfuscation
- [ ] App attestation

**Infrastructure:**
- [ ] Secrets in environment variables
- [ ] No secrets in repository
- [ ] Database RLS enabled
- [ ] Network segmentation
- [ ] DDoS protection

**Monitoring:**
- [ ] Security monitoring enabled
- [ ] Alerting configured
- [ ] Audit logging enabled
- [ ] Log aggregation setup
- [ ] Incident response tested

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md) | Business context |
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | Architecture |
| [02-Database-Design-Document.md](./02-Database-Design-Document.md) | Database security |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API security |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Infrastructure security |

---

**Last Updated:** February 13, 2026  
**Next Review:** Monthly  
**Security Contact:** security@logship.vn
