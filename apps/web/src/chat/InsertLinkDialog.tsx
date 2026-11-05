import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    marginTop: tokens.spacingVerticalS,
  },
});

interface InsertLinkDialogProps {
  open: boolean;
  initialText?: string;
  onDismiss: () => void;
  onInsert: (text: string, url: string) => void;
}

export const InsertLinkDialog: React.FC<InsertLinkDialogProps> = ({
  open,
  initialText = '',
  onDismiss,
  onInsert,
}) => {
  const styles = useStyles();
  const [displayText, setDisplayText] = useState(initialText);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDisplayText(initialText);
      setUrl('');
      setError(null);
    }
  }, [open, initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Please enter a web address (URL)');
      return;
    }

    // Auto-prepend https:// if missing protocol
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Only http:// and https:// URLs are permitted');
        return;
      }
    } catch {
      setError('Please enter a valid web address (e.g. https://example.com)');
      return;
    }

    const finalLabel = displayText.trim() || trimmedUrl;
    onInsert(finalLabel, trimmedUrl);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onDismiss()}>
      <DialogSurface aria-label="Insert Hyperlink Dialog">
        <DialogTitle>Insert link</DialogTitle>
        <DialogBody>
          <form onSubmit={handleSubmit} className={styles.form}>
            <DialogContent>
              <Field label="Text to display">
                <Input
                  value={displayText}
                  onChange={(_, data) => setDisplayText(data.value)}
                  placeholder="Link text (optional)"
                  aria-label="Text to display"
                />
              </Field>

              <Field
                label="Address"
                required
                validationState={error ? 'error' : 'none'}
                validationMessage={error || undefined}
                style={{ marginTop: 12 }}
              >
                <Input
                  value={url}
                  onChange={(_, data) => {
                    setUrl(data.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://example.com"
                  aria-label="Address"
                  autoFocus
                />
              </Field>
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={onDismiss}>
                Cancel
              </Button>
              <Button appearance="primary" type="submit">
                Insert
              </Button>
            </DialogActions>
          </form>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

