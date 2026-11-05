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

export interface UserSettings {
  userId: string;
  theme: string;
  language: string;
  notifyBanners: boolean;
  notifySounds: boolean;
  notifyEmailDigest: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workLocation?: string;
  readReceipts?: boolean;
  chatDensity?: string;
  enterToSend?: boolean;
  updatedAt?: Date | string;
}

export interface UpdateSettingsDto {
  theme?: string;
  language?: string;
  notifyBanners?: boolean;
  notifySounds?: boolean;
  notifyEmailDigest?: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workLocation?: string;
  readReceipts?: boolean;
  chatDensity?: string;
  enterToSend?: boolean;
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

export type ConversationType = 'DIRECT' | 'GROUP';
export type ParticipantRole = 'ADMIN' | 'MEMBER';

export interface ChatParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: Date | string;
  lastReadAt: Date | string;
  isPinned: boolean;
  isMuted: boolean;
  user: UserProfile & {
    presence?: {
      status: PresenceStatus;
      statusMessage?: string | null;
      statusExpiresAt?: string | Date | null;
    } | null;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isEdited: boolean;
  isDeleted: boolean;
  isSystem?: boolean;
  systemAction?: string | null;
  metadata?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
  sender?: UserProfile;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isHidden?: boolean;
  otherParticipant?: ChatParticipant['user'];
}

export interface CreateDirectChatDto {
  recipientId: string;
}

export interface CreateGroupChatDto {
  recipientIds: string[];
  title?: string;
}

export interface UpdateConversationDto {
  title?: string;
}

export type HistoryShareOption = 'none' | 'all' | 'days';

export interface AddParticipantDto {
  userId: string;
  historyOption?: HistoryShareOption;
  historyDays?: number;
}

export interface SendMessageDto {
  content: string;
}
