import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, AuthResponse } from '@bcc/shared';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('bcc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bcc_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('bcc_access_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const profile: UserProfile = await res.json();
          setUser(profile);
          localStorage.setItem('bcc_user', JSON.stringify(profile));
        } else {
          // Token invalid or expired
          localStorage.removeItem('bcc_access_token');
          localStorage.removeItem('bcc_refresh_token');
          localStorage.removeItem('bcc_user');
          setUser(null);
          setToken(null);
        }
      } catch {
        // Offline or server unreachable, fallback to cached user if present
      } finally {
        setIsLoading(false);
      }
    };

    void verifySession();
  }, []);

  const login = async (email: string, password: string) => {
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
    setUser(data.user);
    setToken(data.tokens.accessToken);
    localStorage.setItem('bcc_access_token', data.tokens.accessToken);
    localStorage.setItem('bcc_refresh_token', data.tokens.refreshToken);
    localStorage.setItem('bcc_user', JSON.stringify(data.user));
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
    setUser(data.user);
    setToken(data.tokens.accessToken);
    localStorage.setItem('bcc_access_token', data.tokens.accessToken);
    localStorage.setItem('bcc_refresh_token', data.tokens.refreshToken);
    localStorage.setItem('bcc_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    const storedToken = localStorage.getItem('bcc_access_token');
    const storedRefreshToken = localStorage.getItem('bcc_refresh_token');

    try {
      if (storedToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
      }
    } catch {
      // Best-effort logout
    } finally {
      localStorage.removeItem('bcc_access_token');
      localStorage.removeItem('bcc_refresh_token');
      localStorage.removeItem('bcc_user');
      setUser(null);
      setToken(null);
    }
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
