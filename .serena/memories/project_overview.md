# Logship-MVP Project Overview

## Purpose
Logship-MVP is a logistics delivery application connecting Users (customers) with Drivers for real-time package delivery. The project is designed as a learning project for CV/portfolio purposes.

## Current Status
**Phase:** Documentation Complete ✅  
**Next Step:** Phase 1 - Project Setup & Infrastructure (Week 1-2)

### Constraints
- Max 50 concurrent users (fits Neon free tier)
- Solo developer + AI assistance
- Timeline: 10-12 weeks

## Tech Stack (Finalized - January 2025)
| Component | Technology |
|-----------|------------|
| Mobile | React Native + Expo SDK 54 |
| State (Mobile) | Zustand + TanStack Query v5 |
| Maps | react-native-maps + expo-location |
| Web Admin | Next.js 15 + Tailwind + Shadcn/ui |
| Backend | NestJS 11 + Prisma 6 |
| Database | Neon (Serverless Postgres 17) + PostGIS |
| Cache/Pub-Sub | Upstash Redis |
| Real-time | Socket.io v4 |
| Auth | Firebase Auth (Phone OTP) |
| Storage | Cloudinary |

## Documentation Created
All technical docs are in `docs/` folder:
1. `01-SDD-System-Design-Document.md` - Architecture overview
2. `02-Database-Design-Document.md` - Schema, PostGIS, Prisma
3. `03-API-Design-Document.md` - REST + WebSocket endpoints
4. `04-Mobile-App-Technical-Spec.md` - React Native + Expo details
5. `05-Admin-Dashboard-Spec.md` - Web admin panel
6. `06-Development-Phases.md` - 10-12 week timeline

## Key Technical Decisions
- Use GEOGRAPHY type (not GEOMETRY) for accurate distance calculations
- Driver location stored in Redis for real-time queries (GEOADD/GEORADIUS)
- Background location requires Expo development build (not Expo Go)
- WebSocket rooms per order for tracking and chat
- Monolith backend (NestJS) - simpler for solo dev

## Development Phases
1. **Week 1-2:** Project Setup & Infrastructure
2. **Week 3-4:** Authentication & User Management
3. **Week 5-6:** Order Creation & Driver Matching
4. **Week 7-8:** Real-time Tracking & Chat
5. **Week 9-10:** Admin Dashboard & Polish
6. **Week 11-12:** Deployment & Launch

## Core Features (MVP)
1. Phone + OTP Authentication
2. Order Flow: Create → Match → Track → Complete
3. Real-time GPS Tracking (foreground + background)
4. In-app Chat per Order
5. Admin Dashboard (web only)

## Non-Goals (Not in MVP)
- Route optimization (AI/ML)
- Payment gateway integration
- Multi-city/warehouse support
- VoIP calls
- User/Driver web apps (mobile only)
