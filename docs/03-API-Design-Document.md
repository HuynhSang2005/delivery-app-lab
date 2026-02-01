# Logship-MVP: API Design Document

**Version:** 1.0  
**Last Updated:** January 2025  
**Backend Framework:** NestJS 11.x  
**API Format:** REST + WebSocket (Socket.io)  

---

## 1. Overview

This document defines all API endpoints for Logship-MVP, including REST APIs and WebSocket events.

### 1.1. Base URL

```
Production: https://api.logship.example.com/api/v1
Development: http://localhost:3000/api/v1
WebSocket: wss://api.logship.example.com (or ws://localhost:3000)
```

### 1.2. Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### 1.3. Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "phone", "message": "Invalid phone number format" }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}

// Paginated Response
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 1.4. Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate) |
| 422 | UNPROCESSABLE | Business logic error |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## 2. Authentication APIs

### 2.1. Send OTP

Request OTP to be sent to phone number.

```http
POST /auth/otp/send
```

**Request Body:**
```json
{
  "phone": "+84901234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 300
  }
}
```

**Errors:**
- `400` - Invalid phone format
- `429` - Too many OTP requests (max 3 per 5 minutes)

---

### 2.2. Verify OTP

Verify OTP and get access token.

```http
POST /auth/otp/verify
```

**Request Body:**
```json
{
  "phone": "+84901234567",
  "otp": "123456",
  "firebaseToken": "eyJhbGciOiJS..." // Firebase ID token
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "phone": "+84901234567",
      "name": null,
      "role": "USER",
      "isNewUser": true
    }
  }
}
```

---

### 2.3. Refresh Token

Get new access token using refresh token.

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "expiresIn": 900
  }
}
```

---

### 2.4. Logout

Invalidate refresh token.

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 2.5. Request Email Verification

Send email verification link to user's email address. This is an optional step after phone authentication.

```http
POST /auth/email/request-verification
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent",
    "expiresIn": 3600
  }
}
```

**Errors:**
- `400` - Invalid email format
- `409` - Email already in use by another account
- `429` - Too many requests (max 3 per hour)

---

### 2.6. Verify Email

Complete email verification using the token from the email link.

```http
POST /auth/email/verify
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "token": "firebase-email-verification-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": "uuid",
      "phone": "+84901234567",
      "email": "user@example.com",
      "emailVerified": true
    }
  }
}
```

**Errors:**
- `400` - Invalid or expired token
- `409` - Email already verified

---

### 2.7. Admin Login (Password-based)

Special login for admin users using phone + password.

```http
POST /auth/admin/login
```

**Request Body:**
```json
{
  "phone": "+84901234567",
  "password": "admin-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "phone": "+84901234567",
      "name": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Not an admin user
- `429` - Too many failed attempts (locked for 15 minutes)

---

## 3. User APIs

### 3.1. Get Current User

```http
GET /users/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "+84901234567",
    "name": "Nguyen Van A",
    "avatarUrl": "https://cloudinary.com/...",
    "role": "USER",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "driver": null
  }
}
```

---

### 3.2. Update Profile

```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart):**
```
name: "Nguyen Van A"
avatar: <file>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nguyen Van A",
    "avatarUrl": "https://cloudinary.com/..."
  }
}
```

---

### 3.3. Get User Addresses

```http
GET /users/me/addresses
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "label": "Home",
      "addressLine": "123 Nguyen Van Linh, Quan 7, TP.HCM",
      "lat": 10.7285,
      "lng": 106.7151,
      "isDefault": true
    },
    {
      "id": "uuid",
      "label": "Work",
      "addressLine": "456 Le Van Viet, Quan 9, TP.HCM",
      "lat": 10.8456,
      "lng": 106.7892,
      "isDefault": false
    }
  ]
}
```

---

### 3.4. Add Address

```http
POST /users/me/addresses
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "label": "Home",
  "addressLine": "123 Nguyen Van Linh, Quan 7, TP.HCM",
  "lat": 10.7285,
  "lng": 106.7151,
  "isDefault": true
}
```

---

### 3.5. Delete Address

```http
DELETE /users/me/addresses/:id
Authorization: Bearer <token>
```

---

## 4. Driver APIs

### 4.1. Register as Driver

User registers to become a driver.

```http
POST /drivers/register
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart):**
```
vehiclePlate: "59A-12345"
vehicleType: "MOTORBIKE"
vehiclePhoto: <file>
idCard: <file>
driverLicense: <file>
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "vehiclePlate": "59A-12345",
    "vehicleType": "MOTORBIKE",
    "status": "OFFLINE",
    "isApproved": false,
    "message": "Registration submitted. Waiting for admin approval."
  }
}
```

---

### 4.2. Get Driver Profile

```http
GET /drivers/me
Authorization: Bearer <token>
Roles: DRIVER
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "vehiclePlate": "59A-12345",
    "vehicleType": "MOTORBIKE",
    "vehiclePhotoUrl": "https://cloudinary.com/...",
    "status": "ACTIVE",
    "isApproved": true,
    "approvedAt": "2025-01-14T15:00:00Z",
    "todayStats": {
      "completedOrders": 5,
      "earnings": 150000
    }
  }
}
```

---

### 4.3. Update Driver Status

Toggle driver availability.

```http
PATCH /drivers/me/status
Authorization: Bearer <token>
Roles: DRIVER
```

**Request Body:**
```json
{
  "status": "ACTIVE" // ACTIVE | OFFLINE
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ACTIVE",
    "message": "You are now online and can receive orders"
  }
}
```

---

### 4.4. Update Driver Location

Called periodically (every 5 seconds) by driver app.

```http
POST /drivers/me/location
Authorization: Bearer <token>
Roles: DRIVER
```

**Request Body:**
```json
{
  "lat": 10.7285,
  "lng": 106.7151,
  "heading": 45.5,
  "speed": 25.3,
  "accuracy": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "acknowledged": true
  }
}
```

---

### 4.5. Get Pending Orders for Driver

Orders waiting to be accepted in driver's area.

```http
GET /drivers/me/pending-orders
Authorization: Bearer <token>
Roles: DRIVER
```

**Query Parameters:**
- `lat` (required): Driver's current latitude
- `lng` (required): Driver's current longitude
- `radius` (optional): Search radius in km (default: 5)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-20250115-00001",
      "pickupAddress": "123 Nguyen Van Linh, Q7",
      "dropoffAddress": "456 Le Van Viet, Q9",
      "distanceKm": 12.5,
      "price": 72500,
      "distanceToPickup": 1.2,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## 5. Order APIs

### 5.1. Calculate Order Price

Preview price before creating order.

```http
POST /orders/calculate-price
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "pickup": {
    "lat": 10.7285,
    "lng": 106.7151
  },
  "dropoff": {
    "lat": 10.8456,
    "lng": 106.7892
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "distanceKm": 12.5,
    "basePrice": 10000,
    "distancePrice": 62500,
    "totalPrice": 72500,
    "currency": "VND",
    "estimatedDuration": "25-35 min"
  }
}
```

---

### 5.2. Create Order

```http
POST /orders
Authorization: Bearer <token>
Roles: USER
```

**Request Body:**
```json
{
  "pickup": {
    "address": "123 Nguyen Van Linh, Quan 7, TP.HCM",
    "lat": 10.7285,
    "lng": 106.7151,
    "contactName": "Nguyen Van A",
    "contactPhone": "+84901234567"
  },
  "dropoff": {
    "address": "456 Le Van Viet, Quan 9, TP.HCM",
    "lat": 10.8456,
    "lng": 106.7892,
    "contactName": "Tran Van B",
    "contactPhone": "+84907654321"
  },
  "package": {
    "description": "Electronics - Handle with care",
    "weightKg": 2.5
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250115-00001",
    "status": "PENDING",
    "price": 72500,
    "distanceKm": 12.5,
    "message": "Order created. Finding driver..."
  }
}
```

---

### 5.3. Get Order Details

```http
GET /orders/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250115-00001",
    "status": "DELIVERING",
    "user": {
      "id": "uuid",
      "name": "Nguyen Van A",
      "phone": "+84901234567"
    },
    "driver": {
      "id": "uuid",
      "name": "Tran Van C",
      "phone": "+84909876543",
      "vehiclePlate": "59A-12345",
      "vehicleType": "MOTORBIKE",
      "avatarUrl": "https://cloudinary.com/...",
      "currentLocation": {
        "lat": 10.7500,
        "lng": 106.7300
      }
    },
    "pickup": {
      "address": "123 Nguyen Van Linh, Q7",
      "lat": 10.7285,
      "lng": 106.7151,
      "contactName": "Nguyen Van A",
      "contactPhone": "+84901234567"
    },
    "dropoff": {
      "address": "456 Le Van Viet, Q9",
      "lat": 10.8456,
      "lng": 106.7892,
      "contactName": "Tran Van B",
      "contactPhone": "+84907654321"
    },
    "package": {
      "description": "Electronics - Handle with care",
      "weightKg": 2.5
    },
    "distanceKm": 12.5,
    "price": 72500,
    "createdAt": "2025-01-15T10:30:00Z",
    "assignedAt": "2025-01-15T10:32:00Z",
    "pickedUpAt": "2025-01-15T10:45:00Z"
  }
}
```

---

### 5.4. List User's Orders

```http
GET /orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-20250115-00001",
      "status": "COMPLETED",
      "pickupAddress": "123 Nguyen Van Linh, Q7",
      "dropoffAddress": "456 Le Van Viet, Q9",
      "price": 72500,
      "createdAt": "2025-01-15T10:30:00Z",
      "completedAt": "2025-01-15T11:15:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 5.5. Accept Order (Driver)

Driver accepts a pending order.

```http
POST /orders/:id/accept
Authorization: Bearer <token>
Roles: DRIVER
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-20250115-00001",
    "status": "ASSIGNED",
    "message": "Order accepted. Please proceed to pickup location."
  }
}
```

**Errors:**
- `409` - Order already accepted by another driver
- `422` - Driver is not approved or not active

---

### 5.6. Update Order Status (Driver)

Driver updates order status during delivery.

```http
PATCH /orders/:id/status
Authorization: Bearer <token>
Roles: DRIVER
```

**Request Body:**
```json
{
  "status": "PICKING_UP" // PICKING_UP | DELIVERING | COMPLETED
}
```

For COMPLETED status, include proof:
```json
{
  "status": "COMPLETED",
  "proofImageUrl": "https://cloudinary.com/...",
  "deliveryNotes": "Left at front door"
}
```

---

### 5.7. Cancel Order

```http
POST /orders/:id/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Errors:**
- `422` - Cannot cancel order in DELIVERING or COMPLETED status

---

## 6. Chat APIs

### 6.1. Get Order Messages

```http
GET /orders/:orderId/messages
Authorization: Bearer <token>
```

**Query Parameters:**
- `before` (optional): Get messages before this timestamp
- `limit` (optional): Number of messages (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "Nguyen Van A",
      "senderRole": "USER",
      "content": "Please call when you arrive",
      "type": "TEXT",
      "isRead": true,
      "createdAt": "2025-01-15T10:35:00Z"
    },
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "Tran Van C",
      "senderRole": "DRIVER",
      "content": "https://cloudinary.com/photo.jpg",
      "type": "IMAGE",
      "isRead": false,
      "createdAt": "2025-01-15T10:36:00Z"
    }
  ]
}
```

---

### 6.2. Send Message

```http
POST /orders/:orderId/messages
Authorization: Bearer <token>
```

**Request Body (Text):**
```json
{
  "content": "I'm waiting outside",
  "type": "TEXT"
}
```

**Request Body (Image):**
```json
{
  "content": "https://cloudinary.com/uploaded-image.jpg",
  "type": "IMAGE"
}
```

---

### 6.3. Mark Messages as Read

```http
POST /orders/:orderId/messages/read
Authorization: Bearer <token>
```

---

## 7. Admin APIs

### 7.1. List All Users

```http
GET /admin/users
Authorization: Bearer <token>
Roles: ADMIN
```

**Query Parameters:**
- `role` (optional): Filter by role
- `search` (optional): Search by name or phone
- `page`, `limit`: Pagination

---

### 7.2. Get User Details

```http
GET /admin/users/:id
Authorization: Bearer <token>
Roles: ADMIN
```

---

### 7.3. Toggle User Status

```http
PATCH /admin/users/:id/status
Authorization: Bearer <token>
Roles: ADMIN
```

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Violated terms of service"
}
```

---

### 7.4. List Driver Applications

```http
GET /admin/drivers/pending
Authorization: Bearer <token>
Roles: ADMIN
```

---

### 7.5. Approve/Reject Driver

```http
PATCH /admin/drivers/:id/approval
Authorization: Bearer <token>
Roles: ADMIN
```

**Request Body:**
```json
{
  "isApproved": true
}
```

Or reject:
```json
{
  "isApproved": false,
  "rejectionReason": "Invalid documents"
}
```

---

### 7.6. List All Orders

```http
GET /admin/orders
Authorization: Bearer <token>
Roles: ADMIN
```

**Query Parameters:**
- `status` (optional): Filter by status
- `dateFrom`, `dateTo`: Date range
- `search`: Search by order number

---

### 7.7. Get Dashboard Stats

```http
GET /admin/dashboard/stats
Authorization: Bearer <token>
Roles: ADMIN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "today": {
      "orders": 45,
      "completed": 38,
      "cancelled": 2,
      "revenue": 3250000
    },
    "week": {
      "orders": 312,
      "completed": 289,
      "cancelled": 15,
      "revenue": 22450000
    },
    "drivers": {
      "total": 25,
      "active": 12,
      "pending": 3
    },
    "users": {
      "total": 150,
      "newThisWeek": 12
    }
  }
}
```

---

### 7.8. Update System Config

```http
PATCH /admin/config/:key
Authorization: Bearer <token>
Roles: ADMIN
```

**Request Body:**
```json
{
  "value": {
    "amount": 6000,
    "currency": "VND"
  }
}
```

---

## 8. WebSocket Events

### 8.1. Connection

```typescript
// Client connection with auth
const socket = io('wss://api.logship.example.com', {
  auth: {
    token: 'eyJhbGciOiJIUzI1...'
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('error', (error) => {
  console.error('Connection error:', error);
});
```

### 8.2. Room Subscriptions

```typescript
// Join order room (for tracking)
socket.emit('order:join', { orderId: 'uuid' });

// Leave order room
socket.emit('order:leave', { orderId: 'uuid' });
```

### 8.3. Driver Location Events

**Driver sends location (every 5s):**
```typescript
// Driver app
socket.emit('driver:location', {
  orderId: 'uuid', // Current active order (if any)
  lat: 10.7285,
  lng: 106.7151,
  heading: 45.5,
  speed: 25.3
});
```

**User/Admin receives location:**
```typescript
// User app
socket.on('location:updated', (data) => {
  // data: { orderId, driverId, lat, lng, heading, speed, timestamp }
  updateMarkerPosition(data);
});
```

### 8.4. Order Events

**New order available (to drivers):**
```typescript
socket.on('order:new', (order) => {
  // order: { id, orderNumber, pickupAddress, distanceKm, price }
  showNewOrderNotification(order);
});
```

**Order status changed:**
```typescript
socket.on('order:status', (data) => {
  // data: { orderId, status, updatedAt, driverLocation? }
  updateOrderStatus(data);
});
```

**Order assigned:**
```typescript
socket.on('order:assigned', (data) => {
  // data: { orderId, driver: { id, name, phone, vehiclePlate, location } }
  showDriverAssigned(data);
});
```

### 8.5. Chat Events

**Send message:**
```typescript
socket.emit('chat:message', {
  orderId: 'uuid',
  content: 'Hello',
  type: 'TEXT' // or 'IMAGE'
});
```

**Receive message:**
```typescript
socket.on('chat:message', (message) => {
  // message: { id, orderId, senderId, senderName, content, type, createdAt }
  addMessageToChat(message);
});
```

**Typing indicator:**
```typescript
// Send typing
socket.emit('chat:typing', { orderId: 'uuid' });

// Receive typing
socket.on('chat:typing', (data) => {
  // data: { orderId, userId, userName }
  showTypingIndicator(data);
});
```

**Messages read:**
```typescript
socket.on('chat:read', (data) => {
  // data: { orderId, readBy, readAt }
  markMessagesAsRead(data);
});
```

### 8.6. Notification Events

```typescript
socket.on('notification', (notification) => {
  // notification: { id, title, body, data, createdAt }
  showPushNotification(notification);
});
```

---

## 9. Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Auth (OTP) | 3 requests | 5 minutes |
| Auth (verify) | 5 requests | 5 minutes |
| General API | 100 requests | 1 minute |
| Location updates | 20 requests | 1 minute |
| File uploads | 10 requests | 1 minute |

---

## 10. Validation Rules

### 10.1. Phone Number

```typescript
// Zod schema
const phoneSchema = z.string()
  .regex(/^\+84[0-9]{9,10}$/, 'Invalid Vietnamese phone number');
```

### 10.2. Coordinates

```typescript
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
```

### 10.3. Order Creation

```typescript
const createOrderSchema = z.object({
  pickup: z.object({
    address: z.string().min(10).max(500),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    contactName: z.string().min(2).max(100).optional(),
    contactPhone: phoneSchema.optional(),
  }),
  dropoff: z.object({
    address: z.string().min(10).max(500),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    contactName: z.string().min(2).max(100).optional(),
    contactPhone: phoneSchema.optional(),
  }),
  package: z.object({
    description: z.string().max(1000).optional(),
    weightKg: z.number().min(0.1).max(50).optional(),
  }).optional(),
});
```

---

## 11. NestJS Controller Examples

### 11.1. Orders Controller

```typescript
// src/orders/orders.controller.ts

@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiTags('Orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOneForUser(id, user);
  }

  @Post(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept order as driver' })
  async accept(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.acceptOrder(id, user.driver.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, user.driver.id, dto);
  }
}
```

### 11.2. WebSocket Gateway

```typescript
// src/gateway/events.gateway.ts

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = await this.authService.validateToken(token);
      client.data.user = user;
      
      // Join user's personal room
      client.join(`user:${user.id}`);
      
      this.logger.log(`Client connected: ${client.id}, user: ${user.id}`);
    } catch (error) {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('order:join')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    // Validate user has access to this order
    client.join(`order:${data.orderId}`);
    return { event: 'order:joined', orderId: data.orderId };
  }

  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DriverLocationDto,
  ) {
    const user = client.data.user;
    
    // Update Redis geolocation
    await this.redisService.updateDriverLocation(user.driver.id, data);
    
    // Broadcast to order room if on trip
    if (data.orderId) {
      this.server.to(`order:${data.orderId}`).emit('location:updated', {
        orderId: data.orderId,
        driverId: user.driver.id,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessageDto,
  ) {
    const user = client.data.user;
    
    // Save to database
    const message = await this.messagesService.create({
      orderId: data.orderId,
      senderId: user.id,
      content: data.content,
      type: data.type,
    });
    
    // Broadcast to order room
    this.server.to(`order:${data.orderId}`).emit('chat:message', {
      id: message.id,
      orderId: data.orderId,
      senderId: user.id,
      senderName: user.name,
      content: data.content,
      type: data.type,
      createdAt: message.createdAt,
    });
  }
}
```

---

## 12. OpenAPI/Swagger

Access Swagger UI at: `http://localhost:3000/api/docs`

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Logship API')
    .setDescription('Logship-MVP API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
}
```

---

## 13. Hey-API Client Generation

We use **Hey-API** (`@hey-api/openapi-ts`) to auto-generate type-safe TypeScript clients from our OpenAPI/Swagger spec.

> **Detailed backend implementation**: See [07-Backend-Architecture.md](./07-Backend-Architecture.md) for NestJS Swagger configuration.

### 13.1. Why Hey-API?

| Feature | Hey-API | OpenAPI Generator |
|---------|---------|-------------------|
| Bundle Size | Small, tree-shakable | Large |
| TypeScript | Native, excellent inference | Generated, verbose |
| TanStack Query | Built-in plugin | Manual integration |
| Zod Validation | Built-in plugin | Not supported |
| Maintenance | Active, modern | Slow updates |

### 13.2. Installation & Setup

```bash
# Install in frontend project (admin or mobile)
npm install @hey-api/client-fetch @tanstack/react-query

# Dev dependency for code generation
npm install -D @hey-api/openapi-ts
```

**Configuration file (`hey-api.config.ts`):**

```typescript
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: 'http://localhost:3000/api/docs-json', // NestJS Swagger JSON
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: 'src/lib/api/generated',
  },
  plugins: [
    '@hey-api/sdk',
    '@hey-api/typescript',
    {
      name: '@hey-api/zod',
      output: 'zod',  // Generate Zod schemas
    },
    {
      name: '@tanstack/react-query',
      output: 'queries',
    },
  ],
});
```

**Package.json script:**

```json
{
  "scripts": {
    "api:generate": "openapi-ts",
    "api:watch": "openapi-ts --watch"
  }
}
```

### 13.3. Generated Files Structure

```
src/lib/api/generated/
├── index.ts              # Re-exports all
├── sdk.gen.ts            # Type-safe SDK client
├── types.gen.ts          # TypeScript types from OpenAPI
├── zod.gen.ts            # Zod schemas for validation
└── queries.gen.ts        # TanStack Query hooks
```

### 13.4. Usage Examples

#### Basic SDK Usage

```typescript
import { client, getUsers, createOrder } from '@/lib/api/generated';

// Configure client (once at app startup)
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

// Type-safe API calls
const users = await getUsers({ 
  query: { page: 1, limit: 20 } 
});

const order = await createOrder({
  body: {
    pickupAddress: '123 Main St',
    pickupLat: 10.7769,
    pickupLng: 106.7009,
    dropoffAddress: '456 Other St',
    dropoffLat: 10.7800,
    dropoffLng: 106.7100,
  },
});
```

#### TanStack Query Integration (Admin Dashboard)

```typescript
// Generated query hook usage
import { useGetUsersQuery, useUpdateUserMutation } from '@/lib/api/generated/queries';

export function UsersPage() {
  const [page, setPage] = useState(1);

  // Type-safe query with automatic caching
  const { data, isLoading, error } = useGetUsersQuery({
    query: { page, limit: 20, search: '' },
  });

  // Type-safe mutation
  const updateUser = useUpdateUserMutation();

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    await updateUser.mutateAsync({
      path: { id: userId },
      body: { isActive: !isActive },
    });
  };

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <DataTable
      data={data.users}
      columns={columns}
      pagination={{
        page,
        totalPages: data.meta.totalPages,
        onPageChange: setPage,
      }}
    />
  );
}
```

#### Zod Validation (Forms)

```typescript
import { CreateOrderBodySchema } from '@/lib/api/generated/zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Use generated Zod schema for form validation
const form = useForm({
  resolver: zodResolver(CreateOrderBodySchema),
  defaultValues: {
    pickupAddress: '',
    pickupLat: 0,
    pickupLng: 0,
    dropoffAddress: '',
    dropoffLat: 0,
    dropoffLng: 0,
    packageDescription: '',
  },
});

// Form is fully type-safe and validated against API contract
```

### 13.5. CI/CD Integration

```yaml
# .github/workflows/api-client.yml
name: Generate API Client

on:
  push:
    paths:
      - 'apps/backend/src/**'
    branches: [main]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start backend
        run: |
          cd apps/backend
          npm ci
          npm run start:dev &
          sleep 10  # Wait for server
      
      - name: Generate client
        run: |
          cd apps/admin
          npm ci
          npm run api:generate
      
      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: regenerate API client'
          file_pattern: 'apps/admin/src/lib/api/generated/*'
```

### 13.6. Error Handling with Generated Types

```typescript
import { ApiError } from '@/lib/api/generated';

async function handleApiCall() {
  try {
    const result = await createOrder({ body: orderData });
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      // Type-safe error handling
      switch (error.status) {
        case 400:
          // ValidationError - error.body.details available
          console.error('Validation:', error.body.error.details);
          break;
        case 401:
          // Unauthorized - redirect to login
          router.push('/login');
          break;
        case 429:
          // Rate limited
          toast.error('Too many requests. Please wait.');
          break;
        default:
          toast.error(error.body.error.message);
      }
    }
    throw error;
  }
}
```

---

## 14. Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Auth (OTP send) | 3 requests | 5 minutes |
| Auth (general) | 10 requests | 1 minute |
| User APIs | 100 requests | 1 minute |
| Driver location | 60 requests | 1 minute |
| Admin APIs | 200 requests | 1 minute |
| WebSocket events | 100 messages | 1 minute |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```
