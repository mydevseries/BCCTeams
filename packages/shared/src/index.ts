export type UserRole = 'ADMIN' | 'MEMBER' | 'GUEST';

export type PresenceStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'DO_NOT_DISTURB'
  | 'BE_RIGHT_BACK'
  | 'AWAY'
  | 'OFFLINE';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface PresenceState {
  userId: string;
  status: PresenceStatus;
  statusMessage?: string | null;
  statusExpiresAt?: Date | string | null;
  lastActiveAt: Date | string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
  };
}

export interface SocketEvents {
  'presence:update': PresenceState;
  'chat:message': unknown;
  'typing:status': {
    chatId: string;
    userId: string;
    isTyping: boolean;
  };
}
