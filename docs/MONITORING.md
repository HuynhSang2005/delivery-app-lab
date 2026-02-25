# Logship-MVP: Monitoring & Observability

**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Status:** Draft  
**Owner:** DevOps Team

---

## 1. Monitoring Overview

### 1.1. Three Pillars of Observability

**Metrics:**
- Numerical data over time
- Performance trends
- Business KPIs

**Logs:**
- Event records
- Debug information
- Audit trails

**Traces:**
- Request flow
- Latency breakdown
- Dependency mapping

### 1.2. Monitoring Goals

**Technical:**
- System health visibility
- Early issue detection
- Performance optimization
- Capacity planning

**Business:**
- User behavior insights
- Conversion tracking
- Revenue monitoring
- Operational efficiency

---

## 2. Metrics

### 2.1. Infrastructure Metrics

**Server Metrics:**
```yaml
CPU Usage:
  - metric: cpu_usage_percent
  - warning: > 70%
  - critical: > 90%

Memory Usage:
  - metric: memory_usage_percent
  - warning: > 80%
  - critical: > 95%

Disk Usage:
  - metric: disk_usage_percent
  - warning: > 80%
  - critical: > 90%

Network:
  - metric: network_io_bytes
  - warning: > 100MB/s
  - critical: > 500MB/s
```

**Database Metrics (Neon PostgreSQL):**
```yaml
Connection Count:
  - metric: db_connections_active
  - warning: > 80
  - critical: > 95

Query Performance:
  - metric: db_query_duration_ms
  - warning: p95 > 100ms
  - critical: p95 > 500ms

Deadlocks:
  - metric: db_deadlocks_count
  - warning: > 0
  - critical: > 5/min

Cache Hit Ratio:
  - metric: db_cache_hit_ratio
  - warning: < 95%
  - critical: < 90%
```

**Redis Metrics:**
```yaml
Memory Usage:
  - metric: redis_memory_used_bytes
  - warning: > 80%
  - critical: > 95%

Hit Rate:
  - metric: redis_keyspace_hits
  - warning: < 90%
  - critical: < 80%

Connections:
  - metric: redis_connected_clients
  - warning: > 100
  - critical: > 200
```

### 2.2. Application Metrics

**API Performance:**
```yaml
Response Time:
  - metric: http_request_duration_ms
  - dimensions: endpoint, method, status
  - SLO: p95 < 200ms
  - SLA: p99 < 500ms

Request Rate:
  - metric: http_requests_per_second
  - dimensions: endpoint
  - baseline: 100 req/s

Error Rate:
  - metric: http_errors_per_second
  - dimensions: status_code
  - SLO: < 0.1%
  - SLA: < 1%

Throughput:
  - metric: http_requests_total
  - aggregation: per minute
```

**Business Metrics:**
```yaml
Orders:
  - metric: orders_created_total
  - dimensions: status, district
  - aggregation: per hour

Active Users:
  - metric: active_users_count
  - dimensions: user_type
  - window: 5 minutes

Driver Utilization:
  - metric: driver_utilization_percent
  - calculation: active_drivers / total_drivers
  - target: > 60%

Revenue:
  - metric: revenue_vnd
  - dimensions: order_type
  - aggregation: per day
```

### 2.3. Mobile App Metrics

**Performance:**
```yaml
App Launch Time:
  - metric: app_launch_duration_ms
  - target: < 3 seconds
  - critical: > 5 seconds

Screen Load Time:
  - metric: screen_load_duration_ms
  - target: < 1 second
  - critical: > 3 seconds

API Response Time (Mobile):
  - metric: mobile_api_duration_ms
  - target: p95 < 1 second
  - critical: p95 > 3 seconds

Crash Rate:
  - metric: app_crashes_per_session
  - target: < 1%
  - critical: > 5%
```

**User Engagement:**
```yaml
Daily Active Users (DAU):
  - metric: dau_count
  - target: growth 10% week-over-week

Session Duration:
  - metric: session_duration_seconds
  - average: 5 minutes

Retention:
  - metric: user_retention_day_7
  - target: > 40%
  - metric: user_retention_day_30
  - target: > 20%
```

---

## 3. Logging

### 3.1. Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,  // Development only
  INFO = 1,   // Normal operations
  WARN = 2,   // Warning conditions
  ERROR = 3,  // Error conditions
  FATAL = 4,  // System failure
}
```

### 3.2. Log Format

**Structured JSON:**
```json
{
  "timestamp": "2026-02-13T10:30:00.000Z",
  "level": "info",
  "service": "api",
  "environment": "production",
  "trace_id": "abc123",
  "span_id": "def456",
  "user_id": "uid_789",
  "event": "order.created",
  "message": "Order created successfully",
  "context": {
    "order_id": "ORD-123456",
    "customer_id": "uid_789",
    "driver_id": null,
    "amount": 80000,
    "distance_km": 10
  },
  "metadata": {
    "ip": "192.168.1.1",
    "user_agent": "LogshipApp/1.0",
    "request_id": "req_abc123",
    "duration_ms": 150
  }
}
```

### 3.3. Log Categories

**Application Logs:**
```typescript
// Order lifecycle
logger.info('order.created', { orderId, customerId, amount });
logger.info('order.assigned', { orderId, driverId });
logger.info('order.completed', { orderId, duration });

// Driver actions
logger.info('driver.location.updated', { driverId, location });
logger.warn('driver.cancelled.order', { driverId, orderId, reason });

// Errors
logger.error('payment.failed', { orderId, error });
logger.error('database.connection.lost', { retry_count });
```

**Security Logs:**
```typescript
// Authentication
logger.info('auth.login.success', { userId, method: 'phone' });
logger.warn('auth.login.failed', { phone, reason: 'invalid_otp' });
logger.warn('auth.suspicious.activity', { userId, ip, reason });

// Authorization
logger.error('auth.forbidden', { userId, resource, action });
logger.info('auth.role.changed', { userId, oldRole, newRole });
```

**Audit Logs:**
```typescript
// Data changes
logger.info('audit.order.updated', { 
  orderId, 
  changedBy, 
  changes: { status: { from: 'pending', to: 'assigned' } }
});

// Admin actions
logger.info('audit.admin.user_banned', { adminId, userId, reason });
```

### 3.4. Log Retention

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Application | 30 days | Hot storage |
| Security | 7 years | Cold storage |
| Audit | 7 years | Cold storage |
| Debug | 7 days | Ephemeral |

---

## 4. Tracing

### 4.1. Distributed Tracing

**Trace Structure:**
```
Trace: order-creation-flow
├── Span: POST /api/orders (150ms)
│   ├── Span: validate-input (5ms)
│   ├── Span: calculate-price (10ms)
│   ├── Span: save-to-database (50ms)
│   │   └── Span: db-query (30ms)
│   ├── Span: find-driver (80ms)
│   │   ├── Span: query-available (40ms)
│   │   ├── Span: calculate-distance (20ms)
│   │   └── Span: send-notification (20ms)
│   └── Span: return-response (5ms)
```

### 4.2. Trace Context

**Propagation:**
```typescript
// Incoming request
const traceId = req.headers['x-trace-id'] || generateTraceId();
const spanId = generateSpanId();

// Outgoing request
headers['x-trace-id'] = traceId;
headers['x-span-id'] = spanId;
headers['x-parent-span-id'] = parentSpanId;
```

### 4.3. Key Traces

**Critical Flows:**
- Order creation → Assignment → Completion
- User registration → Verification → Onboarding
- Driver matching algorithm
- Payment processing (future)
- Chat message flow

---

## 5. Alerting

### 5.1. Alert Severity

**P0 - Critical (Page immediately):**
- Production down
- Database unreachable
- Error rate > 10%
- Data breach detected

**P1 - High (Page within 15 min):**
- Error rate > 1%
- Response time > 2s (p95)
- Database connections > 90%
- Memory usage > 90%

**P2 - Medium (Slack notification):**
- Error rate > 0.1%
- Response time > 500ms (p95)
- Failed deployments
- Certificate expiring (< 7 days)

**P3 - Low (Daily digest):**
- Disk usage > 80%
- Deprecated API usage
- Security scan findings (low)

### 5.2. Alert Rules

**Backend API:**
```yaml
alert: HighErrorRate
condition: error_rate > 1% for 5m
severity: P1
notification: pagerduty + slack
runbook: https://wiki.internal/runbooks/high-error-rate

alert: SlowAPI
condition: p95_latency > 2s for 10m
severity: P1
notification: slack
runbook: https://wiki.internal/runbooks/slow-api

alert: DatabaseConnectionsHigh
condition: db_connections > 90
severity: P1
notification: pagerduty
runbook: https://wiki.internal/runbooks/db-connections
```

**Mobile App:**
```yaml
alert: HighCrashRate
condition: crash_rate > 5%
severity: P0
notification: pagerduty + slack

alert: SlowAppLaunch
condition: p95_launch_time > 5s
severity: P2
notification: slack
```

**Business:**
```yaml
alert: NoOrders
condition: orders_per_hour == 0 for 1h
severity: P1
notification: slack

alert: DriverShortage
condition: available_drivers < 5
severity: P2
notification: slack
```

### 5.3. On-Call Rotation

**Schedule:**
- Primary: Week 1 (DevOps Engineer)
- Secondary: Week 2 (Backend Lead)
- Shadow: Week 3 (New team member)

**Handoff:**
- Monday 9:00 AM
- Document active incidents
- Review weekend alerts
- Update runbooks

---

## 6. Dashboards

### 6.1. Executive Dashboard

**Business Health:**
- Daily Active Users (DAU)
- Orders per day
- Revenue per day
- Customer satisfaction (CSAT)
- Driver retention rate

**System Health:**
- Uptime percentage
- Average response time
- Error rate
- Active incidents

### 6.2. Technical Dashboard

**API Performance:**
- Request rate (req/s)
- Response time percentiles (p50, p95, p99)
- Error rate by endpoint
- Top 10 slowest endpoints

**Infrastructure:**
- CPU/Memory/Disk usage
- Database connections
- Redis memory usage
- Queue depth (BullMQ)

**Mobile:**
- App crashes by version
- ANR (Application Not Responding) rate
- API latency from mobile
- Session duration

### 6.3. Operations Dashboard

**Real-time Operations:**
- Active orders
- Available drivers
- Orders by status
- Average delivery time
- Cancelled orders

**Driver Metrics:**
- Online drivers
- Driver locations (map)
- Driver ratings
- Driver earnings

---

## 7. Tools & Services

### 7.1. Recommended Stack

**Metrics:**
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Datadog** - Alternative (paid, easier)

**Logs:**
- **Loki** - Log aggregation (Grafana stack)
- **ELK Stack** - Alternative (Elasticsearch)
- **Datadog** - Alternative (paid)

**Traces:**
- **Jaeger** - Distributed tracing
- **Tempo** - Alternative (Grafana stack)
- **Datadog APM** - Alternative (paid)

**Alerting:**
- **PagerDuty** - Incident management
- **Slack** - Notifications
- **Opsgenie** - Alternative

### 7.2. Implementation Priority

**Phase 1 (MVP):**
- ✅ Application logs (console + file)
- ✅ Basic metrics (API response time, error rate)
- ✅ Simple alerting (Slack)

**Phase 2 (Post-MVP):**
- ⬜ Prometheus + Grafana
- ⬜ Centralized logging (Loki)
- ⬜ PagerDuty integration
- ⬜ Custom dashboards

**Phase 3 (Scale):**
- ⬜ Distributed tracing (Jaeger)
- ⬜ Advanced analytics
- ⬜ ML-based anomaly detection

---

## 8. Implementation

### 8.1. NestJS Metrics

```typescript
// metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private httpDuration = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration',
    labelNames: ['method', 'route'],
    buckets: [50, 100, 200, 500, 1000, 2000],
  });

  recordRequest(method: string, route: string, status: number) {
    this.httpRequests.inc({ method, route, status });
  }

  recordDuration(method: string, route: string, duration: number) {
    this.httpDuration.observe({ method, route }, duration);
  }
}
```

### 8.2. Logging Configuration

```typescript
// logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

### 8.3. Health Checks

> **Note:** Project uses Prisma ORM (NOT TypeORM). Health check uses raw Prisma query to verify database connectivity.

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      // Prisma / Database health
      async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
      // Redis health
      async () => {
        await this.redis.ping();
        return { redis: { status: 'up' } };
      },
    ]);
  }
}
```

---

## 9. SLOs & SLAs

### 9.1. Service Level Objectives

**API Availability:**
- SLO: 99.5% uptime
- Measurement: 30-day rolling window

**API Performance:**
- SLO: p95 latency < 200ms
- SLO: p99 latency < 500ms
- Measurement: Per endpoint

**Error Rate:**
- SLO: < 0.1% error rate
- Measurement: 5-minute window

### 9.2. Error Budget

**Calculation:**
- Error budget = 100% - SLO
- For 99.5% SLO: 0.5% error budget
- Monthly: 0.5% of 43,200 minutes = 216 minutes downtime

**Policy:**
- If error budget > 50% consumed: Freeze new features
- If error budget > 75% consumed: All hands on reliability
- If error budget exhausted: Stop deployments

---

## 10. Incident Response

### 10.1. Incident Severity

**SEV 1 - Critical:**
- Complete system outage
- Data loss or corruption
- Security breach
- Response: Immediate (15 min)

**SEV 2 - High:**
- Major feature degraded
- Significant performance impact
- Response: 1 hour

**SEV 3 - Medium:**
- Minor feature issues
- Workarounds available
- Response: 4 hours

**SEV 4 - Low:**
- Cosmetic issues
- Response: 24 hours

### 10.2. Incident Workflow

1. **Detection:** Alert or user report
2. **Triage:** Assess severity and impact
3. **Response:** Execute runbook
4. **Communication:** Update stakeholders
5. **Resolution:** Fix and verify
6. **Post-mortem:** Document and learn

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [CI_CD.md](./CI_CD.md) | Deployment pipeline |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Infrastructure |
| [SECURITY.md](./SECURITY.md) | Security monitoring |
| [RISK_MANAGEMENT.md](./RISK_MANAGEMENT.md) | Risk tracking |

---

**Last Updated:** February 13, 2026  
**Next Review:** Monthly  
**Monitoring Owner:** DevOps Team  
**Contact:** devops@logship.vn
