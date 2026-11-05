import { describe, it, expect } from 'vitest';
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

describe('ChatHeader (C-001 & C-002)', () => {
  it('renders participant full name, job title, and quick action buttons', () => {
    renderWithProviders(<ChatHeader participant={mockMember} />);

    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('Security Lead')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio call/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /video call/i })).toBeInTheDocument();
  });

  it('renders group title, participants count, and edit action for group chat', () => {
    const mockGroupConv: any = {
      id: 'grp-1',
      type: 'GROUP',
      title: 'Project Phoenix',
      participants: [
        { id: 'p1', userId: 'm1', role: 'ADMIN', user: mockMember },
        { id: 'p2', userId: 'm2', role: 'MEMBER', user: { ...mockMember, id: 'm2', displayName: 'John Doe' } },
      ],
      messages: [],
    };

    renderWithProviders(<ChatHeader conversation={mockGroupConv} />);

    expect(screen.getByText('Project Phoenix')).toBeInTheDocument();
    expect(screen.getByText('2 participants')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit group name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view group members/i })).toBeInTheDocument();
  });
});

