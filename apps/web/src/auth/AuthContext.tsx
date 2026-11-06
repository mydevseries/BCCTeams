import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { UserProfile, AuthResponse } from '@bcc/shared';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, keepSignedIn: boolean) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

// Storage keys
const KEYS = {
  PERSIST_PREF: 'bcc_keep_signed_in', // always localStorage
  ACCESS_TOKEN: 'bcc_access_token',
  REFRESH_TOKEN: 'bcc_refresh_token',
  USER: 'bcc_user',
};

function getStorage(persist: boolean): Storage {
  return persist ? localStorage : sessionStorage;
}

function readPersistPref(): boolean {
  return localStorage.getItem(KEYS.PERSIST_PREF) !== 'false'; // default true
}

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  const accessToken =
    localStorage.getItem(KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(KEYS.ACCESS_TOKEN);
  const refreshToken =
    localStorage.getItem(KEYS.REFRESH_TOKEN) ||
    sessionStorage.getItem(KEYS.REFRESH_TOKEN);
  return { accessToken, refreshToken };
}

function getStoredUser(): UserProfile | null {
  const raw =
    localStorage.getItem(KEYS.USER) || sessionStorage.getItem(KEYS.USER);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistTokens(
  accessToken: string,
  refreshToken: string,
  user: UserProfile,
  keepSignedIn: boolean
) {
  const store = getStorage(keepSignedIn);
  store.setItem(KEYS.ACCESS_TOKEN, accessToken);
  store.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  store.setItem(KEYS.USER, JSON.stringify(user));
  localStorage.setItem(KEYS.PERSIST_PREF, String(keepSignedIn));

  // Clear the other store to avoid stale data
  const other = getStorage(!keepSignedIn);
  other.removeItem(KEYS.ACCESS_TOKEN);
  other.removeItem(KEYS.REFRESH_TOKEN);
  other.removeItem(KEYS.USER);
}

function clearTokens() {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(KEYS.ACCESS_TOKEN);
    s.removeItem(KEYS.REFRESH_TOKEN);
    s.removeItem(KEYS.USER);
  });
}

/** Decode JWT expiry (seconds since epoch) without a library. */
function getJwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

async function fetchProfile(accessToken: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) return res.json();
    return null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredTokens().accessToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Silently refresh access token using the stored refresh token. */
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data: { accessToken: string; refreshToken: string; expiresIn: number } =
        await res.json();

      const keepSignedIn = readPersistPref();
      const store = getStorage(keepSignedIn);
      store.setItem(KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) {
        store.setItem(KEYS.REFRESH_TOKEN, data.refreshToken);
      }

      setToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  /** Schedule a silent refresh ~60 s before the access token expires. */
  const scheduleRefresh = useCallback(
    (accessToken: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const exp = getJwtExpiry(accessToken);
      if (!exp) return;

      const msUntilExpiry = exp * 1000 - Date.now();
      // Refresh 60 s before expiry, but no sooner than 10 s from now
      const refreshIn = Math.max(msUntilExpiry - 60_000, 10_000);

      refreshTimerRef.current = setTimeout(async () => {
        const newToken = await silentRefresh();
        if (newToken) {
          scheduleRefresh(newToken); // reschedule for next cycle
        } else {
          // Only clear session if we have no refresh token left
          const { refreshToken } = getStoredTokens();
          if (!refreshToken) {
            clearTokens();
            setUser(null);
            setToken(null);
          }
          // Otherwise keep user active — next API call will retry
        }
      }, refreshIn);
    },
    [silentRefresh]
  );

  // ── Bootstrap on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      const { accessToken: storedAccess } = getStoredTokens();

      if (!storedAccess) {
        // No access token — try refresh if a refresh token exists (e.g. after browser restart)
        const newToken = await silentRefresh();
        if (newToken) {
          const profile = await fetchProfile(newToken);
          if (profile) {
            setUser(profile);
            setToken(newToken);
            scheduleRefresh(newToken);
            const keepSignedIn = readPersistPref();
            getStorage(keepSignedIn).setItem(KEYS.USER, JSON.stringify(profile));
          }
        }
        setIsLoading(false);
        return;
      }

      const exp = getJwtExpiry(storedAccess);
      const isExpired = exp !== null && exp * 1000 <= Date.now();

      if (isExpired) {
        // Token expired — try silent refresh first
        const newToken = await silentRefresh();
        if (newToken) {
          const profile = await fetchProfile(newToken);
          if (profile) {
            setUser(profile);
            setToken(newToken);
            scheduleRefresh(newToken);
          } else {
            clearTokens();
            setUser(null);
            setToken(null);
          }
        } else {
          clearTokens();
          setUser(null);
          setToken(null);
        }
        setIsLoading(false);
        return;
      }

      // Token appears fresh — verify with /me (non-blocking: keep cached user shown immediately)
      try {
        const profile = await fetchProfile(storedAccess);
        if (profile) {
          setUser(profile);
          scheduleRefresh(storedAccess);
          const keepSignedIn = readPersistPref();
          getStorage(keepSignedIn).setItem(KEYS.USER, JSON.stringify(profile));
        } else {
          // /me returned 401 — try one refresh
          const newToken = await silentRefresh();
          if (newToken) {
            const p2 = await fetchProfile(newToken);
            if (p2) {
              setUser(p2);
              setToken(newToken);
              scheduleRefresh(newToken);
            } else {
              clearTokens();
              setUser(null);
              setToken(null);
            }
          } else {
            clearTokens();
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        // Network error — keep cached user so the app still works
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, keepSignedIn: boolean) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Invalid email or password');
    }

    const data: AuthResponse = await res.json();
    persistTokens(data.tokens.accessToken, data.tokens.refreshToken, data.user, keepSignedIn);
    setUser(data.user);
    setToken(data.tokens.accessToken);
    scheduleRefresh(data.tokens.accessToken);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    const data: AuthResponse = await res.json();
    persistTokens(data.tokens.accessToken, data.tokens.refreshToken, data.user, true);
    setUser(data.user);
    setToken(data.tokens.accessToken);
    scheduleRefresh(data.tokens.accessToken);
  };

  const logout = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const { accessToken: storedToken, refreshToken: storedRefresh } = getStoredTokens();
    try {
      if (storedToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });
      }
    } catch {
      // Best-effort logout
    } finally {
      clearTokens();
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedFields };
      const keepSignedIn = readPersistPref();
      getStorage(keepSignedIn).setItem(KEYS.USER, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
