---
name: socket-io-nestjs-react-native
description: Use when implementing real-time features with Socket.io in NestJS backend and React Native frontend. Covers room-based messaging, driver tracking, chat systems, and reconnection strategies.
---

# Socket.io with NestJS and React Native

Real-time communication patterns for logistics and delivery applications using Socket.io.

## When to Use

- Real-time driver location tracking
- In-app chat per order
- Live order status updates
- Push notifications alternative
- Driver-to-user communication

## NestJS Backend Setup

### Gateway Configuration

```typescript
// gateway/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../shared/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  async handleConnection(socket: Socket) {
    try {
      // Verify JWT token from auth header
      const token = socket.handshake.auth.token;
      const user = await this.validateToken(token);
      
      socket.data.user = user;
      this.userSockets.set(user.id, socket.id);
      
      console.log(`User ${user.id} connected`);
    } catch (error) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.user?.id;
    if (userId) {
      this.userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  // Join order room for real-time updates
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('order:join')
  handleJoinOrder(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    socket.join(`order:${data.orderId}`);
    socket.emit('order:joined', { orderId: data.orderId });
  }

  // Driver location updates
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('driver:location')
  handleDriverLocation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number },
  ) {
    // Broadcast to order room
    this.server.to(`order:${data.orderId}`).emit('location:updated', {
      orderId: data.orderId,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date(),
    });
  }

  // Chat messages
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { orderId: string; content: string; type: 'TEXT' | 'IMAGE' },
  ) {
    const user = socket.data.user;
    
    // Save to database
    const message = await this.chatService.saveMessage({
      orderId: data.orderId,
      senderId: user.id,
      content: data.content,
      type: data.type,
    });

    // Broadcast to order room
    this.server.to(`order:${data.orderId}`).emit('chat:message', {
      id: message.id,
      senderId: user.id,
      senderName: user.name,
      content: data.content,
      type: data.type,
      createdAt: message.createdAt,
    });
  }

  // Send to specific user
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Broadcast to order room
  broadcastToOrder(orderId: string, event: string, data: any) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }
}
```

### WebSocket JWT Guard

```typescript
// shared/guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient();
    const token = socket.handshake.auth.token;

    try {
      const payload = this.jwtService.verify(token);
      socket.data.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
```

## React Native Client Setup

### Socket Service

```typescript
// services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    const token = useAuthStore.getState().accessToken;
    
    if (!token) {
      console.error('No auth token available');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Order events
    this.socket.on('order:status', (data) => {
      console.log('Order status updated:', data);
      // Update cache
    });

    this.socket.on('order:assigned', (data) => {
      console.log('Order assigned:', data);
    });

    // Location events
    this.socket.on('location:updated', (data) => {
      console.log('Driver location updated:', data);
    });

    // Chat events
    this.socket.on('chat:message', (message) => {
      console.log('New message:', message);
    });
  }

  // Join order room
  joinOrderRoom(orderId: string): void {
    this.socket?.emit('order:join', { orderId });
  }

  // Leave order room
  leaveOrderRoom(orderId: string): void {
    this.socket?.emit('order:leave', { orderId });
  }

  // Send driver location
  emitDriverLocation(orderId: string, lat: number, lng: number): void {
    this.socket?.emit('driver:location', { orderId, lat, lng });
  }

  // Send chat message
  sendMessage(orderId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT'): void {
    this.socket?.emit('chat:message', { orderId, content, type });
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
```

### Socket Hook

```typescript
// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/stores/authStore';

export function useSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - reconnect if needed
        if (isAuthenticated && !socketService.isConnected()) {
          socketService.connect();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  return {
    isConnected: socketService.isConnected(),
    joinOrderRoom: socketService.joinOrderRoom.bind(socketService),
    leaveOrderRoom: socketService.leaveOrderRoom.bind(socketService),
    sendMessage: socketService.sendMessage.bind(socketService),
    emitDriverLocation: socketService.emitDriverLocation.bind(socketService),
  };
}
```

## Usage Examples

### Order Tracking Screen

```typescript
// app/order/tracking.tsx
export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { joinOrderRoom, leaveOrderRoom, isConnected } = useSocket();
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    if (id && isConnected) {
      joinOrderRoom(id);
      
      // Listen for location updates
      const unsubscribe = socketService.on('location:updated', (data) => {
        if (data.orderId === id) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      });

      return () => {
        unsubscribe();
        leaveOrderRoom(id);
      };
    }
  }, [id, isConnected]);

  return (
    <View>
      <MapView>
        {driverLocation && (
          <Marker coordinate={driverLocation} />
        )}
      </MapView>
    </View>
  );
}
```

### Chat Screen

```typescript
// app/chat/[orderId].tsx
export default function ChatScreen() {
  const { orderId } = useLocalSearchParams();
  const { sendMessage, joinOrderRoom, leaveOrderRoom } = useSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    joinOrderRoom(orderId);
    
    const unsubscribe = socketService.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubscribe();
      leaveOrderRoom(orderId);
    };
  }, [orderId]);

  const handleSend = (content: string) => {
    sendMessage(orderId, content, 'TEXT');
  };

  return (
    <GiftedChat
      messages={messages}
      onSend={handleSend}
    />
  );
}
```

## Best Practices

1. **Room-based architecture**: Use rooms per order (`order:${orderId}`)
2. **JWT authentication**: Verify tokens on connection
3. **Reconnection strategy**: Exponential backoff with max attempts
4. **Cleanup on unmount**: Always leave rooms when component unmounts
5. **App state handling**: Reconnect when app comes to foreground

## Common Pitfalls

- **Memory leaks**: Not leaving rooms on unmount
- **Auth issues**: Token expiration during connection
- **Reconnection loops**: Not limiting reconnection attempts
- **Race conditions**: Sending messages before connection established

## Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [React Native AppState](https://reactnative.dev/docs/appstate)
