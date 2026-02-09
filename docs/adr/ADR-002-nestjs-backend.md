# ADR-002: Use NestJS for Backend Framework

## Status

- **Accepted**

## Context

We needed to choose a backend framework for the Logship-MVP API. The backend needs to support:
- REST API endpoints
- WebSocket connections for real-time features
- Background job processing
- Database integration with PostgreSQL
- Authentication and authorization
- Scalable architecture

The project is developed by a solo developer with AI assistance, so developer productivity and maintainability are crucial.

## Decision

We will use **NestJS 11.1.x** as the backend framework.

## Consequences

### Positive

- **TypeScript-First**: Built with TypeScript, excellent type safety
- **Modular Architecture**: Clear module structure, easy to organize code
- **Dependency Injection**: Built-in DI container for testable code
- **Ecosystem**: Rich ecosystem with official packages for common needs:
  - `@nestjs/websockets` for Socket.io integration
  - `@nestjs/swagger` for API documentation
  - `@nestjs/bullmq` for job queues
  - `@nestjs/passport` for authentication
- **Prisma Integration**: Excellent support for Prisma ORM
- **Enterprise Patterns**: Supports CQRS, microservices, GraphQL
- **Testing**: Built-in testing utilities

### Negative

- **Learning Curve**: More complex than Express.js for simple APIs
- **Boilerplate**: Requires more boilerplate code for simple operations
- **Bundle Size**: Larger bundle size compared to minimal frameworks
- **Performance**: Slightly slower than pure Express for simple use cases

### Neutral

- **Opinionated**: Enforces specific patterns, which can be good or bad depending on perspective
- **Decorators**: Heavy use of decorators (requires `reflect-metadata`)

## Alternatives Considered

### Alternative 1: Express.js

- **Pros**: Minimal, flexible, large community, fast for simple APIs
- **Cons**: No built-in structure, requires manual setup for many features
- **Why Rejected**: Too much manual configuration needed for our requirements

### Alternative 2: Fastify

- **Pros**: Fast, low overhead, good plugin system
- **Cons**: Smaller ecosystem, less mature than Express
- **Why Rejected**: NestJS provides better structure and more comprehensive ecosystem

### Alternative 3: tRPC

- **Pros**: End-to-end type safety, no API contract maintenance
- **Cons**: Tight coupling between frontend and backend, less suitable for mobile apps
- **Why Rejected**: We need a traditional REST API for mobile clients

### Alternative 4: Serverless (AWS Lambda / Vercel Functions)

- **Pros**: No server management, auto-scaling, pay-per-use
- **Cons**: Cold start latency, vendor lock-in, harder to manage WebSocket connections
- **Why Rejected**: WebSocket requirements make serverless less suitable

## Related Decisions

- [ADR-003: Use Neon Serverless PostgreSQL](./ADR-003-neon-postgresql.md)
- [07-Backend-Architecture.md](../07-Backend-Architecture.md)

## Architecture Patterns Used

1. **Modular Monolith**: Feature-based modules with clear boundaries
2. **Repository Pattern**: Database access through repositories
3. **CQRS-lite**: Separate read/write concerns for complex operations
4. **Event-Driven**: BullMQ for async processing, Socket.io for real-time

## Notes

- NestJS 11.1.x is the latest version as of February 2026
- We use the Express adapter (default) for HTTP platform
- Swagger/OpenAPI is automatically generated from decorators
- BullMQ is used for background job processing

---

**Date**: 2026-02-09
**Author**: Solo Developer
**Stakeholders**: AI Development Assistant
