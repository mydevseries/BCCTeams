import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PresenceStatus, PresenceState } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';

interface PresenceContextType {
  myPresence: PresenceState;
  presences: Record<string, PresenceState>;
  socket: Socket | null;
  setMyStatus: (status: PresenceStatus, isManual?: boolean) => Promise<void>;
  setMyStatusMessage: (message: string, expiresAt?: string | null) => Promise<void>;
  clearMyStatusMessage: () => Promise<void>;
  subscribeUsers: (userIds: string[]) => void;
  unsubscribeUsers: (userIds: string[]) => void;
  getUserPresence: (userId: string) => PresenceState;
}

const defaultPresence: PresenceState = {
  userId: '',
  status: 'AVAILABLE',
  isManual: false,
  statusMessage: null,
  statusExpiresAt: null,
  lastActiveAt: new Date().toISOString(),
};

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [myPresence, setMyPresence] = useState<PresenceState>(defaultPresence);
  const [presences, setPresences] = useState<Record<string, PresenceState>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedUserIdsRef = useRef<Set<string>>(new Set());

  // Helper to fetch current presence
  const fetchMyPresence = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/presence/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyPresence(data);
      }
    } catch {
      // Offline fallback
    }
  }, [token]);

  // Initialize socket connection and presence listeners
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Initialize presence for this user connection
      newSocket.emit('presence:init', { userId: user.id }, (res: any) => {
        if (res?.presence) {
          setMyPresence(res.presence);
        }
      });

      // Resubscribe to visible users on reconnect
      if (subscribedUserIdsRef.current.size > 0) {
        newSocket.emit('presence:subscribe', {
          userIds: Array.from(subscribedUserIdsRef.current),
        });
      }
    });

    // Listen for scoped presence changes
    newSocket.on('presence:changed', (data: PresenceState) => {
      if (data.userId === user.id) {
        setMyPresence((prev) => ({
          ...prev,
          ...data,
        }));
      }
      setPresences((prev) => ({
        ...prev,
        [data.userId]: data,
      }));
    });

    fetchMyPresence();

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user, token, fetchMyPresence]);

  // Set user presence status with instant optimistic update
  const setMyStatus = useCallback(
    async (status: PresenceStatus, isManual = true) => {
      if (!token) return;

      // 1. Instant optimistic update (0ms perceived latency)
      setMyPresence((prev) => ({
        ...prev,
        status,
        isManual,
      }));
      if (user) {
        setPresences((prev) => ({
          ...prev,
          [user.id]: {
            ...(prev[user.id] || {
              userId: user.id,
              statusMessage: null,
              lastActiveAt: new Date(),
            }),
            userId: user.id,
            status,
            isManual,
            lastActiveAt: new Date(),
          },
        }));
      }

      // 2. Synchronize with backend in background
      try {
        const res = await fetch('/api/presence/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, isManual }),
        });
        if (res.ok) {
          const updated = await res.json();
          setMyPresence(updated);
        }
      } catch (err) {
        console.error('Failed to update presence status', err);
      }
    },
    [token, user]
  );

  // Set status message with instant optimistic update
  const setMyStatusMessage = useCallback(
    async (message: string, expiresAt?: string | null) => {
      if (!token) return;

      // 1. Instant optimistic update
      setMyPresence((prev) => ({
        ...prev,
        statusMessage: message,
        statusExpiresAt: expiresAt ? new Date(expiresAt) : null,
      }));
      if (user) {
        setPresences((prev) => ({
          ...prev,
          [user.id]: {
            ...(prev[user.id] || {
              userId: user.id,
              status: 'AVAILABLE' as PresenceStatus,
              isManual: false,
              lastActiveAt: new Date(),
            }),
            statusMessage: message,
            statusExpiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        }));
      }

      // 2. Sync with backend
      try {
        const res = await fetch('/api/presence/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            statusMessage: message,
            statusExpiresAt: expiresAt || null,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setMyPresence(updated);
        }
      } catch (err) {
        console.error('Failed to set status message', err);
      }
    },
    [token, user]
  );

  // Clear status message with instant optimistic update
  const clearMyStatusMessage = useCallback(async () => {
    if (!token) return;

    // 1. Instant optimistic update
    setMyPresence((prev) => ({
      ...prev,
      statusMessage: null,
      statusExpiresAt: null,
    }));
    if (user) {
      setPresences((prev) => ({
        ...prev,
        [user.id]: {
          ...(prev[user.id] || {
            userId: user.id,
            status: 'AVAILABLE' as PresenceStatus,
            isManual: false,
            lastActiveAt: new Date(),
          }),
          statusMessage: null,
          statusExpiresAt: null,
        },
      }));
    }

    // 2. Sync with backend
    try {
      const res = await fetch('/api/presence/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clearMessage: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMyPresence(updated);
      }
    } catch (err) {
      console.error('Failed to clear status message', err);
    }
  }, [token, user]);

  // Dynamic user subscriptions for presence
  const subscribeUsers = useCallback((userIds: string[]) => {
    if (!socketRef.current || !userIds || userIds.length === 0) return;

    const toSubscribe = userIds.filter((id) => !subscribedUserIdsRef.current.has(id));
    if (toSubscribe.length === 0) return;

    toSubscribe.forEach((id) => subscribedUserIdsRef.current.add(id));
    socketRef.current.emit('presence:subscribe', { userIds: toSubscribe });
  }, []);

  const unsubscribeUsers = useCallback((userIds: string[]) => {
    if (!socketRef.current || !userIds || userIds.length === 0) return;

    userIds.forEach((id) => subscribedUserIdsRef.current.delete(id));
    socketRef.current.emit('presence:unsubscribe', { userIds });
  }, []);

  const getUserPresence = useCallback(
    (userId: string): PresenceState => {
      if (userId === user?.id) return myPresence;
      return (
        presences[userId] || {
          userId,
          status: 'OFFLINE',
          lastActiveAt: new Date().toISOString(),
        }
      );
    },
    [user?.id, myPresence, presences]
  );

  // Activity detection & idle timer (5 minutes inactivity -> Away)
  useEffect(() => {
    if (!user || !token) return;

    const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
    const HEARTBEAT_INTERVAL_MS = 15 * 1000;

    const sendHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatRef.current = now;
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('presence:heartbeat', { userId: user.id });
        }
      }
    };

    const handleUserActivity = () => {
      sendHeartbeat();

      // If user was automatically transitioned to Away and is NOT manually away, restore Available
      if (myPresence.status === 'AWAY' && !myPresence.isManual) {
        setMyStatus('AVAILABLE', false);
      }

      // Reset 5-minute idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        // Automatically set to AWAY if not manually set to another status
        if (!myPresence.isManual && myPresence.status !== 'OFFLINE') {
          setMyStatus('AWAY', false);
        }
      }, IDLE_TIMEOUT_MS);
    };

    // Attach DOM event listeners for user input
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // Initial heartbeat
    sendHeartbeat();

    // Start idle timer
    idleTimerRef.current = setTimeout(() => {
      if (!myPresence.isManual && myPresence.status !== 'OFFLINE') {
        setMyStatus('AWAY', false);
      }
    }, IDLE_TIMEOUT_MS);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [user, token, myPresence.status, myPresence.isManual, setMyStatus]);

  return (
    <PresenceContext.Provider
      value={{
        myPresence,
        presences,
        socket,
        setMyStatus,
        setMyStatusMessage,
        clearMyStatusMessage,
        subscribeUsers,
        unsubscribeUsers,
        getUserPresence,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
