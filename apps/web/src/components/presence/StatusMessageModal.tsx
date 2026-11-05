import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  Select,
  makeStyles,
  tokens,
  shorthands,
  Caption1,
} from '@fluentui/react-components';
import { usePresence } from '../../presence/PresenceContext';

const useStyles = makeStyles({
  surface: {
    maxWidth: '440px',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  charCount: {
    display: 'flex',
    justifyContent: 'flex-end',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionButtonsRight: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
});

interface StatusMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StatusMessageModal: React.FC<StatusMessageModalProps> = ({
  open,
  onOpenChange,
}) => {
  const styles = useStyles();
  const { myPresence, setMyStatusMessage, clearMyStatusMessage } = usePresence();

  const [message, setMessage] = useState(myPresence.statusMessage || '');
  const [expiryPreset, setExpiryPreset] = useState<'1h' | '4h' | 'today' | 'week' | 'never'>('today');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage(myPresence.statusMessage || '');
    }
  }, [open, myPresence.statusMessage]);

  const calculateExpiry = (preset: string): string | null => {
    const now = new Date();
    if (preset === '1h') {
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }
    if (preset === '4h') {
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    }
    if (preset === 'today') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.toISOString();
    }
    if (preset === 'week') {
      const endOfWeek = new Date(now);
      const daysUntilSunday = (7 - endOfWeek.getDay()) % 7;
      endOfWeek.setDate(endOfWeek.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      endOfWeek.setHours(23, 59, 59, 999);
      return endOfWeek.toISOString();
    }
    return null;
  };

  const handleSave = async () => {
    if (!message.trim()) {
      handleClear();
      return;
    }

    setLoading(true);
    try {
      const expiresAt = calculateExpiry(expiryPreset);
      await setMyStatusMessage(message.trim(), expiresAt);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await clearMyStatusMessage();
      setMessage('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Set status message</DialogTitle>

          <DialogContent className={styles.content}>
            <div className={styles.field}>
              <Label htmlFor="status-message-input">Status message</Label>
              <Input
                id="status-message-input"
                value={message}
                onChange={(_, data) => setMessage(data.value.slice(0, 280))}
                placeholder="What's your status? (e.g. In a workshop, Working from home)"
                maxLength={280}
              />
              <div className={styles.charCount}>
                <Caption1>{message.length}/280</Caption1>
              </div>
            </div>

            <div className={styles.field}>
              <Label htmlFor="status-expiry-select">Clear status message after</Label>
              <Select
                id="status-expiry-select"
                value={expiryPreset}
                onChange={(_, data) => setExpiryPreset(data.value as any)}
              >
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="never">Never</option>
              </Select>
            </div>
          </DialogContent>

          <DialogActions className={styles.actions}>
            {myPresence.statusMessage ? (
              <Button appearance="subtle" onClick={handleClear} disabled={loading}>
                Clear status message
              </Button>
            ) : <div />}

            <div className={styles.actionButtonsRight}>
              <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleSave} disabled={loading}>
                Done
              </Button>
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

