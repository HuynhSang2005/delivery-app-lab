# Logship-MVP: CI/CD Pipeline

**Version:** 1.0  
**Last Updated:** February 13, 2026  
**Status:** Draft  
**Owner:** DevOps Team

---

## 1. CI/CD Overview

### 1.1. Pipeline Philosophy

**Continuous Integration:**
- Code changes automatically built and tested
- Fast feedback loop (< 10 minutes)
- Quality gates before merge

**Continuous Deployment:**
- Automated deployment to staging
- Manual approval for production
- Zero-downtime deployments

### 1.2. Pipeline Stages

```
Code Push → Build → Test → Security Scan → Deploy Staging → E2E Tests → Deploy Production
    ↓         ↓       ↓          ↓              ↓              ↓              ↓
  Trigger   Compile  Unit    SAST/DAST    Auto-deploy    Automated    Manual
  Webhook   Bundle   Test    Secrets      to Staging     E2E Tests    Approval
```

---

## 2. Branching Strategy

### 2.1. Git Flow

**Branch Types:**
- **main:** Production-ready code
- **develop:** Integration branch
- **feature/***: New features
- **bugfix/***: Bug fixes
- **hotfix/***: Production fixes
- **release/***: Release preparation

**Workflow:**
```bash
# Start feature
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication

# Work on feature
# ... coding ...
git add .
git commit -m "feat: add user authentication"
git push origin feature/user-authentication

# Create PR (via GitHub/GitLab)
# Code review required
# Automated tests run

# Merge to develop
# Delete feature branch

# Release
git checkout -b release/v1.0.0
git push origin release/v1.0.0
# Create PR to main
# Deploy to staging
# Manual testing
# Merge to main
# Deploy to production
```

### 2.2. Branch Protection Rules

**main branch:**
- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Include administrators
- ✅ Restrict pushes that create files larger than 100MB

**develop branch:**
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

---

## 3. CI Pipeline

### 3.1. GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Backend CI
  backend-ci:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: logship_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.9
      
      - name: Install dependencies
        working-directory: ./apps/api
        run: bun install
      
      - name: Lint
        working-directory: ./apps/api
        run: bun run lint
      
      - name: Type check
        working-directory: ./apps/api
        run: bun run typecheck
      
      - name: Test
        working-directory: ./apps/api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/logship_test
          REDIS_URL: redis://localhost:6379
        run: bun run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info
          flags: backend

  # Mobile CI
  mobile-ci:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.9
      
      - name: Install dependencies
        working-directory: ./apps/mobile
        run: bun install
      
      - name: Lint
        working-directory: ./apps/mobile
        run: bun run lint
      
      - name: Type check
        working-directory: ./apps/mobile
        run: bun run typecheck
      
      - name: Test
        working-directory: ./apps/mobile
        run: bun run test

  # Admin Web CI
  admin-ci:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.9
      
      - name: Install dependencies
        working-directory: ./apps/admin
        run: bun install
      
      - name: Lint
        working-directory: ./apps/admin
        run: bun run lint
      
      - name: Type check
        working-directory: ./apps/admin
        run: bun run typecheck
      
      - name: Build
        working-directory: ./apps/admin
        run: bun run build

  # Security Scan
  security-scan:
    runs-on: ubuntu-latest
    needs: [backend-ci, mobile-ci, admin-ci]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Secret detection
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

### 3.2. Quality Gates

**Must Pass:**
- ✅ All tests pass (unit, integration)
- ✅ Code coverage > 80%
- ✅ No lint errors
- ✅ Type checking passes
- ✅ Security scan (no critical/high vulnerabilities)
- ✅ Secret detection (no leaked secrets)

**Nice to Have:**
- 🟡 Code coverage > 90%
- 🟡 No medium vulnerabilities
- 🟡 Performance benchmarks pass

---

## 4. CD Pipeline

### 4.1. Staging Deployment

**File:** `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: railway/cli@master
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: logship-api-staging
          environment: staging
      
      - name: Run migrations
        run: |
          bunx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      
      - name: Health check
        run: |
          curl -f https://api-staging.logship.vn/health || exit 1

  deploy-admin:
    runs-on: ubuntu-latest
    needs: deploy-backend
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }}
          working-directory: ./apps/admin
```

### 4.2. Production Deployment

**File:** `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}
      
      - name: Deploy to Railway
        uses: railway/cli@master
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: logship-api
          environment: production
      
      - name: Run migrations
        run: |
          bunx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
      
      - name: Health check
        run: |
          curl -f https://api.logship.vn/health || exit 1
          
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          text: 'Production deployment ${{ github.event.inputs.version }} completed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 4.3. Deployment Approval

**Production Deployment Process:**
1. Create release branch from develop
2. Run full test suite
3. Deploy to staging
4. Manual QA testing (2 hours)
5. Create PR from release to main
6. Code review (1 approval)
7. **Manual approval required** (CTO/PM)
8. Deploy to production
9. Smoke tests
10. Monitor for 1 hour

---

## 5. Environment Strategy

### 5.1. Environment Overview

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| **Local** | Development | Mock/Sample | Developers |
| **CI** | Automated testing | Ephemeral | CI System |
| **Staging** | Pre-production | Anonymized production | Team |
| **Production** | Live system | Real | Customers |

### 5.2. Environment Variables

**Local (.env.local):**
```bash
DATABASE_URL=postgresql://localhost:5432/logship_dev
REDIS_URL=redis://localhost:6379
FIREBASE_PROJECT_ID=logship-dev
DEBUG=true
```

**Staging (.env.staging):**
```bash
DATABASE_URL=postgresql://staging.logship.vn:5432/logship_staging
REDIS_URL=redis://staging.logship.vn:6379
FIREBASE_PROJECT_ID=logship-staging
DEBUG=false
```

**Production (.env.production):**
```bash
DATABASE_URL=postgresql://prod.logship.vn:5432/logship_prod
REDIS_URL=redis://prod.logship.vn:6379
FIREBASE_PROJECT_ID=logship-mvp
DEBUG=false
```

### 5.3. Secrets Management

**GitHub Secrets:**
- `RAILWAY_TOKEN` - Railway deployment
- `VERCEL_TOKEN` - Vercel deployment
- `DATABASE_URL_STAGING` - Staging DB
- `DATABASE_URL_PRODUCTION` - Production DB
- `FIREBASE_SERVICE_ACCOUNT` - Firebase auth
- `SLACK_WEBHOOK_URL` - Notifications

**Secret Rotation:**
- Database passwords: Quarterly
- API keys: Every 6 months
- Service accounts: Annually

---

## 6. Testing Strategy

### 6.1. Test Pyramid

```
       /\
      /  \  E2E Tests (10%)
     /____\
    /      \  Integration Tests (30%)
   /________\
  /          \  Unit Tests (60%)
 /____________\
```

### 6.2. Test Execution

**Unit Tests:**
- Run on every PR
- Target: < 2 minutes
- Coverage: > 80%

**Integration Tests:**
- Run on develop branch
- Target: < 5 minutes
- Database + Redis required

**E2E Tests:**
- Run before production deploy
- Target: < 15 minutes
- Staging environment

### 6.3. Mobile Testing

**iOS:**
- Build on macOS runner
- TestFlight deployment
- Device testing (iPhone 12, 13, 14)

**Android:**
- Build on Ubuntu runner
- Play Console deployment
- Device testing (Pixel, Samsung)

---

## 7. Rollback Strategy

### 7.1. Automatic Rollback

**Triggers:**
- Error rate > 5%
- Response time > 2s (p95)
- Health check fails
- Critical bug detected

**Process:**
1. Automatic rollback to previous version
2. Alert on-call engineer
3. Create incident report
4. Debug in staging

### 7.2. Manual Rollback

```bash
# Rollback backend
railway rollback --service logship-api --to VERSION

# Rollback admin
vercel --version PREVIOUS_VERSION

# Database rollback (if needed)
bunx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### 7.3. Database Rollback

**Zero-Downtime Migrations:**
- Add new columns (nullable)
- Deploy code using new columns
- Backfill data
- Make columns required
- Remove old columns

**Emergency Rollback:**
- Database backups every 6 hours
- Point-in-time recovery (7 days)
- Test restore monthly

---

## 8. Monitoring & Alerts

### 8.1. Deployment Notifications

**Slack Channels:**
- `#deployments` - All deployments
- `#deployments-prod` - Production only
- `#alerts` - Issues and rollbacks

**Notification Content:**
- Version/Commit SHA
- Deployed by
- Duration
- Status (success/failure)
- Link to logs

### 8.2. Post-Deployment Checks

**Automated:**
- Health check endpoint
- Smoke tests
- Error rate monitoring
- Performance metrics

**Manual:**
- Core user flows
- Payment processing
- Push notifications
- Location tracking

---

## 9. Best Practices

### 9.1. Code Quality

- Write tests before code (TDD)
- Keep functions small (< 50 lines)
- Use meaningful variable names
- Add JSDoc comments
- Review own PR before requesting review

### 9.2. Git Hygiene

- Commit often, push daily
- Write descriptive commit messages
- Squash commits before merge
- Delete branches after merge
- Tag releases

### 9.3. Deployment Hygiene

- Never deploy on Friday afternoon
- Have rollback plan ready
- Monitor for 1 hour after deploy
- Document changes in CHANGELOG

---

## 10. Troubleshooting

### 10.1. Common Issues

**Build Failures:**
- Check dependency versions
- Clear cache: `bun pm cache rm`
- Check Node.js version

**Test Failures:**
- Check test environment
- Verify database is running
- Check for flaky tests

**Deployment Failures:**
- Check secrets are set
- Verify environment variables
- Check service health

### 10.2. Emergency Contacts

| Issue | Contact | Slack |
|-------|---------|-------|
| CI/CD Down | DevOps Lead | @devops |
| Production Issue | On-Call Engineer | @oncall |
| Security Incident | Security Lead | @security |

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Infrastructure details |
| [MONITORING.md](./MONITORING.md) | Monitoring setup |
| [SECURITY.md](./SECURITY.md) | Security scanning |
| [08-Monorepo-Structure.md](./08-Monorepo-Structure.md) | Project structure |

---

**Last Updated:** February 13, 2026  
**Next Review:** Monthly  
**CI/CD Owner:** DevOps Team  
**Contact:** devops@logship.vn
