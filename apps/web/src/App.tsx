import React, { useState } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { bccLightTheme, bccDarkTheme, bccHighContrastTheme } from './theme/brand';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { ChatView } from './views/ChatView';
import { GenericSectionView } from './views/GenericSectionView';
import { SignInView } from './views/auth/SignInView';
import { SignUpView } from './views/auth/SignUpView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { ResetPasswordView } from './views/auth/ResetPasswordView';

export const App: React.FC = () => {
  const [themeName, setThemeName] = useState<'light' | 'dark' | 'high-contrast'>('light');

  const currentTheme =
    themeName === 'dark'
      ? bccDarkTheme
      : themeName === 'high-contrast'
      ? bccHighContrastTheme
      : bccLightTheme;

  return (
    <FluentProvider theme={currentTheme}>
      <AuthProvider>
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
                  <AppShell
                    currentTheme={themeName}
                    onThemeChange={(newTheme) => setThemeName(newTheme)}
                  />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="chat" element={<ChatView />} />
              <Route
                path="activity"
                element={
                  <GenericSectionView
                    title="Activity Feed"
                    description="Stay up to date with mentions, replies, reactions, and team updates."
                    illustration="/illustrations/empty-activity.svg"
                  />
                }
              />
              <Route
                path="teams"
                element={
                  <GenericSectionView
                    title="Teams & Channels"
                    description="Collaborate in dedicated spaces with standard, private, and shared channels."
                    illustration="/illustrations/empty-teams.svg"
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
                    actionText="Upload File"
                  />
                }
              />
              <Route
                path="apps"
                element={
                  <GenericSectionView
                    title="Apps & Integrations"
                    description="Extend your workspace with automated workflows, task boards, and bots."
                    illustration="/illustrations/connect.svg"
                    actionText="Browse Apps"
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <GenericSectionView
                    title="Settings"
                    description="Configure appearance themes, notification sounds, and account preferences."
                    illustration="/illustrations/welcome.svg"
                  />
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </FluentProvider>
  );
};
