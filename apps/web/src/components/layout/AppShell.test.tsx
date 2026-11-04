import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { AuthProvider } from '../../auth/AuthContext';
import { AppShell } from './AppShell';

describe('AppShell Layout', () => {
  it('renders top bar with BCC Teams branding', () => {
    render(
      <FluentProvider theme={bccLightTheme}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/chat']}>
            <AppShell currentTheme="light" onThemeChange={vi.fn()} />
          </MemoryRouter>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText('BCC Teams')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search messages, people, files/i)).toBeInTheDocument();
  });

  it('renders all left app bar navigation items', () => {
    render(
      <FluentProvider theme={bccLightTheme}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/chat']}>
            <AppShell currentTheme="light" onThemeChange={vi.fn()} />
          </MemoryRouter>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByRole('button', { name: /^Activity$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Chat$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Teams$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Calendar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Calls$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Files$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Apps$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Directory$/i })).toBeInTheDocument();
  });
});
