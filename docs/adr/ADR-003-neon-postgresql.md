# ADR-003: Use Neon Serverless PostgreSQL

## Status

- **Accepted**

## Context

We needed to choose a database solution for Logship-MVP. Requirements include:
- Relational database for structured data (users, orders, messages)
- Geospatial capabilities for location-based queries (PostGIS)
- Cost-effective for MVP stage (low traffic, limited budget)
- Easy to scale as the product grows
- Good developer experience with branching for development

The project targets maximum 50 concurrent users initially, with potential to scale.

## Decision

We will use **Neon Serverless PostgreSQL** with **PostGIS** extension.

## Consequences

### Positive

- **Serverless**: Scale-to-zero, pay only when used
- **Free Tier**: Generous free tier (0.5 GB storage, 190 compute hours/month)
- **PostGIS Support**: Built-in geospatial extension for location queries
- **Branching**: Database branches for dev/staging environments
- **Connection Pooling**: Built-in via pooler endpoint
- **PostgreSQL 17**: Latest PostgreSQL version with all features
- **Prisma Compatible**: Works seamlessly with Prisma ORM
- **No Server Management**: Fully managed, no maintenance overhead

### Negative

- **Cold Starts**: First query after idle may have 1-2s latency
- **Vendor Lock-in**: Neon-specific features (branching) not portable
- **Free Tier Limits**: Need to monitor usage to avoid overages
- **Connection Limits**: Free tier has connection limits

### Neutral

- **Connection String**: Uses standard PostgreSQL connection string
- **API Available**: Neon API for programmatic management

## Alternatives Considered

### Alternative 1: Supabase

- **Pros**: PostgreSQL with realtime subscriptions, auth built-in, generous free tier
- **Cons**: Less mature than Neon, realtime subscriptions limited
- **Why Rejected**: We need more control over WebSocket implementation with Socket.io

### Alternative 2: Railway/Render PostgreSQL

- **Pros**: Simple setup, good for traditional server-based apps
- **Cons**: No serverless benefits, always-on pricing
- **Why Rejected**: Cost and lack of branching features

### Alternative 3: AWS RDS PostgreSQL

- **Pros**: Enterprise-grade, highly reliable
- **Cons**: Complex setup, expensive for small projects, overkill for MVP
- **Why Rejected**: Too complex and expensive for MVP stage

### Alternative 4: MongoDB Atlas

- **Pros**: Document-based, flexible schema, good for rapid development
- **Cons**: No native geospatial support as powerful as PostGIS, different data model
- **Why Rejected**: Relational data model fits our domain better

### Alternative 5: SQLite (with Litestream)

- **Pros**: Zero configuration, serverless-friendly
- **Cons**: Limited concurrency, no built-in geospatial support
- **Why Rejected**: Not suitable for concurrent users and location queries

## PostGIS Usage

We use PostGIS for:
- Storing driver locations as `GEOGRAPHY(POINT, 4326)`
- Finding nearest drivers with KNN (K-Nearest Neighbors) queries
- Calculating distances for pricing
- Efficient spatial indexing with GIST

Example query:
```sql
SELECT * FROM find_nearest_drivers(10.7769, 106.7009, 5000, 5);
```

## Related Decisions

- [02-Database-Design-Document.md](../02-Database-Design-Document.md)
- [ADR-002: Use NestJS for Backend Framework](./ADR-002-nestjs-backend.md)

## Important Distinction

**Neon** is the database provider (serverless PostgreSQL).
**Prisma** is the ORM (tool to interact with the database).
**PostGIS** is the PostgreSQL extension for geospatial data.

Correct: "We use Neon as our database, with Prisma as our ORM"
Incorrect: "We use Prisma as our database"

## Notes

- Always use the `-pooler` endpoint for serverless applications
- Use `GEOGRAPHY` type (not `GEOMETRY`) for accurate Earth-surface calculations
- Branch database for development and testing
- Monitor usage to stay within free tier limits

---

**Date**: 2026-02-09
**Author**: Solo Developer
**Stakeholders**: AI Development Assistant
