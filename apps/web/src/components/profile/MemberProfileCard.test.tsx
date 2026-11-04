import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { MemberProfileCard } from './MemberProfileCard';
import { MemberProfile } from '@bcc/shared';

describe('MemberProfileCard Component', () => {
  const mockMember: MemberProfile = {
    id: 'user-2',
    email: 'alex.chen@bccteams.local',
    displayName: 'Alex Chen',
    avatarUrl: null,
    jobTitle: 'Principal Cloud Architect',
    department: 'Infrastructure',
    phoneNumber: '+1-555-0344',
    role: 'MEMBER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    presence: {
      status: 'BUSY',
      statusMessage: 'In a technical review',
    },
    localTime: '4:45 PM',
  };

  it('renders member contact details, department, and presence', () => {
    render(
      <FluentProvider theme={bccLightTheme}>
        <MemberProfileCard member={mockMember} open={true} onOpenChange={() => {}} />
      </FluentProvider>
    );

    expect(screen.getByText('Member Profile')).toBeDefined();
    expect(screen.getByText('Alex Chen')).toBeDefined();
    expect(screen.getByText('alex.chen@bccteams.local')).toBeDefined();
    expect(screen.getByText('Infrastructure')).toBeDefined();
    expect(screen.getByText('+1-555-0344')).toBeDefined();
    expect(screen.getByText('4:45 PM (Local time)')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Chat' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Call' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Email' })).toBeDefined();
  });
});
