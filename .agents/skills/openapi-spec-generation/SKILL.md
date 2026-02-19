---
name: openapi-spec-generation
description: Generate and maintain OpenAPI 3.1 specifications from code, design-first specs, and validation patterns. Use when creating API documentation, generating SDKs, or ensuring API contract compliance.
---

# OpenAPI Spec Generation

Comprehensive patterns for creating, maintaining, and validating OpenAPI 3.1 specifications for RESTful APIs.

## When to Use This Skill

- Creating API documentation from scratch
- Generating OpenAPI specs from existing code
- Designing API contracts (design-first approach)
- Validating API implementations against specs
- Generating client SDKs from specs
- Setting up API documentation portals

## Core Concepts

### 1. OpenAPI 3.1 Structure

```yaml
openapi: 3.1.0
info:
  title: API Title
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /resources:
    get: ...
components:
  schemas: ...
  securitySchemes: ...
```

### 2. Design Approaches

| Approach         | Description                  | Best For            |
| ---------------- | ---------------------------- | ------------------- |
| **Design-First** | Write spec before code       | New APIs, contracts |
| **Code-First**   | Generate spec from code      | Existing APIs       |
| **Hybrid**       | Annotate code, generate spec | Evolving APIs       |

## Templates

### Template 1: Complete API Specification

```yaml
openapi: 3.1.0
info:
  title: User Management API
  description: |
    API for managing users and their profiles.

    ## Authentication
    All endpoints require Bearer token authentication.

    ## Rate Limiting
    - 1000 requests per minute for standard tier
    - 10000 requests per minute for enterprise tier
  version: 2.0.0
  contact:
    name: API Support
    email: api-support@example.com
    url: https://docs.example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v2
    description: Production
  - url: https://staging-api.example.com/v2
    description: Staging
  - url: http://localhost:3000/v2
    description: Local development

tags:
  - name: Users
    description: User management operations
  - name: Profiles
    description: User profile operations
  - name: Admin
    description: Administrative operations

paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      description: Returns a paginated list of users with optional filtering.
      tags:
        - Users
      parameters:
        - $ref: "#/components/parameters/PageParam"
        - $ref: "#/components/parameters/LimitParam"
        - name: status
          in: query
          description: Filter by user status
          schema:
            $ref: "#/components/schemas/UserStatus"
        - name: search
          in: query
          description: Search by name or email
          schema:
            type: string
            minLength: 2
            maxLength: 100
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserListResponse"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimited"
      security:
        - bearerAuth: []

    post:
      operationId: createUser
      summary: Create a new user
      description: Creates a new user account and sends welcome email.
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUserRequest"
      responses:
        "201":
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
          headers:
            Location:
              description: URL of created user
              schema:
                type: string
                format: uri
        "400":
          $ref: "#/components/responses/BadRequest"
        "409":
          description: Email already exists
      security:
        - bearerAuth: []

  /users/{userId}:
    parameters:
      - $ref: "#/components/parameters/UserIdParam"

    get:
      operationId: getUser
      summary: Get user by ID
      tags:
        - Users
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "404":
          $ref: "#/components/responses/NotFound"
      security:
        - bearerAuth: []

    patch:
      operationId: updateUser
      summary: Update user
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateUserRequest"
      responses:
        "200":
          description: User updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          $ref: "#/components/responses/BadRequest"
        "404":
          $ref: "#/components/responses/NotFound"
      security:
        - bearerAuth: []

    delete:
      operationId: deleteUser
      summary: Delete user
      tags:
        - Users
        - Admin
      responses:
        "204":
          description: User deleted
        "404":
          $ref: "#/components/responses/NotFound"
      security:
        - bearerAuth: []
        - apiKey: []

components:
  schemas:
    User:
      type: object
      required: [id, email, name, status, createdAt]
      properties:
        id:
          type: string
          format: uuid
          readOnly: true
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
          maxLength: 100
        status:
          $ref: "#/components/schemas/UserStatus"
        role:
          type: string
          enum: [user, moderator, admin]
          default: user
        createdAt:
          type: string
          format: date-time
          readOnly: true

    UserStatus:
      type: string
      enum: [active, inactive, suspended, pending]

    # See extended reference for complete schemas

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token from /auth/login

    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: API key for service-to-service calls

security:
  - bearerAuth: []
```

### Template 2: Code-First (Python/FastAPI)

FastAPI automatically generates OpenAPI specs from Pydantic models and route decorators.

Key features:
- Type hints drive schema generation
- `Field()` for validation and metadata
- `response_model` for response schemas
- Auto-generated `/docs` and `/redoc` endpoints

See [extended reference](references/openapi-extended.md#template-2-code-first-generation-pythonfastapi) for complete example.

### Template 3: Code-First (TypeScript/tsoa)

tsoa generates OpenAPI from TypeScript decorators and interfaces.

Key features:
- Decorators: `@Route`, `@Get`, `@Post`, `@Tags`, `@Security`
- JSDoc comments for descriptions
- `@Example()` for response examples
- Compile-time type safety

See [extended reference](references/openapi-extended.md#template-3-code-first-typescriptexpress-with-tsoa) for complete example.

### Template 4: Validation & Linting

Use Spectral and Redocly to validate OpenAPI specs:

```bash
# Install tools
bun add -g @stoplight/spectral-cli @redocly/cli

# Run validation
spectral lint openapi.yaml
redocly lint openapi.yaml
```

**Key validation rules:**
- Require operation IDs
- Enforce descriptions
- Validate examples match schemas
- Check security is defined
- Enforce naming conventions

See [extended reference](references/openapi-extended.md#template-4-validation--linting) for complete configuration examples.

## SDK Generation

Generate client SDKs from OpenAPI specs:

```bash
# Install generator
bun add -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./generated/ts

# Generate Python client
openapi-generator-cli generate -i openapi.yaml -g python -o ./generated/python

# Generate Go client
openapi-generator-cli generate -i openapi.yaml -g go -o ./generated/go
```

**Supported languages:** TypeScript, Python, Go, Java, C#, Ruby, PHP, and 40+ more.

See [extended reference](references/openapi-extended.md#sdk-generation) for advanced options and alternative tools.

## Best Practices

### Do's

- **Use $ref** - Reuse schemas, parameters, responses
- **Add examples** - Real-world values help consumers
- **Document errors** - All possible error codes
- **Version your API** - In URL or header
- **Use semantic versioning** - For spec changes

### Don'ts

- **Don't use generic descriptions** - Be specific
- **Don't skip security** - Define all schemes
- **Don't forget nullable** - Be explicit about null
- **Don't mix styles** - Consistent naming throughout
- **Don't hardcode URLs** - Use server variables

## Resources

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [Swagger Editor](https://editor.swagger.io/)
- [Redocly](https://redocly.com/)
- [Spectral](https://stoplight.io/open-source/spectral)

## Extended Reference

See [references/openapi-extended.md](references/openapi-extended.md) for:
- Complete API specification with all components
- Full Python/FastAPI code examples
- Full TypeScript/tsoa code examples
- Detailed validation and linting configurations
- Advanced SDK generation options
