import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Spinner,
  Text,
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowResetRegular,
  CheckmarkRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import { FileItemDto, FileVersionDto } from './types';
import { filesApi } from './files.api';

const useStyles = makeStyles({
  surface: {
    maxWidth: '560px',
    width: '90vw',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalM,
    maxHeight: '400px',
    ...shorthands.overflow('auto'),
  },
  versionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  currentVersionItem: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorBrandStroke1}`,
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  versionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  versionMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface VersionHistoryModalProps {
  file: FileItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onVersionRestored: (updatedFile: FileItemDto) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  file,
  isOpen,
  onClose,
  token,
  onVersionRestored,
}) => {
  const styles = useStyles();
  const [versions, setVersions] = useState<FileVersionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  const loadVersions = async () => {
    if (!file || !token) return;
    try {
      setIsLoading(true);
      const data = await filesApi.getVersionHistory(token, file.id);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load version history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && file && token) {
      loadVersions();
    }
  }, [isOpen, file, token]);

  if (!file) return null;

  const handleRestore = async (versionNumber: number) => {
    if (!token) return;
    try {
      setRestoringVersion(versionNumber);
      const updated = await filesApi.restoreVersion(token, file.id, versionNumber);
      onVersionRestored(updated);
      await loadVersions();
    } catch (err) {
      console.error('Failed to restore version', err);
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface} aria-label={`Version history of ${file.name}`}>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
              aria-label="Close"
            />
          }
        >
          Version history: {file.name}
        </DialogTitle>

        <DialogBody>
          <DialogContent>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <Spinner label="Loading version history..." />
              </div>
            ) : versions.length === 0 ? (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                No version records found.
              </Text>
            ) : (
              <div className={styles.list}>
                {versions.map((ver) => {
                  const isCurrent = ver.versionNumber === file.currentVersion;
                  const dateStr = new Date(ver.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={ver.id}
                      className={`${styles.versionItem} ${isCurrent ? styles.currentVersionItem : ''}`}
                      data-testid={`version-item-${ver.versionNumber}`}
                    >
                      <div className={styles.versionInfo}>
                        <div className={styles.versionHeader}>
                          <Text weight="semibold">Version {ver.versionNumber}</Text>
                          {isCurrent && (
                            <Badge appearance="filled" color="brand" size="small">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className={styles.versionMeta}>
                          <ClockRegular />
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span>{formatBytes(ver.size)}</span>
                          {ver.createdBy && (
                            <>
                              <span>•</span>
                              <span>{ver.createdBy.displayName || ver.createdBy.email}</span>
                            </>
                          )}
                        </div>
                        {ver.changeSummary && (
                          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                            {ver.changeSummary}
                          </Text>
                        )}
                      </div>

                      <div>
                        {isCurrent ? (
                          <Badge appearance="tint" color="success" icon={<CheckmarkRegular />}>
                            Active
                          </Badge>
                        ) : (
                          <Button
                            size="small"
                            appearance="secondary"
                            icon={<ArrowResetRegular />}
                            disabled={restoringVersion !== null}
                            onClick={() => handleRestore(ver.versionNumber)}
                            data-testid={`restore-button-${ver.versionNumber}`}
                          >
                            {restoringVersion === ver.versionNumber ? 'Restoring...' : 'Restore'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
