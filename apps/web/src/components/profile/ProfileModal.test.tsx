import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { ProfileModal } from './ProfileModal';
import { AuthProvider } from '../../auth/AuthContext';

describe('ProfileModal Component', () => {
  it('renders all profile fields when open', () => {
    render(
      <FluentProvider theme={bccLightTheme}>
        <AuthProvider>
          <ProfileModal open={true} onOpenChange={() => {}} />
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText('Your Profile')).toBeDefined();
    expect(screen.getByLabelText('Display Name')).toBeDefined();
    expect(screen.getByLabelText('Email Address')).toBeDefined();
    expect(screen.getByLabelText('Job Title')).toBeDefined();
    expect(screen.getByLabelText('Department')).toBeDefined();
    expect(screen.getByLabelText('Phone Number')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Change Photo' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDefined();
  });
});
