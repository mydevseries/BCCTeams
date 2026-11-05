import {
  Injectable,
  Inject,
  forwardRef,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { PresenceStatus, Presence } from '@prisma/client';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { PresenceState } from '@bcc/shared';

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);

  // Connection tracking: userId -> Map<socketId, lastActiveTimestamp>
  private userConnections = new Map<string, Map<string, number>>();
  // Socket mapping: socketId -> userId
  private socketToUser = new Map<string, string>();
  // 30-second disconnect grace timers: userId -> NodeJS.Timeout
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  private expiryInterval: NodeJS.Timeout | null = null;
  private inactivityInterval: NodeJS.Timeout | null = null;

  // Inactivity threshold: 5 minutes (in milliseconds)
  public static readonly INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;
  // Disconnect grace period: 30 seconds (in milliseconds)
  public static readonly DISCONNECT_GRACE_MS = 30 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly gateway: EventsGateway,
  ) {}

  onModuleInit() {
    // Run status message expiry cleanup every 30 seconds
    this.expiryInterval = setInterval(() => {
      this.checkExpiredStatusMessages().catch((err) =>
        this.logger.error(`Error checking expired status messages: ${err.message}`),
      );
    }, 30000);

    // Run inactivity check every 30 seconds
    this.inactivityInterval = setInterval(() => {
      this.checkInactivity().catch((err) =>
        this.logger.error(`Error checking inactivity: ${err.message}`),
      );
    }, 30000);
  }

  onModuleDestroy() {
    if (this.expiryInterval) clearInterval(this.expiryInterval);
    if (this.inactivityInterval) clearInterval(this.inactivityInterval);
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();
  }

  /**
   * Handle socket connection for an authenticated user.
   */
  async handleConnect(userId: string, socketId: string): Promise<PresenceState> {
    // 1. Cancel pending disconnect grace timer if user reconnected within 30s
    if (this.disconnectTimers.has(userId)) {
      clearTimeout(this.disconnectTimers.get(userId)!);
      this.disconnectTimers.delete(userId);
      this.logger.log(`User ${userId} reconnected within grace period. Disconnect timer canceled.`);
    }

    // 2. Register socket connection
    let conns = this.userConnections.get(userId);
    if (!conns) {
      conns = new Map<string, number>();
      this.userConnections.set(userId, conns);
    }
    conns.set(socketId, Date.now());
    this.socketToUser.set(socketId, userId);

    // 3. Retrieve or create presence record
    let presence = await this.prisma.presence.findUnique({
      where: { userId },
    });

    if (!presence) {
      presence = await this.prisma.presence.create({
        data: {
          userId,
          status: PresenceStatus.AVAILABLE,
          isManual: false,
          lastActiveAt: new Date(),
        },
      });
      this.broadcastPresence(userId, presence);
    } else if (presence.status === PresenceStatus.OFFLINE && !presence.isManual) {
      // Reconnected after grace period had expired - restore previous status if available
      const restoredStatus = presence.savedStatus || PresenceStatus.AVAILABLE;
      presence = await this.prisma.presence.update({
        where: { userId },
        data: {
          status: restoredStatus,
          savedStatus: null,
          isManual: false,
          lastActiveAt: new Date(),
        },
      });
      this.broadcastPresence(userId, presence);
    }

    return this.mapToState(presence);
  }

  /**
   * Handle socket disconnection.
   */
  handleDisconnect(socketId: string) {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return;

    this.socketToUser.delete(socketId);
    const conns = this.userConnections.get(userId);
    if (conns) {
      conns.delete(socketId);
      if (conns.size === 0) {
        this.userConnections.delete(userId);
        this.scheduleDisconnectGrace(userId);
      }
    }
  }

  /**
   * Start 30-second grace timer when last tab/socket disconnects.
   */
  private scheduleDisconnectGrace(userId: string) {
    if (this.disconnectTimers.has(userId)) {
      clearTimeout(this.disconnectTimers.get(userId)!);
    }

    const timer = setTimeout(async () => {
      this.disconnectTimers.delete(userId);

      // Verify user has not reconnected
      const conns = this.userConnections.get(userId);
      if (!conns || conns.size === 0) {
        try {
          const current = await this.prisma.presence.findUnique({ where: { userId } });
          if (current && current.status !== PresenceStatus.OFFLINE) {
            const updated = await this.prisma.presence.update({
              where: { userId },
              data: {
                status: PresenceStatus.OFFLINE,
                savedStatus: current.status,
                lastActiveAt: new Date(),
              },
            });
            this.broadcastPresence(userId, updated);
            this.logger.log(`User ${userId} marked OFFLINE after 30s grace period.`);
          }
        } catch (err: any) {
          this.logger.error(`Failed to mark user ${userId} offline: ${err.message}`);
        }
      }
    }, PresenceService.DISCONNECT_GRACE_MS);

    this.disconnectTimers.set(userId, timer);
  }

  /**
   * User activity heartbeat (from mouse/keyboard interaction).
   */
  async handleHeartbeat(userId: string, socketId: string): Promise<void> {
    const conns = this.userConnections.get(userId);
    if (conns) {
      conns.set(socketId, Date.now());
    }

    const presence = await this.prisma.presence.findUnique({ where: { userId } });
    if (!presence) return;

    // Rule 2: Inactivity transitions back to AVAILABLE ONLY IF it was set to AWAY automatically.
    // Manual statuses (BUSY, DND, AWAY, OFFLINE) are NEVER overridden by heartbeats.
    if (presence.status === PresenceStatus.AWAY && !presence.isManual) {
      const updated = await this.prisma.presence.update({
        where: { userId },
        data: {
          status: PresenceStatus.AVAILABLE,
          isManual: false,
          lastActiveAt: new Date(),
        },
      });
      this.broadcastPresence(userId, updated);
      this.logger.log(`User ${userId} activity restored status to AVAILABLE.`);
    }
  }

  /**
   * Periodic check: if ALL connections of a user are inactive for 5 minutes, auto-transition to Away.
   */
  async checkInactivity(): Promise<void> {
    const now = Date.now();

    for (const [userId, conns] of this.userConnections.entries()) {
      if (conns.size === 0) continue;

      // Find the most recent activity across all connections/tabs
      const mostRecentActivity = Math.max(...Array.from(conns.values()));
      const idleTime = now - mostRecentActivity;

      if (idleTime >= PresenceService.INACTIVITY_THRESHOLD_MS) {
        const presence = await this.prisma.presence.findUnique({ where: { userId } });
        // Rule: Auto-Away ONLY triggers if status was AVAILABLE and NOT manual
        if (presence && presence.status === PresenceStatus.AVAILABLE && !presence.isManual) {
          const updated = await this.prisma.presence.update({
            where: { userId },
            data: {
              status: PresenceStatus.AWAY,
              isManual: false,
              lastActiveAt: new Date(),
            },
          });
          this.broadcastPresence(userId, updated);
          this.logger.log(`User ${userId} transitioned to auto-AWAY after 5m inactivity across all tabs.`);
        }
      }
    }
  }

  /**
   * Periodic check: clear expired custom status messages.
   */
  async checkExpiredStatusMessages(): Promise<void> {
    const now = new Date();
    const expiredList = await this.prisma.presence.findMany({
      where: {
        statusExpiresAt: {
          lte: now,
        },
      },
    });

    if (expiredList.length === 0) return;

    for (const p of expiredList) {
      const updated = await this.prisma.presence.update({
        where: { userId: p.userId },
        data: {
          statusMessage: null,
          statusExpiresAt: null,
        },
      });
      this.broadcastPresence(p.userId, updated);
      this.logger.log(`Cleared expired status message for user ${p.userId}.`);
    }
  }

  /**
   * Update presence via REST or Socket.
   */
  async updatePresence(userId: string, dto: UpdatePresenceDto): Promise<PresenceState> {
    const current = await this.prisma.presence.findUnique({ where: { userId } });

    const dataToUpdate: any = {
      lastActiveAt: new Date(),
    };

    if (dto.status !== undefined) {
      dataToUpdate.status = dto.status;
      // Mark manual if explicitly flagged or set by user
      dataToUpdate.isManual = dto.isManual !== undefined ? dto.isManual : true;

      // If user sets "Appear offline"
      if (dto.status === PresenceStatus.OFFLINE) {
        dataToUpdate.isManual = true;
      }
    }

    if (dto.clearMessage) {
      dataToUpdate.statusMessage = null;
      dataToUpdate.statusExpiresAt = null;
    } else {
      if (dto.statusMessage !== undefined) {
        dataToUpdate.statusMessage = dto.statusMessage;
      }
      if (dto.statusExpiresAt !== undefined) {
        dataToUpdate.statusExpiresAt = dto.statusExpiresAt ? new Date(dto.statusExpiresAt) : null;
      }
    }

    const updated = await this.prisma.presence.upsert({
      where: { userId },
      create: {
        userId,
        status: dto.status || PresenceStatus.AVAILABLE,
        isManual: dto.isManual !== undefined ? dto.isManual : true,
        statusMessage: dto.statusMessage || null,
        statusExpiresAt: dto.statusExpiresAt ? new Date(dto.statusExpiresAt) : null,
        lastActiveAt: new Date(),
      },
      update: dataToUpdate,
    });

    this.broadcastPresence(userId, updated);
    return this.mapToState(updated);
  }

  /**
   * Get presence for a single user.
   */
  async getPresence(userId: string): Promise<PresenceState> {
    const presence = await this.prisma.presence.findUnique({
      where: { userId },
    });

    if (!presence) {
      return {
        userId,
        status: 'OFFLINE',
        lastActiveAt: new Date(),
      };
    }

    return this.mapToState(presence);
  }

  /**
   * Get presence for a list of users (batch query).
   */
  async getBatchPresence(userIds: string[]): Promise<Record<string, PresenceState>> {
    const list = await this.prisma.presence.findMany({
      where: { userId: { in: userIds } },
    });

    const result: Record<string, PresenceState> = {};
    for (const p of list) {
      result[p.userId] = this.mapToState(p);
    }

    // Default missing users to OFFLINE
    for (const id of userIds) {
      if (!result[id]) {
        result[id] = {
          userId: id,
          status: 'OFFLINE',
          lastActiveAt: new Date(),
        };
      }
    }

    return result;
  }

  /**
   * DND Helper for notifications service.
   */
  async isDnd(userId: string): Promise<boolean> {
    const p = await this.prisma.presence.findUnique({
      where: { userId },
      select: { status: true },
    });
    return p?.status === PresenceStatus.DO_NOT_DISTURB;
  }

  /**
   * Broadcast presence change to scoped room `presence:<userId>` and `user:<userId>`.
   */
  public broadcastPresence(userId: string, presence: Presence | PresenceState) {
    const state: PresenceState = 'updatedAt' in presence ? this.mapToState(presence) : presence;
    // Scoped presence room for all clients watching this user
    this.gateway.emitToRoom(`presence:${userId}`, 'presence:changed', state);
    // User room for syncing across the user's multiple open tabs
    this.gateway.emitToRoom(`user:${userId}`, 'presence:changed', state);
  }

  private mapToState(p: Presence): PresenceState {
    return {
      userId: p.userId,
      status: p.status as any,
      statusMessage: p.statusMessage,
      statusExpiresAt: p.statusExpiresAt,
      isManual: p.isManual,
      lastActiveAt: p.lastActiveAt,
    };
  }

  // Exposed helper for testing connection tracking
  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  hasDisconnectTimer(userId: string): boolean {
    return this.disconnectTimers.has(userId);
  }
}

