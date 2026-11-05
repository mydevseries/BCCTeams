import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { AuthProvider } from '../../auth/AuthContext';
import { ThemeProvider } from '../../theme/ThemeContext';
import { AppShell } from './AppShell';

describe('AppShell Layout', () => {
  it('renders top bar with BCC Teams branding and search', () => {
    render(
      <ThemeProvider>
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter initialEntries={['/chat']}>
              <AppShell />
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('BCC Teams')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search \(Ctrl\+E\)/i)).toBeInTheDocument();
  });

  it('renders all 7 left app bar navigation items in order', () => {
    render(
      <ThemeProvider>
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter initialEntries={['/chat']}>
              <AppShell />
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      </ThemeProvider>
    );

    expect(screen.getByRole('button', { name: /^Activity$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Chat$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Teams$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Calls$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Files$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Apps$/i })).toBeInTheDocument();
  });
});
