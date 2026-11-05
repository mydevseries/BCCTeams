import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Textarea,
  RadioGroup,
  Radio,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { DismissRegular, LockClosedRegular, CheckmarkCircleRegular } from '@fluentui/react-icons';
import { SharePermission } from './types';
import { filesApi } from './files.api';

const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
    width: '90vw',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM, 0),
  },
  headerIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL, 0),
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteGreenForeground1,
  },
});

export interface RequestAccessModalProps {
  fileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({
  fileId,
  fileName,
  isOpen,
  onClose,
  token,
}) => {
  const styles = useStyles();
  const [requestedPermission, setRequestedPermission] = useState<SharePermission>('VIEW');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await filesApi.createAccessRequest(token, {
        fileId,
        requestedPermission,
        note: note.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit access request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface} aria-label={`Request access to ${fileName}`}>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={handleClose}
              aria-label="Close"
            />
          }
        >
          Request access
        </DialogTitle>

        <DialogBody>
          <DialogContent>
            {isSubmitted ? (
              <div className={styles.successContainer} data-testid="access-request-submitted">
                <CheckmarkCircleRegular className={styles.successIcon} />
                <Text weight="semibold" size={400}>
                  Access request submitted
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  The file owner has been notified. You will be able to access "{fileName}" once
                  they approve your request.
                </Text>
              </div>
            ) : (
              <div className={styles.content}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LockClosedRegular className={styles.headerIcon} />
                  <div>
                    <Text weight="semibold" size={300} block>
                      {fileName}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      You need permission from the owner to access this item.
                    </Text>
                  </div>
                </div>

                <div>
                  <Text weight="medium" size={200} block style={{ marginBottom: '6px' }}>
                    Permission requested:
                  </Text>
                  <RadioGroup
                    value={requestedPermission}
                    onChange={(_, data) => setRequestedPermission(data.value as SharePermission)}
                    layout="horizontal"
                  >
                    <Radio value="VIEW" label="View only" />
                    <Radio value="EDIT" label="Edit" />
                  </RadioGroup>
                </div>

                <div>
                  <Text weight="medium" size={200} block style={{ marginBottom: '6px' }}>
                    Reason or note (optional):
                  </Text>
                  <Textarea
                    value={note}
                    onChange={(_, data) => setNote(data.value)}
                    placeholder="Explain why you need access to this file..."
                    rows={3}
                    style={{ width: '100%' }}
                  />
                </div>

                {error && (
                  <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                    {error}
                  </Text>
                )}
              </div>
            )}
          </DialogContent>

          <DialogActions>
            {isSubmitted ? (
              <Button appearance="primary" onClick={handleClose}>
                Done
              </Button>
            ) : (
              <>
                <Button appearance="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  data-testid="submit-access-request-btn"
                >
                  {isSubmitting ? <Spinner size="tiny" /> : 'Send request'}
                </Button>
              </>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
