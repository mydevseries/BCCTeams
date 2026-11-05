import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { AuthProvider } from '../../auth/AuthContext';
import { PresenceProvider } from '../../presence/PresenceContext';
import { StatusMessageModal } from './StatusMessageModal';

describe('StatusMessageModal Component', () => {
  it('renders status message input, expiry selector, and actions when open', () => {
    render(
      <FluentProvider theme={bccLightTheme}>
        <AuthProvider>
          <PresenceProvider>
            <StatusMessageModal open={true} onOpenChange={() => {}} />
          </PresenceProvider>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText('Set status message')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Status message$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Clear status message after$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });
});
