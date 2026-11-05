import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ThemeProvider } from '../../theme/ThemeContext';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { SettingsProvider } from '../../settings/SettingsContext';
import { AuthProvider } from '../../auth/AuthContext';

const renderModal = (open = true, onOpenChange = vi.fn()) => {
  return render(
    <ThemeProvider>
      <FluentProvider theme={webLightTheme}>
        <AuthProvider>
          <LanguageProvider>
            <SettingsProvider>
              <SettingsModal open={open} onOpenChange={onOpenChange} />
            </SettingsProvider>
          </LanguageProvider>
        </AuthProvider>
      </FluentProvider>
    </ThemeProvider>
  );
};

describe('SettingsModal Component (F-005)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders General tab with 4 theme choices and language dropdown', () => {
    renderModal(true);

    expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /General/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Notifications/i })).toBeInTheDocument();

    // 4 themes
    expect(screen.getByRole('radio', { name: /Light/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /High Contrast/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /System default/i })).toBeInTheDocument();

    // Language dropdown
    expect(screen.getByRole('combobox', { name: /App Language Selection/i })).toBeInTheDocument();
  });

  it('switches to Notifications tab and displays 3 preference switches', () => {
    renderModal(true);

    const notifTab = screen.getByRole('tab', { name: /Notifications/i });
    fireEvent.click(notifTab);

    expect(screen.getByText(/Banner pop-up toasts/i)).toBeInTheDocument();
    expect(screen.getByText(/Sound alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Missed activity email digest/i)).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(3);
  });

  it('changes language and immediately updates modal text strings', () => {
    renderModal(true);

    const langSelect = screen.getByRole('combobox', { name: /App Language Selection/i });
    fireEvent.change(langSelect, { target: { value: 'fr' } });

    // The heading should now be "Paramètres"
    expect(screen.getByRole('heading', { name: /Paramètres/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Général/i })).toBeInTheDocument();
  });
});

