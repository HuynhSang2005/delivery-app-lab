---
name: tanstack-table
description: TanStack Table v8 headless data tables with server-side features for Cloudflare Workers + D1. Use for pagination, filtering, sorting, virtualization, or encountering state management, TanStack Query coordination, URL sync errors.
---

# TanStack Table Skill

Build production-ready, headless data tables with TanStack Table v8, optimized for server-side patterns and Cloudflare Workers integration.

---

## When to Use This Skill

**Auto-triggers when you mention:**
- "data table" or "datagrid"
- "server-side pagination" or "server-side filtering"
- "TanStack Table" or "React Table"
- "table with large dataset"
- "paginate/filter/sort with API"
- "Cloudflare D1 table integration"
- "virtualize table" or "large list performance"

**Use this skill when:**
- Building data tables with pagination, filtering, or sorting
- Implementing server-side table features (API-driven)
- Integrating tables with TanStack Query for data fetching
- Working with large datasets (1000+ rows) needing virtualization
- Connecting tables to Cloudflare D1 databases
- Need headless table logic without opinionated UI
- Migrating from other table libraries to TanStack Table v8

---

## What This Skill Provides

### 1. Production Templates (7)
- **Basic client-side table** - Simple table with local data
- **Server-paginated table** - API-driven pagination with TanStack Query
- **D1 database integration** - Cloudflare D1 + Workers API + Table
- **Column configuration patterns** - Type-safe column definitions
- **Controlled table state** - Column visibility, pinning, ordering, fuzzy/global filtering, row selection
- **Virtualized large dataset** - Performance optimization with TanStack Virtual
- **shadcn/ui styled table** - Integration with Tailwind v4 + shadcn

### 2. Server-Side Patterns
- Pagination with API backends
- Filtering with query parameters
- Sorting with database queries
- State management (page, filters, sorting)
- URL synchronization
- TanStack Query coordination

### 3. Cloudflare Integration
- D1 database query patterns
- Workers API endpoints for table data
- Pagination + filtering + sorting in SQL
- Bindings setup (wrangler.jsonc)
- Client-side integration patterns

### 4. Performance Optimization
- Virtualization with TanStack Virtual
- Large dataset rendering (10k+ rows)
- Memory-efficient patterns
- useVirtualizer() integration

### 5. Feature Controls & UX
- Column visibility toggles and pinning (frozen columns)
- Column ordering and sizing defaults
- Global + fuzzy search and faceted filters
- Row selection and row pinning patterns
- Controlled state checklist to avoid perf regressions

### 6. Error Prevention
Documents and prevents 6+ common issues:
1. Server-side state management confusion
2. TanStack Query integration errors (query key coordination)
3. Column filtering with API backends
4. Manual sorting setup mistakes
5. URL state synchronization issues
6. Large dataset performance problems
7. Over-controlling table state (columnSizingInfo) causing extra renders

---

## Quick Start

### Installation

```bash
# Core table library
bun add @tanstack/react-table@latest

# Optional: For virtualization (1000+ rows)
bun add @tanstack/react-virtual@latest

# Optional: For fuzzy/global search
bun add @tanstack/match-sorter-utils@latest
```

**Latest verified versions (as of 2025-12-09):**
- `@tanstack/react-table`: v8.21.3 (stable)
- `@tanstack/react-virtual`: v3.13.12
- `@tanstack/match-sorter-utils`: v8.21.3 (for fuzzy filtering)

**React support:** Works on React 16.8+ through React 19; React Compiler is not supported.

### Basic Client-Side Table

```typescript
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

interface User {
  id: string
  name: string
  email: string
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
]

function UsersTable() {
  // CRITICAL: Memoize data and columns to prevent infinite re-renders
  const data = useMemo<User[]>(() => [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ], [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(), // Required
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder ? null : header.column.columnDef.header}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {cell.renderValue()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## Server-Side Patterns (Recommended for Large Datasets)

### Pattern 1: Server-Side Pagination with TanStack Query

**Cloudflare Workers API Endpoint:**

```typescript
// src/routes/api/users.ts
import { Env } from '../../types'

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url)
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = Number(url.searchParams.get('pageSize')) || 20

  const offset = page * pageSize

  // Query D1 database
  const { results, meta } = await context.env.DB.prepare(`
    SELECT id, name, email, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(pageSize, offset).all()

  // Get total count for pagination
  const countResult = await context.env.DB.prepare(`
    SELECT COUNT(*) as total FROM users
  `).first<{ total: number }>()

  return Response.json({
    data: results,
    pagination: {
      page,
      pageSize,
      total: countResult?.total || 0,
      pageCount: Math.ceil((countResult?.total || 0) / pageSize),
    },
  })
}
```

**Client-Side Table with TanStack Query:**

```typescript
import { useReactTable, getCoreRowModel, PaginationState } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

function ServerPaginatedTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  // TanStack Query fetches data
  const { data, isLoading } = useQuery({
    queryKey: ['users', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/users?page=${pagination.pageIndex}&pageSize=${pagination.pageSize}`
      )
      return response.json()
    },
  })

  // TanStack Table manages display
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Server-side pagination config
    manualPagination: true, // CRITICAL: Tell table pagination is manual
    pageCount: data?.pagination.pageCount ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <table>{/* render table */}</table>

      {/* Pagination controls */}
      <div>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

### Pattern 2: Server-Side Filtering

**API with Filter Support:**

```typescript
export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url)
  const search = url.searchParams.get('search') || ''

  const { results } = await context.env.DB.prepare(`
    SELECT * FROM users
    WHERE name LIKE ? OR email LIKE ?
    LIMIT 20
  `).bind(`%${search}%`, `%${search}%`).all()

  return Response.json({ data: results })
}
```

**Client-Side:**

```typescript
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const { data } = useQuery({
  queryKey: ['users', columnFilters],
  queryFn: async () => {
    const search = columnFilters.find(f => f.id === 'search')?.value || ''
    return fetch(`/api/users?search=${search}`).then(r => r.json())
  },
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualFiltering: true, // CRITICAL: Server handles filtering
  state: { columnFilters },
  onColumnFiltersChange: setColumnFilters,
})
```

---

## Extended Reference

See [references/tanstack-table-extended.md](references/tanstack-table-extended.md) for:
- Virtualization for large datasets (1000+ rows)
- Extended error solutions (sorting, performance)
- Integration guides (tanstack-query, cloudflare-d1, tailwind-v4-shadcn)
- Best practices, templates reference, and production validation


