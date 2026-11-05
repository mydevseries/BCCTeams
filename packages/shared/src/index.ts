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
  isManual?: boolean;
  lastActiveAt: Date | string;
}

export interface UpdatePresenceDto {
  status?: PresenceStatus;
  statusMessage?: string | null;
  statusExpiresAt?: string | null;
  isManual?: boolean;
  clearMessage?: boolean;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
  };
}

export interface UpdateProfileDto {
  displayName?: string;
  jobTitle?: string | null;
  department?: string | null;
  phoneNumber?: string | null;
}

export interface MemberProfile extends UserProfile {
  presence?: {
    status: PresenceStatus;
    statusMessage?: string | null;
    statusExpiresAt?: string | Date | null;
  } | null;
  localTime?: string;
}

export interface SocketEvents {
  'presence:changed': PresenceState;
  'presence:update': PresenceState;
  'chat:message': unknown;
  'typing:status': {
    chatId: string;
    userId: string;
    isTyping: boolean;
  };
}
