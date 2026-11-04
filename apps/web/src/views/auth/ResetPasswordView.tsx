import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Title2,
  Body1,
  Input,
  Button,
  Field,
  Link,
  MessageBar,
  MessageBarBody,
  Spinner,
} from '@fluentui/react-components';
import { LockClosedRegular } from '@fluentui/react-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorNeutralBackground2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingHorizontalM),
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    boxShadow: tokens.shadow16,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
});

export const ResetPasswordView: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [errorAlert, setErrorAlert] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setPasswordError('');
    setTokenError('');
    setErrorAlert('');

    if (!token.trim()) {
      setTokenError('Reset token is required');
      isValid = false;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      isValid = false;
    } else if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorAlert('');

    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccessMessage(data.message || 'Password updated successfully!');
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resetting password';
      setErrorAlert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/brand/favicon.svg" alt="BCC Teams" className={styles.logo} />
          <Title2 as="h1">Set New Password</Title2>
          <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
            Choose a new secure password
          </Body1>
        </div>

        {errorAlert && (
          <MessageBar intent="error">
            <MessageBarBody>{errorAlert}</MessageBarBody>
          </MessageBar>
        )}

        {successMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <MessageBar intent="success">
              <MessageBarBody>{successMessage}</MessageBarBody>
            </MessageBar>
            <Button appearance="primary" onClick={() => navigate('/signin')}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {!searchParams.get('token') && (
              <Field
                label="Reset Token"
                validationState={tokenError ? 'error' : 'none'}
                validationMessage={tokenError}
              >
                <Input
                  type="text"
                  value={token}
                  onChange={(_, data) => setToken(data.value)}
                  placeholder="Paste your reset token"
                  size="large"
                />
              </Field>
            )}

            <Field
              label="New password (min 8 characters)"
              validationState={passwordError ? 'error' : 'none'}
              validationMessage={passwordError}
            >
              <Input
                type="password"
                value={newPassword}
                onChange={(_, data) => setNewPassword(data.value)}
                contentBefore={<LockClosedRegular />}
                placeholder="Enter new password"
                size="large"
              />
            </Field>

            <Field label="Confirm new password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(_, data) => setConfirmPassword(data.value)}
                contentBefore={<LockClosedRegular />}
                placeholder="Confirm new password"
                size="large"
              />
            </Field>

            <Button
              type="submit"
              appearance="primary"
              size="large"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="tiny" label="Saving..." /> : 'Update Password'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Link onClick={() => navigate('/signin')}>Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
