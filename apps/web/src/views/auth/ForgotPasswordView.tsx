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
import { MailRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

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

export const ForgotPasswordView: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      setSuccessMessage(data.message || 'Reset link sent successfully.');
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch {
      setSuccessMessage('Reset link sent if the email exists.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src="/brand/favicon.svg" alt="BCC Teams" className={styles.logo} />
          <Title2 as="h1">Reset Password</Title2>
          <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
            Enter your email to receive a password reset link
          </Body1>
        </div>

        {successMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <MessageBar intent="success">
              <MessageBarBody>{successMessage}</MessageBarBody>
            </MessageBar>
            {resetToken && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <strong>Testing Reset Link:</strong>
                <br />
                <Link onClick={() => navigate(`/reset-password?token=${resetToken}`)}>
                  Click here to set a new password
                </Link>
              </div>
            )}
            <Button appearance="secondary" onClick={() => navigate('/signin')}>
              Return to Sign In
            </Button>
          </div>
        ) : (
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
                size="large"
                aria-label="Email address"
              />
            </Field>

            <Button
              type="submit"
              appearance="primary"
              size="large"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="tiny" label="Sending..." /> : 'Send Reset Link'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Link onClick={() => navigate('/signin')}>Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
