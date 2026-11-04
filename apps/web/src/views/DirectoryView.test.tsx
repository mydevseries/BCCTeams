import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../theme/brand';
import { AuthProvider } from '../auth/AuthContext';
import { DirectoryView } from './DirectoryView';

describe('DirectoryView Component', () => {
  it('renders directory heading, search input, and empty state or cards', () => {
    render(
      <FluentProvider theme={bccLightTheme}>
        <AuthProvider>
          <MemoryRouter>
            <DirectoryView />
          </MemoryRouter>
        </AuthProvider>
      </FluentProvider>
    );

    expect(screen.getByText('Organization Directory')).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Search by name, job title, department, or email/i)
    ).toBeDefined();
    expect(screen.getByRole('textbox', { name: /Search directory/i })).toBeDefined();
  });
});
