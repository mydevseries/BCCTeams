import React from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { SettingsProvider } from './settings/SettingsContext';
import { AuthProvider } from './auth/AuthContext';
import { PresenceProvider } from './presence/PresenceContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { ChatView } from './views/ChatView';
import { ActivityView } from './views/ActivityView';
import { GenericSectionView } from './views/GenericSectionView';
import { SignInView } from './views/auth/SignInView';
import { SignUpView } from './views/auth/SignUpView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { ResetPasswordView } from './views/auth/ResetPasswordView';
import { DirectoryView } from './views/DirectoryView';

const ThemedApp: React.FC = () => {
  const { fluentTheme } = useTheme();

  return (
    <FluentProvider
      theme={fluentTheme}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <AuthProvider>
        <LanguageProvider>
          <SettingsProvider>
        <PresenceProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/signin" element={<SignInView />} />
              <Route path="/signup" element={<SignUpView />} />
              <Route path="/forgot-password" element={<ForgotPasswordView />} />
              <Route path="/reset-password" element={<ResetPasswordView />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="chat" element={<ChatView />} />
                <Route path="directory" element={<DirectoryView />} />
                <Route path="activity" element={<ActivityView />} />
                <Route
                  path="teams"
                  element={
                    <GenericSectionView
                      title="Teams & Channels"
                      description="Collaborate in dedicated spaces with standard, private, and shared channels."
                      illustration="/illustrations/empty-teams.svg"
                      featureId="T-001"
                      actionText="Create or Join Team"
                    />
                  }
                />
                <Route
                  path="calendar"
                  element={
                    <GenericSectionView
                      title="Calendar"
                      description="Schedule, manage, and join video meetings and appointments."
                      illustration="/illustrations/empty-calendar.svg"
                      featureId="W-001"
                      actionText="New Meeting"
                    />
                  }
                />
                <Route
                  path="calls"
                  element={
                    <GenericSectionView
                      title="Calls"
                      description="High-definition 1:1 and group audio/video calls with screen sharing."
                      illustration="/illustrations/empty-chat.svg"
                      featureId="K-001"
                      actionText="Make a Call"
                    />
                  }
                />
                <Route
                  path="files"
                  element={
                    <GenericSectionView
                      title="Files"
                      description="Access your recent files, team libraries, and shared documents securely."
                      illustration="/illustrations/empty-files.svg"
                      featureId="D-001"
                    />
                  }
                />
                <Route
                  path="apps"
                  element={
                    <GenericSectionView
                      title="Apps"
                      description="Extend BCC Teams with internal integrations and productivity workflows."
                      illustration="/illustrations/empty-search.svg"
                      featureId="P-001"
                    />
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PresenceProvider>
          </SettingsProvider>
        </LanguageProvider>
      </AuthProvider>
    </FluentProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
};
