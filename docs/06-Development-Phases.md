# Logship-MVP: Development Phases

**Version:** 5.0  
**Last Updated:** February 2026  
**Timeline:** 10-12 weeks (Solo developer + AI assistance)  
**Working Hours:** ~20-30 hours/week  

---

## 1. Overview

This document outlines the development phases for Logship-MVP, a logistics delivery application built as a learning/portfolio project.

### 1.1. Project Constraints

| Constraint | Details |
|------------|---------|
| Developer | 1 solo developer + AI coding assistant |
| Time | Part-time (~25 hrs/week) |
| Budget | Free tiers only (Neon, Firebase, Cloudinary) |
| Scale | Max 50 concurrent users |
| Scope | MVP features only |

### 1.2. Tech Stack Summary

| Component | Technology |
|-----------|------------|
| Mobile | React Native + Expo SDK 54 |
| Admin Web | Next.js 16 + Tailwind |
| Backend | NestJS 11 + Prisma |
| Database | Neon (Postgres + PostGIS) |
| Cache | Upstash Redis |
| Auth | Firebase Auth (OTP) |
| Storage | Cloudinary |
| Real-time | Socket.io |

---

## 2. Development Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT TIMELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week 1-2        Week 3-4        Week 5-6        Week 7-8        Week 9-10  │
│  ┌──────┐        ┌──────┐        ┌──────┐        ┌──────┐        ┌──────┐   │
│  │Phase │        │Phase │        │Phase │        │Phase │        │Phase │   │
│  │  1   │───────>│  2   │───────>│  3   │───────>│  4   │───────>│  5   │   │
│  │Setup │        │Auth &│        │Orders│        │Real- │        │Admin │   │
│  │  &   │        │Users │        │  &   │        │time &│        │  &   │   │
│  │Infra │        │      │        │Match │        │ Chat │        │Polish│   │
│  └──────┘        └──────┘        └──────┘        └──────┘        └──────┘   │
│                                                                              │
│  Week 11-12                                                                  │
│  ┌──────┐                                                                    │
│  │Phase │                                                                    │
│  │  6   │                                                                    │
│  │Deploy│                                                                    │
│  │  &   │                                                                    │
│  │Launch│                                                                    │
│  └──────┘                                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Project Setup & Infrastructure (Week 1-2)

### 1.1. Goals

- Set up monorepo structure
- Configure all development tools
- Provision cloud services
- Create base project structure

### 1.2. Tasks

#### Week 1: Repository & Backend Setup

| Task | Est. Hours | Priority |
|------|------------|----------|
| Initialize monorepo (Bun workspaces) | 2 | High |
| Set up NestJS backend with TypeScript | 3 | High |
| Configure Prisma with Neon database | 3 | High |
| Enable PostGIS extension, create initial schema | 4 | High |
| Set up Redis (Upstash) connection | 2 | High |
| Configure ESLint, Prettier, Husky | 2 | Medium |
| Set up environment variables structure | 1 | High |
| Create Docker Compose for local development | 3 | Medium |

#### Week 2: Mobile & Web Setup

| Task | Est. Hours | Priority |
|------|------------|----------|
| Initialize Expo project (SDK 54) | 2 | High |
| Configure Expo Router, TypeScript | 2 | High |
| Set up Zustand + TanStack Query | 3 | High |
| Initialize Next.js admin dashboard | 2 | High |
| Configure Tailwind + Shadcn/ui | 3 | High |
| Set up shared types package | 2 | Medium |
| Create Cloudinary account, configure SDK | 2 | Medium |
| Set up Firebase project for auth | 2 | High |

### 1.3. Deliverables

- [ ] Monorepo with 3 packages: `backend`, `mobile`, `admin`
- [ ] Backend running locally with database connected
- [ ] Mobile app running in Expo Go
- [ ] Admin dashboard running locally
- [ ] All cloud services provisioned

### 1.4. Exit Criteria

```bash
# Backend
cd apps/api && bun run dev            # Runs on localhost:3000

# Mobile
cd apps/mobile && bunx expo start     # Opens in Expo Go

# Admin
cd apps/admin && bun run dev          # Runs on localhost:3001

# Database
bun run db:studio                    # Shows tables in browser
```

---

## Phase 2: Authentication & User Management (Week 3-4)

### 2.1. Goals

- Implement phone OTP authentication
- Create user and driver registration flows
- Build profile management
- Implement RBAC guards

### 2.2. Tasks

#### Week 3: Backend Auth

| Task | Est. Hours | Priority |
|------|------------|----------|
| Integrate Firebase Admin SDK | 3 | High |
| Create auth module (OTP send/verify) | 4 | High |
| Implement JWT token generation/refresh | 4 | High |
| Create users module (CRUD) | 3 | High |
| Implement RBAC guards (@Roles decorator) | 3 | High |
| Create drivers module (registration, approval) | 4 | High |
| Write unit tests for auth flows | 3 | Medium |

#### Week 4: Mobile & Admin Auth

| Task | Est. Hours | Priority |
|------|------------|----------|
| Mobile: Login screen with phone input | 3 | High |
| Mobile: OTP verification screen | 3 | High |
| Mobile: Auth store (Zustand + SecureStore) | 3 | High |
| Mobile: Protected routes setup | 2 | High |
| Mobile: Profile screen (view/edit) | 3 | High |
| Mobile: Driver registration form | 4 | High |
| Admin: Login page | 2 | High |
| Admin: Auth middleware | 2 | High |

### 2.3. Deliverables

- [ ] Users can login with phone OTP
- [ ] New users are created automatically on first login
- [ ] Users can update their profile (name, avatar)
- [ ] Drivers can submit registration with documents
- [ ] Admin can login to dashboard
- [ ] JWT tokens stored securely

### 2.4. API Endpoints Completed

```
POST /auth/otp/send
POST /auth/otp/verify
POST /auth/refresh
POST /auth/logout
GET  /users/me
PATCH /users/me
POST /drivers/register
GET  /drivers/me
```

---

## Phase 3: Order Creation & Driver Matching (Week 5-6)

### 3.1. Goals

- Build order creation flow with map
- Implement driver matching algorithm
- Create order management for drivers
- Display order lists

### 3.2. Tasks

#### Week 5: Backend Orders & Matching

| Task | Est. Hours | Priority |
|------|------------|----------|
| Create orders module | 4 | High |
| Implement PostGIS distance calculation | 3 | High |
| Create find_nearest_drivers function | 4 | High |
| Implement order pricing calculation | 2 | High |
| Order status state machine | 3 | High |
| Driver order acceptance logic | 3 | High |
| Geo service for location operations | 3 | High |
| Write integration tests | 3 | Medium |

#### Week 6: Mobile Order Flow

| Task | Est. Hours | Priority |
|------|------------|----------|
| Mobile: Map integration (react-native-maps) | 4 | High |
| Mobile: Location picker component | 4 | High |
| Mobile: Create order screen | 4 | High |
| Mobile: Price preview before order | 2 | High |
| Mobile: Order list screen | 3 | High |
| Mobile: Order details screen | 3 | High |
| Mobile: Driver pending orders screen | 4 | High |
| Mobile: Accept order flow | 3 | High |

### 3.3. Deliverables

- [ ] User can select pickup/dropoff on map
- [ ] User can see price estimate
- [ ] User can create order
- [ ] Nearest drivers are notified
- [ ] Driver can see pending orders nearby
- [ ] Driver can accept order
- [ ] Order status updates correctly

### 3.4. API Endpoints Completed

```
POST /orders/calculate-price
POST /orders
GET  /orders
GET  /orders/:id
POST /orders/:id/accept
PATCH /orders/:id/status
POST /orders/:id/cancel
GET  /drivers/me/pending-orders
```

---

## Phase 4: Real-time Tracking & Chat (Week 7-8)

### 4.1. Goals

- Implement WebSocket gateway
- Build real-time location tracking
- Create chat functionality
- Handle background location (driver)

### 4.2. Tasks

#### Week 7: Backend Real-time

| Task | Est. Hours | Priority |
|------|------------|----------|
| Set up Socket.io gateway | 4 | High |
| Implement room management (order rooms) | 3 | High |
| Driver location broadcast | 3 | High |
| Redis adapter for Socket.io | 3 | High |
| Create messages module | 3 | High |
| Real-time message delivery | 3 | High |
| Typing indicators | 2 | Medium |
| Read receipts | 2 | Medium |

#### Week 8: Mobile Real-time

| Task | Est. Hours | Priority |
|------|------------|----------|
| Mobile: Socket.io client setup | 3 | High |
| Mobile: Tracking map with driver marker | 4 | High |
| Mobile: AnimatedRegion for smooth movement | 3 | High |
| Mobile: Background location (expo-task-manager) | 5 | High |
| Mobile: Foreground service notification | 2 | High |
| Mobile: Chat screen | 4 | High |
| Mobile: Image message (Cloudinary upload) | 3 | High |
| Mobile: Push notifications setup | 3 | Medium |

### 4.3. Deliverables

- [ ] User sees driver location in real-time on map
- [ ] Driver marker moves smoothly
- [ ] Driver location updates in background
- [ ] User and driver can chat
- [ ] Image messages work
- [ ] Typing indicators show
- [ ] Push notifications for new messages

### 4.4. WebSocket Events Completed

```
# Rooms
order:join
order:leave

# Location
driver:location (emit)
location:updated (receive)

# Orders
order:status
order:assigned
order:new

# Chat
chat:message
chat:typing
chat:read
```

---

## Phase 5: Admin Dashboard & Polish (Week 9-10)

### 5.1. Goals

- Complete admin dashboard features
- Add driver approval workflow
- Implement analytics
- Polish mobile UX

### 5.2. Tasks

#### Week 9: Admin Features

| Task | Est. Hours | Priority |
|------|------------|----------|
| Admin: Dashboard stats & charts | 4 | High |
| Admin: Users table with search/filter | 4 | High |
| Admin: Drivers table | 3 | High |
| Admin: Driver approval page | 4 | High |
| Admin: Orders table with filters | 4 | High |
| Admin: Live tracking map | 4 | High |
| Admin: Settings page | 3 | Medium |
| Backend: Dashboard stats endpoint | 3 | High |

#### Week 10: Polish & Edge Cases

| Task | Est. Hours | Priority |
|------|------------|----------|
| Mobile: Loading states & skeletons | 3 | High |
| Mobile: Error handling & retry | 3 | High |
| Mobile: Offline mode handling | 3 | Medium |
| Mobile: Pull-to-refresh everywhere | 2 | Medium |
| Mobile: Haptic feedback | 1 | Low |
| Backend: Rate limiting | 2 | High |
| Backend: Input validation | 2 | High |
| Backend: Error logging (Sentry) | 2 | Medium |

### 5.3. Deliverables

- [ ] Admin can view all users/drivers/orders
- [ ] Admin can approve/reject drivers
- [ ] Admin can see live tracking map
- [ ] Admin can update system config
- [ ] Mobile app handles errors gracefully
- [ ] Loading states everywhere

---

## Phase 6: Deployment & Launch (Week 11-12)

### 6.1. Goals

- Deploy all services to production
- Set up CI/CD
- Create documentation
- Launch MVP

### 6.2. Tasks

#### Week 11: Backend & Admin Deployment

| Task | Est. Hours | Priority |
|------|------------|----------|
| Set up production Neon database | 2 | High |
| Deploy backend to Railway/Render | 4 | High |
| Configure production environment variables | 2 | High |
| Set up Upstash Redis production | 2 | High |
| Deploy admin to Vercel | 2 | High |
| Configure domain & SSL | 2 | High |
| Set up GitHub Actions for CI | 3 | Medium |
| Database backup strategy | 2 | Medium |

#### Week 12: Mobile Deployment & Launch

| Task | Est. Hours | Priority |
|------|------------|----------|
| Configure EAS Build | 3 | High |
| Create production build | 3 | High |
| Test on physical devices | 4 | High |
| Submit to TestFlight (iOS) | 2 | High |
| Create APK for Android testing | 2 | High |
| Write README documentation | 3 | Medium |
| Record demo video | 2 | Medium |
| Final testing & bug fixes | 5 | High |

### 6.3. Deliverables

- [ ] Backend running on Railway/Render
- [ ] Admin dashboard on Vercel
- [ ] Mobile app on TestFlight/APK
- [ ] CI/CD pipeline working
- [ ] README with setup instructions
- [ ] Demo video for portfolio

---

## 3. Risk Mitigation

### 3.1. Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Background location drains battery | High | Optimize update interval, use significant location changes |
| PostGIS queries slow | Medium | Proper indexing, limit search radius |
| WebSocket connection unstable | Medium | Implement reconnection logic, fallback to polling |
| Expo Go doesn't support all features | High | Use development builds for testing |
| Free tier limits exceeded | Medium | Monitor usage, implement caching |

### 3.2. Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feature creep | High | Strict MVP scope, defer nice-to-haves |
| Complex bugs take too long | Medium | Time-box debugging, accept workarounds |
| Learning curve for new tech | Medium | Use AI assistance, follow tutorials |
| Burnout | High | Maintain sustainable pace, take breaks |

---

## 4. Definition of Done

### 4.1. Feature Completion Criteria

- [ ] Code written and works locally
- [ ] Unit/integration tests pass
- [ ] No TypeScript errors
- [ ] ESLint/Prettier pass
- [ ] Manually tested happy path
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Works on iOS and Android (mobile)
- [ ] Works on Chrome and Safari (web)

### 4.2. Phase Completion Criteria

- [ ] All high-priority tasks completed
- [ ] All deliverables checked off
- [ ] Exit criteria verified
- [ ] No critical bugs
- [ ] Code committed and pushed
- [ ] Demo to self (or friend) successful

---

## 5. Post-MVP Roadmap

Features to add after MVP launch:

### 5.1. Short-term (1-2 months)

- [ ] Push notifications (Expo Notifications)
- [ ] Order history with ratings
- [ ] Driver earnings dashboard
- [ ] Multiple saved addresses
- [ ] Order cancellation with refund logic

### 5.2. Medium-term (3-6 months)

- [ ] Payment gateway integration (Stripe/VNPay)
- [ ] Route optimization (show ETA)
- [ ] Driver schedule/availability
- [ ] Promotions and discounts
- [ ] Multi-language support (Vietnamese/English)

### 5.3. Long-term (6+ months)

- [ ] AI-powered demand prediction
- [ ] Multi-city support
- [ ] B2B enterprise features
- [ ] Analytics dashboard for drivers
- [ ] Integration with external logistics providers

---

## 6. Weekly Milestones Summary

| Week | Phase | Key Milestone |
|------|-------|---------------|
| 1 | Setup | Backend + DB running |
| 2 | Setup | Mobile + Admin running |
| 3 | Auth | Backend auth complete |
| 4 | Auth | Mobile login working |
| 5 | Orders | Order creation backend |
| 6 | Orders | Mobile order flow complete |
| 7 | Real-time | WebSocket + tracking backend |
| 8 | Real-time | Live tracking on mobile |
| 9 | Admin | Dashboard complete |
| 10 | Polish | UX improvements |
| 11 | Deploy | Backend + Admin deployed |
| 12 | Launch | Mobile app ready |

---

## 7. Success Metrics

At the end of 12 weeks:

| Metric | Target |
|--------|--------|
| Core features working | 100% |
| Critical bugs | 0 |
| Test coverage (backend) | > 60% |
| Lighthouse score (admin) | > 80 |
| App runs on real devices | ✅ |
| Demo video created | ✅ |
| Portfolio-ready | ✅ |

---

## 8. Resources

### 8.1. Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [TanStack Query Documentation](https://tanstack.com/query)

### 8.2. Tutorials

- [React Native Maps Tutorial](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Socket.io with NestJS](https://docs.nestjs.com/websockets/gateways)
- [PostGIS Basics](https://postgis.net/workshops/postgis-intro/)
- [Expo Background Location](https://docs.expo.dev/versions/latest/sdk/task-manager/)

### 8.3. Tools

- [Postman](https://www.postman.com/) - API testing
- [Reactotron](https://github.com/infinitered/reactotron) - React Native debugging
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Redis Insight](https://redis.io/insight/) - Redis GUI
