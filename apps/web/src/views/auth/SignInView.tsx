import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Title2,
  Body1,
  Caption1,
  Input,
  Button,
  Field,
  Link,
  MessageBar,
  MessageBarBody,
  Spinner,
  Checkbox,
} from '@fluentui/react-components';
import { MailRegular, LockClosedRegular } from '@fluentui/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

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
  actions: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    marginTop: tokens.spacingVerticalS,
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
});

export const SignInView: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setAuthError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setAuthError('');

    try {
      await login(email.trim(), password, keepSignedIn);
      const destination =
        (location.state as { from?: { pathname: string } })?.from?.pathname || '/chat';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/brand/favicon.svg" alt="BCC Teams" className={styles.logo} />
          <Title2 as="h1">Sign In</Title2>
          <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
            Use your BCC Teams account
          </Body1>
        </div>

        {authError && (
          <MessageBar intent="error">
            <MessageBarBody>{authError}</MessageBarBody>
          </MessageBar>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Field
            label="Email address"
            validationState={emailError ? 'error' : 'none'}
            validationMessage={emailError}
          >
            <Input
              type="email"
              value={email}
              onChange={(_, data) => setEmail(data.value)}
              contentBefore={<MailRegular />}
              placeholder="name@company.com"
              autoComplete="email"
              size="large"
              aria-label="Email address"
            />
          </Field>

          <Field
            label="Password"
            validationState={passwordError ? 'error' : 'none'}
            validationMessage={passwordError}
          >
            <Input
              type="password"
              value={password}
              onChange={(_, data) => setPassword(data.value)}
              contentBefore={<LockClosedRegular />}
              placeholder="Enter your password"
              autoComplete="current-password"
              size="large"
              aria-label="Password"
            />
          </Field>

          <div className={styles.footerLinks}>
            <Checkbox
              label="Keep me signed in"
              checked={keepSignedIn}
              onChange={(_, data) => setKeepSignedIn(!!data.checked)}
              aria-label="Keep me signed in across browser restarts"
            />
            <Link onClick={() => navigate('/forgot-password')}>Forgot password?</Link>
          </div>

          <div className={styles.actions}>
            <Button
              type="submit"
              appearance="primary"
              size="large"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="tiny" label="Signing in..." /> : 'Sign In'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Caption1>
            Don't have an account?{' '}
            <Link onClick={() => navigate('/signup')}>Sign up</Link>
          </Caption1>
        </div>
      </div>
    </div>
  );
};
