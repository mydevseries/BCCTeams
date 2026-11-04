import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { bccLightTheme } from '../../theme/brand';
import { AuthProvider } from '../../auth/AuthContext';
import { SignInView } from './SignInView';
import { SignUpView } from './SignUpView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ProtectedRoute } from '../../auth/ProtectedRoute';

describe('F-001 Authentication Views', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('SignInView', () => {
    it('renders sign in fields and branding', () => {
      render(
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter>
              <SignInView />
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      );

      expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('shows inline validation error for empty or invalid email', async () => {
      render(
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter>
              <SignInView />
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      );

      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/Email address/i);
      fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
      fireEvent.click(submitButton);

      expect(await screen.findByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });

    it('shows authentication failure error on incorrect credentials', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid email or password' }),
      });

      render(
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter>
              <SignInView />
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      );

      fireEvent.change(screen.getByLabelText(/Email address/i), {
        target: { value: 'user@company.com' },
      });
      fireEvent.change(screen.getByLabelText(/^Password$/i), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      expect(await screen.findByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  describe('SignUpView', () => {
    it('shows validation error when password is under 8 characters', async () => {
      render(
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter>
              <SignUpView />
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      );

      fireEvent.change(screen.getByLabelText(/Full name/i), {
        target: { value: 'Alice Smith' },
      });
      fireEvent.change(screen.getByLabelText(/Email address/i), {
        target: { value: 'alice@company.com' },
      });
      fireEvent.change(screen.getByLabelText(/^Password/i), {
        target: { value: 'short' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

      expect(
        await screen.findByText(/Password must be at least 8 characters long/i)
      ).toBeInTheDocument();
    });
  });

  describe('ForgotPasswordView', () => {
    it('sends reset link and displays confirmation message', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: 'If the email exists in our system, a password reset link has been sent.',
          resetToken: 'test-token-12345',
        }),
      });

      render(
        <FluentProvider theme={bccLightTheme}>
          <MemoryRouter>
            <ForgotPasswordView />
          </MemoryRouter>
        </FluentProvider>
      );

      fireEvent.change(screen.getByLabelText(/Email address/i), {
        target: { value: 'alice@company.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

      expect(
        await screen.findByText(/If the email exists in our system, a password reset link has been sent/i)
      ).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated users to /signin', async () => {
      render(
        <FluentProvider theme={bccLightTheme}>
          <AuthProvider>
            <MemoryRouter initialEntries={['/protected']}>
              <Routes>
                <Route
                  path="/protected"
                  element={
                    <ProtectedRoute>
                      <div>Protected Area</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/signin" element={<div>Sign In Screen</div>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </FluentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In Screen')).toBeInTheDocument();
      });
      expect(screen.queryByText('Protected Area')).not.toBeInTheDocument();
    });
  });
});
