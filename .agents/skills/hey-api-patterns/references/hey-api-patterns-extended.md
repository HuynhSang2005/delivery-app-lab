# Hey-API Patterns — Extended Reference

Extended examples and long code snippets moved from SKILL.md for readability.

Moved content includes:
- Full pattern examples for controller DTOs, client usage, generated hooks, and configuration
- Long usage examples for OrdersPage and using generated clients
- Client configuration and query client setup samples

---

<!-- Moved verbatim from SKILL.md -->

```typescript
// apps/admin/src/app/orders/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { findAllOptions, createMutation, updateStatusMutation, ordersQueryKey } from '@/client/tanstack-query.gen';
import { zOrderResponseDto } from '@/client/zod.gen';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({ ...findAllOptions({ query: { status: 'PENDING', page: 1, limit: 20 } }) });

  const createOrder = useMutation({ ...createMutation(), onSuccess: (newOrder) => {
    const validated = zOrderResponseDto.parse(newOrder);
    queryClient.invalidateQueries({ queryKey: ordersQueryKey() });
  }});

  // ... rest of the long example moved here
}
```

```typescript
// apps/admin/src/lib/api.ts
import { client } from '@/client/client.gen';

client.setConfig({ baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' });
client.interceptors.request.use((request) => { const token = localStorage.getItem('accessToken'); if (token) request.headers.set('Authorization', `Bearer ${token}`); return request; });

client.interceptors.response.use((response) => { if (response.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; } return response; });
```
