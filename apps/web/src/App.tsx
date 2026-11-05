import React from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { SettingsProvider } from './settings/SettingsContext';
import { AuthProvider } from './auth/AuthContext';
import { PresenceProvider } from './presence/PresenceContext';
import { ChatProvider } from './chat/ChatContext';
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
import { AdminRolesView } from './roles';

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
              <ChatProvider>
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
                      <Route path="admin/roles" element={<AdminRolesView />} />
                      <Route path="activity" element={<ActivityView />} />
                      <Route
                        path="teams"
                        element={
                          <GenericSectionView
                            title="Teams and Channels"
                            description="Collaborate with your project groups, departments, and cross-functional teams."
                            featureId="T-001"
                            illustration="/illustrations/teams-empty.svg"
                          />
                        }
                      />
                      <Route
                        path="calendar"
                        element={
                          <GenericSectionView
                            title="Calendar"
                            description="Schedule meetings, view upcoming events, and coordinate with colleagues."
                            featureId="W-001"
                            illustration="/illustrations/calendar-empty.svg"
                          />
                        }
                      />
                      <Route
                        path="calls"
                        element={
                          <GenericSectionView
                            title="Calls"
                            description="Make direct voice and video calls, check call history, and access voicemails."
                            featureId="K-001"
                            illustration="/illustrations/calls-empty.svg"
                          />
                        }
                      />
                      <Route
                        path="files"
                        element={
                          <GenericSectionView
                            title="Files"
                            description="Access all your documents, shared attachments, and team files in one place."
                            featureId="D-001"
                            illustration="/illustrations/files-empty.svg"
                          />
                        }
                      />
                      <Route
                        path="apps"
                        element={
                          <GenericSectionView
                            title="Apps & Integrations"
                            description="Extend your workspace with productivity tools, bots, and enterprise connectors."
                            featureId="P-001"
                            illustration="/illustrations/apps-empty.svg"
                          />
                        }
                      />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </ChatProvider>
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
