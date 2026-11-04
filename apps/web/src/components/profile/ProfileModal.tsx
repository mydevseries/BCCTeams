import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Avatar,
  makeStyles,
  tokens,
  shorthands,
  MessageBar,
  MessageBarBody,
  Spinner,
  Body1,
  Caption1,
} from '@fluentui/react-components';
import {
  CameraRegular,
  DeleteRegular,
  PersonRegular,
  BriefcaseRegular,
  BuildingRegular,
  CallRegular,
  MailRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../auth/AuthContext';

const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  avatarContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  avatarActions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginTop: tokens.spacingVerticalXS,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
  },
  hiddenInput: {
    display: 'none',
  },
});

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const styles = useStyles();
  const { user, token, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const prevOpenRef = useRef(false);
  // Reset form only when modal transitions from closed to open
  React.useEffect(() => {
    if (open && !prevOpenRef.current && user) {
      setDisplayName(user.displayName || '');
      setJobTitle(user.jobTitle || '');
      setDepartment(user.department || '');
      setPhoneNumber(user.phoneNumber || '');
      setErrorMessage('');
      setSuccessMessage('');
    }
    prevOpenRef.current = open;
  }, [open, user]);

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please upload a PNG, JPEG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file size must not exceed 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload photo');
      }

      const updated = await res.json();
      updateUser(updated);
      setSuccessMessage('Profile photo updated successfully');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to remove photo');
      }

      const updated = await res.json();
      updateUser(updated);
      setSuccessMessage('Profile photo removed, reverted to initials');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Remove photo failed');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          jobTitle: jobTitle.trim() || null,
          department: department.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update profile');
      }

      const updated = await res.json();
      updateUser(updated);
      setSuccessMessage('Profile details saved successfully');
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Your Profile</DialogTitle>

          <DialogContent>
            <div className={styles.header}>
              <div className={styles.avatarContainer}>
                <Avatar
                  name={user?.displayName || 'User'}
                  image={user?.avatarUrl ? { src: user.avatarUrl } : undefined}
                  initials={getInitials(user?.displayName)}
                  size={96}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className={styles.hiddenInput}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  aria-label="Upload profile photo"
                />
                <div className={styles.avatarActions}>
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<CameraRegular />}
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  {user?.avatarUrl && (
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      disabled={isUploadingPhoto}
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Body1 block style={{ fontWeight: 'bold', textAlign: 'center' }}>
                  {user?.displayName}
                </Body1>
                <Caption1 block style={{ color: tokens.colorNeutralForeground3, textAlign: 'center' }}>
                  {user?.email}
                </Caption1>
              </div>
            </div>

            {errorMessage && (
              <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
                <MessageBarBody>{errorMessage}</MessageBarBody>
              </MessageBar>
            )}

            {successMessage && (
              <MessageBar intent="success" style={{ marginBottom: tokens.spacingVerticalM }}>
                <MessageBarBody>{successMessage}</MessageBarBody>
              </MessageBar>
            )}

            <form id="profile-form" onSubmit={handleSaveProfile} className={styles.form}>
              <Field label="Display Name" required>
                <Input
                  value={displayName}
                  onChange={(_, data) => setDisplayName(data.value)}
                  contentBefore={<PersonRegular />}
                  placeholder="Your full name"
                  size="medium"
                  aria-label="Display Name"
                />
              </Field>

              <Field label="Email Address">
                <Input
                  value={user?.email || ''}
                  disabled
                  contentBefore={<MailRegular />}
                  size="medium"
                  aria-label="Email Address"
                />
              </Field>

              <Field label="Job Title">
                <Input
                  value={jobTitle}
                  onChange={(_, data) => setJobTitle(data.value)}
                  contentBefore={<BriefcaseRegular />}
                  placeholder="e.g. Senior Software Engineer"
                  size="medium"
                  aria-label="Job Title"
                />
              </Field>

              <Field label="Department">
                <Input
                  value={department}
                  onChange={(_, data) => setDepartment(data.value)}
                  contentBefore={<BuildingRegular />}
                  placeholder="e.g. Product Engineering"
                  size="medium"
                  aria-label="Department"
                />
              </Field>

              <Field label="Phone Number">
                <Input
                  value={phoneNumber}
                  onChange={(_, data) => setPhoneNumber(data.value)}
                  contentBefore={<CallRegular />}
                  placeholder="e.g. +1 (555) 012-3456"
                  size="medium"
                  aria-label="Phone Number"
                />
              </Field>
            </form>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="profile-form"
              appearance="primary"
              disabled={isSaving || isUploadingPhoto}
            >
              {isSaving ? <Spinner size="tiny" label="Saving..." /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
