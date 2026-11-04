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
} from '@fluentui/react-components';
import { MailRegular, LockClosedRegular, PersonRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
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
    maxWidth: '420px',
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
});

export const SignUpView: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setDisplayNameError('');
    setEmailError('');
    setPasswordError('');
    setSubmitError('');

    if (!displayName.trim()) {
      setDisplayNameError('Full name is required');
      isValid = false;
    }

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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await register(email.trim(), password, displayName.trim());
      navigate('/chat', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/brand/favicon.svg" alt="BCC Teams" className={styles.logo} />
          <Title2 as="h1">Create an account</Title2>
          <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
            Join your organization on BCC Teams
          </Body1>
        </div>

        {submitError && (
          <MessageBar intent="error">
            <MessageBarBody>{submitError}</MessageBarBody>
          </MessageBar>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Field
            label="Full name"
            validationState={displayNameError ? 'error' : 'none'}
            validationMessage={displayNameError}
          >
            <Input
              type="text"
              value={displayName}
              onChange={(_, data) => setDisplayName(data.value)}
              contentBefore={<PersonRegular />}
              placeholder="Alice Smith"
              autoComplete="name"
              size="large"
              aria-label="Full name"
            />
          </Field>

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
            label="Password (min 8 characters)"
            validationState={passwordError ? 'error' : 'none'}
            validationMessage={passwordError}
          >
            <Input
              type="password"
              value={password}
              onChange={(_, data) => setPassword(data.value)}
              contentBefore={<LockClosedRegular />}
              placeholder="Create a strong password"
              autoComplete="new-password"
              size="large"
              aria-label="Password"
            />
          </Field>

          <div className={styles.actions}>
            <Button
              type="submit"
              appearance="primary"
              size="large"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="tiny" label="Creating account..." /> : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Caption1>
            Already have an account?{' '}
            <Link onClick={() => navigate('/signin')}>
              Sign in
            </Link>
          </Caption1>
        </div>
      </div>
    </div>
  );
};
