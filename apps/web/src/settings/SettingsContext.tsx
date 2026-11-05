import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { useLanguage, SupportedLanguage } from '../i18n/LanguageContext';
import { UserSettings, UpdateSettingsDto } from '@bcc/shared';

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  notifyBanners: boolean;
  notifySounds: boolean;
  notifyEmailDigest: boolean;
  updateSettings: (dto: UpdateSettingsDto) => Promise<void>;
}

const defaultSettings: UserSettings = {
  userId: '',
  theme: 'light',
  language: 'en',
  notifyBanners: true,
  notifySounds: true,
  notifyEmailDigest: true,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  workLocation: 'Office',
  readReceipts: true,
  chatDensity: 'comfortable',
  enterToSend: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { setThemeMode } = useTheme();
  const { setLanguage } = useLanguage();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasUserEditedRef = React.useRef<boolean>(false);

  // Fetch settings from API on login / startup
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !isCancelled) {
          const data: UserSettings = await res.json();
          setSettings((prev) => ({
            ...data,
            ...(hasUserEditedRef.current ? prev : {}),
          }));
          if (!hasUserEditedRef.current) {
            if (data.theme) setThemeMode(data.theme as ThemeMode);
            if (data.language) setLanguage(data.language as SupportedLanguage);
          }
        }
      } catch {
        // Fallback to local defaults
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchSettings();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, token, setThemeMode, setLanguage]);

  const updateSettings = useCallback(
    async (dto: UpdateSettingsDto) => {
      hasUserEditedRef.current = true;
      // Optimistic update
      setSettings((prev) => ({
        ...prev,
        ...dto,
      }));

      if (dto.theme) setThemeMode(dto.theme as ThemeMode);
      if (dto.language) setLanguage(dto.language as SupportedLanguage);

      if (token) {
        try {
          await fetch('/api/settings/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
          });
        } catch {
          // Revert or ignore
        }
      }
    },
    [token, setThemeMode, setLanguage]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        notifyBanners: settings.notifyBanners,
        notifySounds: settings.notifySounds,
        notifyEmailDigest: settings.notifyEmailDigest,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

