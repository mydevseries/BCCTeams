import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatHeader } from './ChatHeader';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { PresenceProvider } from '../presence/PresenceContext';
import { AuthProvider } from '../auth/AuthContext';
import { MemberProfile } from '@bcc/shared';

const mockMember: MemberProfile = {
  id: 'member-123',
  email: 'sarah.connor@bcc.test',
  displayName: 'Sarah Connor',
  jobTitle: 'Security Lead',
  department: 'Operations',
  role: 'MEMBER',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  presence: {
    status: 'AVAILABLE',
  },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <FluentProvider theme={webLightTheme}>
      <AuthProvider>
        <PresenceProvider>{component}</PresenceProvider>
      </AuthProvider>
    </FluentProvider>
  );
};

describe('ChatHeader (C-001)', () => {
  it('renders participant full name, job title, and quick action buttons', () => {
    renderWithProviders(<ChatHeader participant={mockMember} />);

    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('Security Lead')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio call/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /video call/i })).toBeInTheDocument();
  });
});

