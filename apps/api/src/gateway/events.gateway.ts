import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { PresenceService } from '../presence/presence.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    @Inject(forwardRef(() => PresenceService))
    private readonly presenceService: PresenceService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.presenceService.handleDisconnect(client.id);
  }

  @SubscribeMessage('presence:init')
  async handlePresenceInit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (!data?.userId) return { error: 'userId required' };
    client.join(`user:${data.userId}`);
    const presence = await this.presenceService.handleConnect(data.userId, client.id);
    return { status: 'initialized', presence };
  }

  @SubscribeMessage('presence:subscribe')
  async handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    if (!data?.userIds || !Array.isArray(data.userIds)) return { error: 'userIds array required' };
    for (const userId of data.userIds) {
      client.join(`presence:${userId}`);
    }
    const currentStates = await this.presenceService.getBatchPresence(data.userIds);
    return { status: 'subscribed', userIds: data.userIds, presences: currentStates };
  }

  @SubscribeMessage('presence:unsubscribe')
  handlePresenceUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    if (!data?.userIds || !Array.isArray(data.userIds)) return { error: 'userIds array required' };
    for (const userId of data.userIds) {
      client.leave(`presence:${userId}`);
    }
    return { status: 'unsubscribed', userIds: data.userIds };
  }

  @SubscribeMessage('presence:heartbeat')
  async handlePresenceHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data?.userId) {
      await this.presenceService.handleHeartbeat(data.userId, client.id);
    }
    return { status: 'heartbeat_received' };
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'room:joined', room };
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'room:left', room };
  }

  emitToRoom(room: string, event: string, payload: unknown) {
    if (this.server) {
      this.server.to(room).emit(event, payload);
    }
  }
}
