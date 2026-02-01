# Logship-MVP: Admin Dashboard Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Framework:** React 19 / Next.js 15 (App Router)  
**UI:** Tailwind CSS + Shadcn/ui  

---

## 1. Overview

The Admin Dashboard is a web application for system administrators to manage users, drivers, orders, and view analytics.

### 1.1. Target Users

- **System Administrators**: Full access to all features
- (Future: Operations staff with limited access)

### 1.2. Key Features

| Feature | Description |
|---------|-------------|
| Dashboard | Overview stats, charts, real-time order map |
| User Management | View/search users, toggle status |
| Driver Management | Approve/reject drivers, view documents |
| Order Management | View all orders, filter, cancel orders |
| Live Tracking | Real-time map of active deliveries |
| Settings | System configuration (pricing, etc.) |

---

## 2. Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| State (Server) | TanStack Query v5 |
| State (Client) | Zustand (minimal) |
| UI Components | Shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Maps | **Goong JS** (Mapbox GL compatible, Vietnam-optimized) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Date | date-fns |
| **API Client** | **Hey-API** (auto-generated from OpenAPI) |

---

## 3. Project Structure

```
apps/admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Dashboard home
│   │   ├── users/
│   │   │   ├── page.tsx            # Users list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # User details
│   │   ├── drivers/
│   │   │   ├── page.tsx            # Drivers list
│   │   │   ├── pending/
│   │   │   │   └── page.tsx        # Pending approvals
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Driver details
│   │   ├── orders/
│   │   │   ├── page.tsx            # Orders list
│   │   │   ├── live/
│   │   │   │   └── page.tsx        # Live tracking map
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Order details
│   │   └── settings/
│   │       └── page.tsx            # System settings
│   ├── api/                        # API routes (if needed)
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── ui/                         # Shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── data-table.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── breadcrumb.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── orders-chart.tsx
│   │   └── recent-orders.tsx
│   ├── maps/
│   │   ├── goong-map.tsx           # Goong JS map component
│   │   ├── live-tracking-map.tsx   # Uses Goong for live tracking
│   │   └── driver-marker.tsx
│   └── tables/
│       ├── users-table.tsx
│       ├── drivers-table.tsx
│       └── orders-table.tsx
├── hooks/
│   ├── use-users.ts
│   ├── use-drivers.ts
│   ├── use-orders.ts
│   └── use-stats.ts
├── lib/
│   ├── api/
│   │   ├── generated/              # Hey-API generated client
│   │   │   ├── index.ts
│   │   │   ├── sdk.gen.ts          # Type-safe SDK
│   │   │   ├── types.gen.ts        # TypeScript types
│   │   │   ├── zod.gen.ts          # Zod schemas
│   │   │   └── queries.gen.ts      # TanStack Query hooks
│   │   └── client.ts               # API client configuration
│   ├── goong.ts                    # Goong Maps service
│   ├── query-client.ts
│   ├── utils.ts
│   └── validations/
│       └── settings.ts
├── types/
│   ├── api.types.ts
│   ├── user.types.ts
│   └── order.types.ts
├── hey-api.config.ts               # Hey-API configuration
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Core Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    
    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-table": "^8.20.0",
    "zustand": "^5.0.0",
    "@hey-api/client-fetch": "^0.7.0",
    "socket.io-client": "^4.8.0",
    
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    
    "recharts": "^2.13.0",
    "mapbox-gl": "^3.9.0",
    "lucide-react": "^0.460.0",
    "date-fns": "^4.1.0",
    "sonner": "^1.7.0"
  },
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.60.0",
    "@types/mapbox-gl": "^3.4.0"
  }
}
```

> **Note:** We use `mapbox-gl` as the rendering library since Goong JS tiles are Mapbox GL compatible. The Goong API key is used for geocoding and directions.

---

## 5. Page Specifications

### 5.1. Dashboard Home

**Route:** `/`

**Features:**
- Summary stats cards (orders, revenue, users, drivers)
- Orders chart (last 7 days)
- Recent orders table
- Active drivers map (mini)

```typescript
// app/(dashboard)/page.tsx
import { Suspense } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { OrdersChart } from '@/components/dashboard/orders-chart';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { ActiveDriversMap } from '@/components/dashboard/active-drivers-map';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <OrdersChart />
        </Suspense>
        <Suspense fallback={<MapSkeleton />}>
          <ActiveDriversMap />
        </Suspense>
      </div>
      
      {/* Recent Orders */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}
```

### 5.2. Users Management

**Route:** `/users`

**Features:**
- Data table with search, filter, pagination
- Quick actions: View details, toggle status
- Export to CSV

```typescript
// components/tables/users-table.tsx
'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useUsers, useToggleUserStatus } from '@/hooks/use-users';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search } from 'lucide-react';
import type { User } from '@/types/user.types';

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Tên',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={row.original.avatarUrl} />
          <AvatarFallback>{row.original.name?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{row.original.name ?? 'Chưa đặt tên'}</p>
          <p className="text-sm text-muted-foreground">{row.original.phone}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Vai trò',
    cell: ({ row }) => {
      const roleColors = {
        USER: 'bg-blue-100 text-blue-800',
        DRIVER: 'bg-green-100 text-green-800',
        ADMIN: 'bg-purple-100 text-purple-800',
      };
      return (
        <Badge className={roleColors[row.original.role]}>
          {row.original.role}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'destructive'}>
        {row.original.isActive ? 'Hoạt động' : 'Đã khóa'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];

export function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const { data, isLoading } = useUsers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter,
  });

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    pageCount: data?.meta.totalPages ?? 0,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Export CSV</Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRowSkeleton columns={5} rows={10} />
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Không tìm thấy người dùng
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
```

### 5.3. Driver Approvals

**Route:** `/drivers/pending`

**Features:**
- List of pending driver applications
- View uploaded documents (ID card, license, vehicle photo)
- Approve or reject with reason

```typescript
// app/(dashboard)/drivers/pending/page.tsx
'use client';

import { usePendingDrivers, useApproveDriver, useRejectDriver } from '@/hooks/use-drivers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, Eye } from 'lucide-react';

export default function PendingDriversPage() {
  const { data: drivers, isLoading } = usePendingDrivers();
  const approveMutation = useApproveDriver();
  const rejectMutation = useRejectDriver();

  if (isLoading) return <LoadingState />;

  if (!drivers?.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không có đơn đăng ký nào đang chờ duyệt</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Duyệt tài xế</h1>
      
      <div className="grid gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{driver.user.name ?? driver.user.phone}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Đăng ký: {format(new Date(driver.createdAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Driver Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Số điện thoại</label>
                    <p className="font-medium">{driver.user.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Biển số xe</label>
                    <p className="font-medium">{driver.vehiclePlate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Loại xe</label>
                    <p className="font-medium">{driver.vehicleType}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">Giấy tờ đã nộp:</p>
                  <div className="flex gap-4">
                    <DocumentPreview
                      label="CMND/CCCD"
                      url={driver.idCardUrl}
                    />
                    <DocumentPreview
                      label="Bằng lái xe"
                      url={driver.driverLicenseUrl}
                    />
                    <DocumentPreview
                      label="Ảnh xe"
                      url={driver.vehiclePhotoUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                <RejectDialog
                  driverId={driver.id}
                  onReject={(reason) => rejectMutation.mutate({ id: driver.id, reason })}
                  isLoading={rejectMutation.isPending}
                />
                <Button
                  onClick={() => approveMutation.mutate(driver.id)}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Phê duyệt
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DocumentPreview({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Không có</span>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative group">
          <img
            src={url}
            alt={label}
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <span className="block text-xs text-center mt-1">{label}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <img src={url} alt={label} className="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
  );
}
```

### 5.4. Live Tracking Map

**Route:** `/orders/live`

**Features:**
- Real-time map showing all active orders
- Driver markers with current location
- Click marker to see order details
- Filter by order status

```typescript
// app/(dashboard)/orders/live/page.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useActiveOrders } from '@/hooks/use-orders';
import { useSocket } from '@/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Dynamic import for Mapbox GL (SSR incompatible)
const LiveMap = dynamic(() => import('@/components/maps/live-tracking-map'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-muted animate-pulse rounded-lg" />,
});

export default function LiveTrackingPage() {
  const { data: orders, isLoading } = useActiveOrders();
  const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const socket = useSocket();

  // Listen for driver location updates
  useEffect(() => {
    if (!socket) return;

    // Join all active order rooms
    orders?.forEach((order) => {
      socket.emit('order:join', { orderId: order.id });
    });

    socket.on('location:updated', (data: { orderId: string; driverId: string; lat: number; lng: number }) => {
      setDriverLocations((prev) => ({
        ...prev,
        [data.driverId]: { lat: data.lat, lng: data.lng },
      }));
    });

    return () => {
      socket.off('location:updated');
      orders?.forEach((order) => {
        socket.emit('order:leave', { orderId: order.id });
      });
    };
  }, [socket, orders]);

  // Merge driver locations with orders
  const ordersWithLocations = orders?.map((order) => ({
    ...order,
    driverLocation: order.driver
      ? driverLocations[order.driver.id] ?? order.driver.currentLocation
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Theo dõi trực tiếp</h1>
        <Badge variant="outline" className="text-green-600">
          {orders?.length ?? 0} đơn đang hoạt động
        </Badge>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <LiveMap orders={ordersWithLocations ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="font-semibold">Đơn hàng đang giao</h2>
          {isLoading ? (
            <OrderListSkeleton />
          ) : (
            ordersWithLocations?.map((order) => (
              <OrderMiniCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

```typescript
// components/maps/live-tracking-map.tsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Order } from '@/types/order.types';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use Goong tiles (Mapbox GL compatible)
const GOONG_MAPTILES_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY!;
const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`;

interface Props {
  orders: Array<Order & { driverLocation: { lat: number; lng: number } | null }>;
}

export default function LiveTrackingMap({ orders }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Record<string, mapboxgl.Marker>>({});

  // Default center: Ho Chi Minh City
  const defaultCenter: [number, number] = [106.7009, 10.7769];

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: GOONG_STYLE_URL,
      center: defaultCenter,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when orders change
  useEffect(() => {
    if (!map.current) return;

    // Track which markers we've updated
    const updatedMarkerIds = new Set<string>();

    orders.forEach((order) => {
      // Driver marker
      if (order.driverLocation && order.driver) {
        const markerId = `driver-${order.driver.id}`;
        updatedMarkerIds.add(markerId);

        if (markers.current[markerId]) {
          // Update existing marker position (smooth animation)
          markers.current[markerId].setLngLat([
            order.driverLocation.lng,
            order.driverLocation.lat,
          ]);
        } else {
          // Create new driver marker
          const el = document.createElement('div');
          el.className = 'driver-marker';
          el.style.cssText = `
            width: 40px;
            height: 40px;
            background-image: url('/markers/driver-marker.png');
            background-size: cover;
            cursor: pointer;
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="text-sm">
              <p class="font-semibold">${order.driver.name}</p>
              <p class="text-gray-500">${order.driver.vehiclePlate}</p>
              <p class="text-xs mt-1">Đơn: #${order.orderNumber}</p>
            </div>
          `);

          markers.current[markerId] = new mapboxgl.Marker(el)
            .setLngLat([order.driverLocation.lng, order.driverLocation.lat])
            .setPopup(popup)
            .addTo(map.current!);
        }
      }

      // Pickup marker
      const pickupId = `pickup-${order.id}`;
      if (!markers.current[pickupId]) {
        const el = document.createElement('div');
        el.className = 'pickup-marker';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          background-image: url('/markers/pickup-marker.png');
          background-size: cover;
        `;

        markers.current[pickupId] = new mapboxgl.Marker(el)
          .setLngLat([order.pickup.lng, order.pickup.lat])
          .addTo(map.current!);
      }
      updatedMarkerIds.add(pickupId);

      // Dropoff marker
      const dropoffId = `dropoff-${order.id}`;
      if (!markers.current[dropoffId]) {
        const el = document.createElement('div');
        el.className = 'dropoff-marker';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          background-image: url('/markers/dropoff-marker.png');
          background-size: cover;
        `;

        markers.current[dropoffId] = new mapboxgl.Marker(el)
          .setLngLat([order.dropoff.lng, order.dropoff.lat])
          .addTo(map.current!);
      }
      updatedMarkerIds.add(dropoffId);
    });

    // Remove stale markers
    Object.keys(markers.current).forEach((id) => {
      if (!updatedMarkerIds.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Fit bounds to show all markers
    if (orders.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      orders.forEach((order) => {
        bounds.extend([order.pickup.lng, order.pickup.lat]);
        bounds.extend([order.dropoff.lng, order.dropoff.lat]);
        if (order.driverLocation) {
          bounds.extend([order.driverLocation.lng, order.driverLocation.lat]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [orders]);

  return <div ref={mapContainer} className="h-[600px] rounded-lg" />;
}
```

### 5.5. System Settings

**Route:** `/settings`

**Features:**
- Pricing configuration (base price, price per km)
- Driver matching radius
- Other system parameters

```typescript
// app/(dashboard)/settings/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSystemConfig, useUpdateConfig } from '@/hooks/use-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const settingsSchema = z.object({
  basePrice: z.coerce.number().min(0),
  pricePerKm: z.coerce.number().min(0),
  maxMatchingRadiusKm: z.coerce.number().min(1).max(50),
  driverLocationUpdateIntervalMs: z.coerce.number().min(1000).max(60000),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { data: config, isLoading } = useSystemConfig();
  const updateMutation = useUpdateConfig();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      basePrice: 10000,
      pricePerKm: 5000,
      maxMatchingRadiusKm: 5,
      driverLocationUpdateIntervalMs: 5000,
    },
    values: config ? {
      basePrice: config.BASE_PRICE.amount,
      pricePerKm: config.PRICE_PER_KM.amount,
      maxMatchingRadiusKm: config.MAX_MATCHING_RADIUS_KM.value,
      driverLocationUpdateIntervalMs: config.DRIVER_LOCATION_UPDATE_INTERVAL_MS.value,
    } : undefined,
  });

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMutation.mutateAsync([
        { key: 'BASE_PRICE', value: { amount: values.basePrice, currency: 'VND' } },
        { key: 'PRICE_PER_KM', value: { amount: values.pricePerKm, currency: 'VND' } },
        { key: 'MAX_MATCHING_RADIUS_KM', value: { value: values.maxMatchingRadiusKm } },
        { key: 'DRIVER_LOCATION_UPDATE_INTERVAL_MS', value: { value: values.driverLocationUpdateIntervalMs } },
      ]);
      toast.success('Cấu hình đã được lưu');
    } catch (error) {
      toast.error('Không thể lưu cấu hình');
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình giá</CardTitle>
              <CardDescription>Thiết lập giá cơ bản và giá theo km</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá cơ bản (VND)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Giá khởi điểm cho mỗi đơn hàng
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePerKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá mỗi km (VND)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Giá tính theo khoảng cách
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Matching */}
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình tìm tài xế</CardTitle>
              <CardDescription>Thiết lập bán kính và tần suất cập nhật</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maxMatchingRadiusKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bán kính tìm kiếm (km)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={50} {...field} />
                    </FormControl>
                    <FormDescription>
                      Phạm vi tối đa để tìm tài xế gần nhất
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="driverLocationUpdateIntervalMs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tần suất cập nhật vị trí (ms)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1000} max={60000} step={1000} {...field} />
                    </FormControl>
                    <FormDescription>
                      Khoảng thời gian giữa các lần cập nhật vị trí tài xế (1000ms = 1 giây)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
```

---

## 6. Layout & Navigation

### 6.1. Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 6.2. Sidebar Component

```typescript
// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Map,
  Settings,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Người dùng', href: '/users', icon: Users },
  { name: 'Tài xế', href: '/drivers', icon: Truck },
  { name: 'Đơn hàng', href: '/orders', icon: Package },
  { name: 'Theo dõi', href: '/orders/live', icon: Map },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold">Logship Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <button className="flex items-center gap-3 px-2 py-2 text-sm text-slate-400 hover:text-white w-full">
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
```

---

## 7. API Integration (Hey-API Generated Client)

We use **Hey-API** to auto-generate a type-safe TypeScript client from the NestJS Swagger/OpenAPI spec.

> **Full Hey-API documentation**: See [03-API-Design-Document.md](./03-API-Design-Document.md#13-hey-api-client-generation) and [07-Backend-Architecture.md](./07-Backend-Architecture.md).

### 7.1. Client Configuration

```typescript
// lib/api/client.ts
import { client } from './generated';

// Configure the generated client
export function configureApiClient(accessToken?: string) {
  client.setConfig({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
}

// Initialize on app load
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('accessToken');
  configureApiClient(token ?? undefined);
}
```

### 7.2. Using Generated Query Hooks

```typescript
// hooks/use-drivers.ts
// Using Hey-API generated TanStack Query hooks

import {
  useGetPendingDriversQuery,
  useApproveDriverMutation,
  useRejectDriverMutation,
  type Driver,
} from '@/lib/api/generated/queries';

// Re-export for convenience with custom query key factory
export const driverKeys = {
  all: ['drivers'] as const,
  lists: () => [...driverKeys.all, 'list'] as const,
  pending: () => [...driverKeys.all, 'pending'] as const,
  detail: (id: string) => [...driverKeys.all, 'detail', id] as const,
};

// Use the generated hook directly
export function usePendingDrivers() {
  return useGetPendingDriversQuery();
}

// Generated mutation hooks with optimistic updates
export function useApproveDriver() {
  const queryClient = useQueryClient();

  return useApproveDriverMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.pending() });
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
  });
}

export function useRejectDriver() {
  const queryClient = useQueryClient();

  return useRejectDriverMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.pending() });
    },
  });
}
```

### 7.3. Form Validation with Generated Zod Schemas

```typescript
// Using generated Zod schemas for form validation
import { UpdateSystemConfigBodySchema } from '@/lib/api/generated/zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Extend or use generated schema directly
const settingsSchema = UpdateSystemConfigBodySchema;
type SettingsFormValues = z.infer<typeof settingsSchema>;

export function useSettingsForm(defaultValues: SettingsFormValues) {
  return useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });
}
```

### 7.4. Generating the Client

```bash
# Generate from running backend
npm run api:generate

# Or specify OpenAPI JSON URL directly
npx openapi-ts --input http://localhost:3000/api/docs-json
```

**Hey-API Configuration (`hey-api.config.ts`):**

```typescript
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3000/api/docs-json',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: 'src/lib/api/generated',
  },
  plugins: [
    '@hey-api/sdk',
    '@hey-api/typescript',
    { name: '@hey-api/zod', output: 'zod' },
    { name: '@tanstack/react-query', output: 'queries' },
  ],
});
```

---

## 8. Authentication

```typescript
// lib/auth.ts
import { api, apiRequest } from './api';

export interface AdminUser {
  id: string;
  phone: string;
  name: string;
  role: 'ADMIN';
}

export const authService = {
  async login(phone: string, password: string): Promise<{ accessToken: string; user: AdminUser }> {
    // For admin, we might use password instead of OTP
    const response = await apiRequest<{ accessToken: string; user: AdminUser }>({
      url: '/auth/admin/login',
      method: 'POST',
      data: { phone, password },
    });
    
    localStorage.setItem('accessToken', response.accessToken);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  async getCurrentUser(): Promise<AdminUser> {
    return apiRequest<AdminUser>({ url: '/users/me' });
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
```

---

## 9. Deployment

### 9.1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.logship.example.com/api/v1
NEXT_PUBLIC_SOCKET_URL=wss://api.logship.example.com

# Goong Maps (Vietnam-optimized)
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your-maptiles-key  # For map tiles
NEXT_PUBLIC_GOONG_API_KEY=your-api-key            # For geocoding/directions
```

### 9.2. Build & Deploy

```bash
# Development
npm run dev

# Generate API client (run backend first)
npm run api:generate

# Build
npm run build

# Start production
npm run start

# Deploy to Vercel
vercel deploy --prod
```

### 9.3. Related Documents

| Document | Description |
|----------|-------------|
| [01-SDD-System-Design-Document.md](./01-SDD-System-Design-Document.md) | Overall system architecture |
| [03-API-Design-Document.md](./03-API-Design-Document.md) | API endpoints, Hey-API setup |
| [07-Backend-Architecture.md](./07-Backend-Architecture.md) | Backend details, Swagger config |

---

## 10. Testing Checklist

- [ ] Login with admin credentials
- [ ] View dashboard stats and charts
- [ ] Search and filter users
- [ ] Toggle user active status
- [ ] View pending driver applications
- [ ] Approve/reject driver with documents review
- [ ] View orders list with filters
- [ ] Live tracking map with real-time updates
- [ ] Update system configuration
- [ ] Responsive design (tablet/desktop)
- [ ] Error states and loading skeletons
