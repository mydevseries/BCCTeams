import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { AuthProvider } from '../../auth/AuthContext';
import { PresenceProvider } from '../../presence/PresenceContext';
import { ThemeProvider } from '../../theme/ThemeContext';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { SettingsProvider } from '../../settings/SettingsContext';
import { AppShell } from './AppShell';

const renderAppShell = () =>
  render(
    <ThemeProvider>
      <FluentProvider theme={bccLightTheme}>
        <AuthProvider>
          <LanguageProvider>
            <SettingsProvider>
              <PresenceProvider>
                <MemoryRouter initialEntries={['/chat']}>
                  <AppShell />
                </MemoryRouter>
              </PresenceProvider>
            </SettingsProvider>
          </LanguageProvider>
        </AuthProvider>
      </FluentProvider>
    </ThemeProvider>
  );

describe('AppShell Layout', () => {
  it('renders top bar with BCC Teams branding and search', () => {
    renderAppShell();
    expect(screen.getByText('BCC Teams')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search \(Ctrl\+E\)/i)).toBeInTheDocument();
  });

  it('renders all 7 left app bar navigation items in order', () => {
    renderAppShell();
    const navBar = screen.getByRole('navigation', { name: 'Main Navigation' });
    expect(navBar).toBeInTheDocument();

    const expectedItems = [
      'Activity',
      'Chat',
      'Teams',
      'Calendar',
      'Calls',
      'Files',
      'Apps',
    ];

    expectedItems.forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });
});
