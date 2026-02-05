# Package Versions - Single Source of Truth

> **Note**: This document serves as the single source of truth for all package versions across the Logship-MVP project.
> 
> **Last Updated**: 2025-02-05

---

## Core Technologies

| Technology | Version | Notes |
|------------|---------|-------|
| **Bun** | 1.2.2+ | Package manager and runtime |
| **Node.js** | 22.x LTS | For compatibility |
| **TypeScript** | ^5.7.3 | All packages |

---

## Mobile App (Expo/React Native)

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.0 | Expo SDK |
| `react-native` | 0.81.0 | React Native framework |
| `react` | 19.1.0 | React (Expo SDK 54 uses React 19.1) |
| `expo-router` | ~5.0.0 | File-based routing |

### Navigation & UI
| Package | Version | Purpose |
|---------|---------|---------|
| `@react-navigation/native` | ^7.0.0 | Navigation core |
| `@react-navigation/bottom-tabs` | ^7.0.0 | Tab navigation |
| `react-native-gesture-handler` | ~2.24.0 | Gesture handling |
| `react-native-reanimated` | ~4.0.0 | Animations |
| `react-native-safe-area-context` | 5.2.0 | Safe area handling |
| `react-native-screens` | ~4.8.0 | Screen optimization |
| `react-native-svg` | 15.12.0 | SVG support |
| `tailwindcss` | ^4.0.0 | Styling |
| `nativewind` | ^5.0.0 | Tailwind for RN |

### Expo Modules
| Package | Version | Purpose |
|---------|---------|---------|
| `expo-location` | ~18.0.0 | GPS tracking |
| `expo-task-manager` | ~13.0.0 | Background tasks |
| `expo-notifications` | ~0.30.0 | Push notifications |
| `expo-secure-store` | ~15.0.0 | Secure storage |
| `expo-image` | ~2.0.0 | Image handling |
| `expo-image-picker` | ~16.0.0 | Image picker |
| `expo-updates` | ~0.28.0 | OTA updates |
| `expo-splash-screen` | ~0.30.0 | Splash screen |
| `expo-status-bar` | ~3.0.0 | Status bar |
| `expo-system-ui` | ~5.0.0 | System UI |
| `expo-web-browser` | ~15.0.0 | Web browser |

### State Management & Data
| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | ^5.0.0 | Client state |
| `@tanstack/react-query` | ^5.66.0 | Server state |
| `@hey-api/client-fetch` | ^0.8.1 | API client |

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.54.0 | Form handling |
| `@hookform/resolvers` | ^4.0.0 | Form resolvers |
| `zod` | ^4.0.0 | Schema validation |

### Maps & Location
| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-maps` | 1.22.0 | Map component |

### Real-time
| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io-client` | ^4.8.0 | WebSocket client |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `lodash-es` | ^4.17.21 | Utilities |
| `date-fns` | ^4.1.0 | Date handling |
| `react-native-url-polyfill` | ^2.0.0 | URL polyfill |
| `react-native-toast-message` | ^2.2.0 | Toast messages |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@hey-api/openapi-ts` | ^0.64.4 | API generation |
| `@types/react` | ~19.0.0 | React types |
| `@types/lodash-es` | ^4.17.12 | Lodash types |
| `@babel/core` | ^7.25.0 | Babel |
| `typescript` | ^5.7.0 | TypeScript |

---

## Admin Dashboard (Next.js)

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.1.6 | Next.js framework |
| `react` | ^19.0.0 | React |
| `react-dom` | ^19.0.0 | React DOM |

### UI Components (shadcn/ui)
| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/*` | latest | Headless UI primitives |
| `class-variance-authority` | ^0.7.0 | Component variants |
| `clsx` | ^2.1.0 | Class merging |
| `tailwind-merge` | ^2.5.0 | Tailwind class merging |
| `tailwindcss-animate` | ^1.0.0 | Tailwind animations |

### Styling
| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.0.4 | CSS framework |

### Icons
| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.475.0 | Icons |

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.54.0 | Form handling |
| `@hookform/resolvers` | ^4.0.0 | Form resolvers |
| `zod` | ^4.0.0 | Schema validation |

### State Management & Data
| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.66.0 | Server state |
| `@tanstack/react-table` | ^8.20.0 | Data tables |
| `@hey-api/client-fetch` | ^0.8.1 | API client |

### Maps
| Package | Version | Purpose |
|---------|---------|---------|
| `mapbox-gl` | ^3.9.0 | Map library |
| `react-map-gl` | ^7.1.0 | React Mapbox |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^4.1.0 | Date handling |
| `lodash-es` | ^4.17.21 | Utilities |
| `nuqs` | ^2.2.0 | URL query state |
| `next-themes` | ^0.4.0 | Theme management |
| `framer-motion` | ^11.15.0 | Animations |
| `recharts` | ^2.13.0 | Charts |
| `embla-carousel-react` | ^8.5.0 | Carousel |
| `react-day-picker` | ^9.4.0 | Date picker |
| `input-otp` | ^1.4.0 | OTP input |
| `react-resizable-panels` | ^2.1.0 | Resizable panels |
| `react-error-boundary` | ^4.1.0 | Error boundaries |
| `cmdk` | ^1.0.0 | Command palette |
| `vaul` | ^1.1.0 | Drawer component |

### Real-time
| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io-client` | ^4.8.0 | WebSocket client |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@hey-api/openapi-ts` | ^0.64.4 | API generation |
| `@types/node` | ^22.0.0 | Node types |
| `@types/react` | ^19.0.0 | React types |
| `@types/react-dom` | ^19.0.0 | React DOM types |
| `@types/lodash-es` | ^4.17.12 | Lodash types |
| `typescript` | ^5.7.0 | TypeScript |

---

## Backend API (NestJS)

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/common` | ^11.0.10 | NestJS core |
| `@nestjs/core` | ^11.0.10 | NestJS core |
| `@nestjs/platform-express` | ^11.0.10 | Express adapter |
| `@nestjs/platform-socket.io` | ^11.0.10 | Socket.io adapter |
| `@nestjs/websockets` | ^11.0.10 | WebSocket gateway |

### Database
| Package | Version | Purpose |
|---------|---------|---------|
| `@prisma/client` | ^6.3.0 | Prisma ORM client |
| `prisma` | ^6.3.0 | Prisma CLI |

### Authentication
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/passport` | ^11.0.10 | Passport integration |
| `@nestjs/jwt` | ^11.0.10 | JWT handling |
| `passport` | ^0.7.0 | Authentication |
| `passport-jwt` | ^4.0.0 | JWT strategy |
| `firebase-admin` | ^13.0.0 | Firebase Admin SDK |

### API Documentation
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/swagger` | ^11.0.3 | Swagger/OpenAPI |

### Validation
| Package | Version | Purpose |
|---------|---------|---------|
| `class-validator` | ^0.14.0 | DTO validation |
| `class-transformer` | ^0.5.0 | Object transformation |

### Queue & Caching
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/bullmq` | ^11.0.0 | BullMQ integration |
| `bullmq` | ^5.40.0 | Job queues |
| `ioredis` | ^5.5.0 | Redis client |

### Rate Limiting
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/throttler` | ^6.4.0 | Rate limiting |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `reflect-metadata` | ^0.2.0 | Metadata reflection |
| `rxjs` | ^7.8.0 | Reactive programming |
| `uuid` | ^11.0.0 | UUID generation |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/cli` | ^11.0.0 | NestJS CLI |
| `@nestjs/schematics` | ^11.0.0 | NestJS schematics |
| `@nestjs/testing` | ^11.0.10 | Testing utilities |
| `@types/express` | ^5.0.0 | Express types |
| `@types/node` | ^22.0.0 | Node types |
| `@types/uuid` | ^10.0.0 | UUID types |
| `typescript` | ^5.7.0 | TypeScript |

---

## Shared Packages

### Shared Types
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.7.3 | TypeScript |

### Shared Config
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.7.3 | TypeScript |
| `eslint` | ^9.20.0 | ESLint |
| `@typescript-eslint/*` | ^8.23.0 | TypeScript ESLint |
| `eslint-config-prettier` | ^10.0.1 | Prettier config |
| `prettier` | ^3.5.0 | Code formatting |
| `tailwindcss` | ^4.0.4 | CSS framework |

### Shared Utils
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.7.3 | TypeScript |

---

## Infrastructure & Services

| Service | Version/Plan | Purpose |
|---------|--------------|---------|
| **Neon PostgreSQL** | Latest | Database |
| **PostGIS** | Latest | Geospatial extension |
| **Upstash Redis** | Free tier | Caching & Queues |
| **Firebase** | Latest | Authentication |
| **Goong Maps** | Free tier | Maps & Geocoding |
| **Cloudinary** | Free tier | Image storage |
| **Socket.io** | ^4.8.0 | Real-time communication |

---

## Versioning Rules

1. **Exact versions** for critical packages:
   - `react-native`: Exact version (e.g., `0.81.0`)
   - `react` (mobile): Exact version (e.g., `19.1.0`)
   - `expo`: Tilde range (e.g., `~54.0.0`)

2. **Caret ranges** (^) for most dependencies:
   - Allows minor updates and patches
   - Example: `^5.0.0` allows `5.x.x` but not `6.0.0`

3. **Tilde ranges** (~) for Expo packages:
   - Allows only patches
   - Example: `~54.0.0` allows `54.0.x` but not `54.1.0`

---

## Updating Versions

When updating versions:

1. Update this file first (single source of truth)
2. Update all relevant documentation
3. Update all `package.json` files
4. Run `bun install` to update lockfile
5. Test all applications

---

## Related Documents

- [00-Unified-Tech-Stack-Spec.md](./00-Unified-Tech-Stack-Spec.md)
- [04-Mobile-App-Technical-Spec.md](./04-Mobile-App-Technical-Spec.md)
- [05-Admin-Dashboard-Spec.md](./05-Admin-Dashboard-Spec.md)
- [07-Backend-Architecture.md](./07-Backend-Architecture.md)
- [08-Monorepo-Structure.md](./08-Monorepo-Structure.md)

---

**END OF DOCUMENT**
