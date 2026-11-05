import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PresenceStatus, PresenceState } from '@bcc/shared';
import { useAuth } from '../auth/AuthContext';

interface PresenceContextType {
  myPresence: PresenceState;
  presences: Record<string, PresenceState>;
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
      }
      return;
    }

    const socketUrl = window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Initialize presence for this user connection
      socket.emit('presence:init', { userId: user.id }, (res: any) => {
        if (res?.presence) {
          setMyPresence(res.presence);
        }
      });

      // Resubscribe to visible users on reconnect
      if (subscribedUserIdsRef.current.size > 0) {
        socket.emit('presence:subscribe', {
          userIds: Array.from(subscribedUserIdsRef.current),
        });
      }
    });

    // Listen for scoped presence changes
    socket.on('presence:changed', (data: PresenceState) => {
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
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token, fetchMyPresence]);

  // Set user presence status
  const setMyStatus = useCallback(
    async (status: PresenceStatus, isManual = true) => {
      if (!token) return;

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
    [token],
  );

  // Set custom status message with expiry
  const setMyStatusMessage = useCallback(
    async (message: string, expiresAt?: string | null) => {
      if (!token) return;

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
        console.error('Failed to update status message', err);
      }
    },
    [token],
  );

  // Clear custom status message
  const clearMyStatusMessage = useCallback(async () => {
    if (!token) return;

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
  }, [token]);

  // Subscribe to visible users
  const subscribeUsers = useCallback(
    (userIds: string[]) => {
      const newIds = userIds.filter((id) => id && !subscribedUserIdsRef.current.has(id));
      if (newIds.length === 0) return;

      for (const id of newIds) {
        subscribedUserIdsRef.current.add(id);
      }

      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'presence:subscribe',
          { userIds: newIds },
          (res: any) => {
            if (res?.presences) {
              setPresences((prev) => ({
                ...prev,
                ...res.presences,
              }));
            }
          },
        );
      } else {
        // Fallback fetch via REST batch
        if (token) {
          fetch('/api/presence/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userIds: newIds }),
          })
            .then((res) => res.json())
            .then((batch) => {
              setPresences((prev) => ({ ...prev, ...batch }));
            })
            .catch(() => {});
        }
      }
    },
    [token],
  );

  // Unsubscribe from users
  const unsubscribeUsers = useCallback((userIds: string[]) => {
    for (const id of userIds) {
      subscribedUserIdsRef.current.delete(id);
    }
    if (socketRef.current?.connected) {
      socketRef.current.emit('presence:unsubscribe', { userIds });
    }
  }, []);

  const getUserPresence = useCallback(
    (userId: string): PresenceState => {
      if (user && userId === user.id) return myPresence;
      return (
        presences[userId] || {
          userId,
          status: 'OFFLINE',
          lastActiveAt: new Date().toISOString(),
        }
      );
    },
    [user, myPresence, presences],
  );

  // Inactivity tracking (5 minutes) and Heartbeat throttling
  useEffect(() => {
    if (!user || !token) return;

    const resetIdleTimer = () => {
      // Throttle socket heartbeat (at most once every 15 seconds)
      const now = Date.now();
      if (now - lastHeartbeatRef.current > 15000) {
        lastHeartbeatRef.current = now;
        if (socketRef.current?.connected) {
          socketRef.current.emit('presence:heartbeat', { userId: user.id });
        }
      }

      // If user was automatically set to Away, restore to Available immediately upon activity
      if (myPresence.status === 'AWAY' && !myPresence.isManual) {
        setMyStatus('AVAILABLE', false);
      }

      // Reset 5-minute inactivity timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        // If status was AVAILABLE and NOT manual, transition to auto-Away
        if (myPresence.status === 'AVAILABLE' && !myPresence.isManual) {
          setMyStatus('AWAY', false);
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    // User activity events
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    for (const evt of events) {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    }

    // Initialize timer
    resetIdleTimer();

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, resetIdleTimer);
      }
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

