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
  Input,
  RadioGroup,
  Radio,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  DismissRegular,
  CopyRegular,
  CheckmarkRegular,
  DeleteRegular,
  GlobeRegular,
  PeopleRegular,
  PersonRegular,
} from '@fluentui/react-icons';
import { FileItemDto, FileShareDto, SharePermission, ShareScope } from './types';
import { filesApi } from './files.api';

const useStyles = makeStyles({
  surface: {
    maxWidth: '560px',
    width: '90vw',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM, 0),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  radioRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  permissionRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  linkBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    marginTop: tokens.spacingVerticalS,
  },
  sharesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '200px',
    ...shorthands.overflow('auto'),
    marginTop: tokens.spacingVerticalS,
  },
  shareItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  shareDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
});

export interface ShareModalProps {
  file: FileItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, isOpen, onClose, token }) => {
  const styles = useStyles();
  const [scope, setScope] = useState<ShareScope>('ORGANIZATION');
  const [permission, setPermission] = useState<SharePermission>('VIEW');
  const [shares, setShares] = useState<FileShareDto[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<FileShareDto | null>(null);

  const loadShares = async () => {
    if (!file || !token) return;
    try {
      setIsLoadingShares(true);
      const data = await filesApi.getFileShares(token, file.id);
      setShares(data);
    } catch (err) {
      console.error('Failed to load shares', err);
    } finally {
      setIsLoadingShares(false);
    }
  };

  useEffect(() => {
    if (isOpen && file && token) {
      loadShares();
      setCreatedShare(null);
      setCopiedToken(null);
    }
  }, [isOpen, file, token]);

  if (!file) return null;

  const handleCreateShare = async () => {
    if (!token) return;
    try {
      setIsCreating(true);
      const res = await filesApi.createShare(token, file.id, {
        scope,
        permission,
      });
      setCreatedShare(res);
      await loadShares();
    } catch (err) {
      console.error('Failed to create share', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!token) return;
    try {
      await filesApi.revokeShare(token, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      if (createdShare?.id === shareId) {
        setCreatedShare(null);
      }
    } catch (err) {
      console.error('Failed to revoke share', err);
    }
  };

  const getShareUrl = (tokenStr?: string | null) => {
    if (!tokenStr) return '';
    return `${window.location.origin}/files?shareToken=${tokenStr}`;
  };

  const handleCopy = (shareTokenStr?: string | null) => {
    if (!shareTokenStr) return;
    const url = getShareUrl(shareTokenStr);
    navigator.clipboard.writeText(url);
    setCopiedToken(shareTokenStr);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface} aria-label={`Share ${file.name}`}>
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
          Share "{file.name}"
        </DialogTitle>

        <DialogBody>
          <DialogContent>
            {/* Create Share Section */}
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>1. Who can access this file</Text>
              <RadioGroup
                value={scope}
                onChange={(_, data) => setScope(data.value as ShareScope)}
                className={styles.radioRow}
              >
                <Radio
                  value="ORGANIZATION"
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PeopleRegular /> Anyone in BCC organization
                    </span>
                  }
                />
                <Radio
                  value="ANYONE_WITH_LINK"
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GlobeRegular /> Anyone with the link (public)
                    </span>
                  }
                />
                <Radio
                  value="SPECIFIC_PEOPLE"
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PersonRegular /> Specific people
                    </span>
                  }
                />
              </RadioGroup>

              <Text className={styles.sectionTitle} style={{ marginTop: tokens.spacingVerticalS }}>
                2. Permissions
              </Text>
              <RadioGroup
                value={permission}
                onChange={(_, data) => setPermission(data.value as SharePermission)}
                className={styles.permissionRow}
              >
                <Radio value="VIEW" label="Can view & download" />
                <Radio value="EDIT" label="Can edit" />
              </RadioGroup>

              <Button
                appearance="primary"
                onClick={handleCreateShare}
                disabled={isCreating}
                style={{ marginTop: tokens.spacingVerticalS }}
              >
                {isCreating ? <Spinner size="tiny" /> : 'Generate share link'}
              </Button>

              {createdShare && createdShare.shareToken && (
                <div className={styles.linkBox} data-testid="generated-share-link">
                  <Input
                    readOnly
                    value={getShareUrl(createdShare.shareToken)}
                    style={{ flex: 1 }}
                    aria-label="Share URL"
                  />
                  <Button
                    icon={copiedToken === createdShare.shareToken ? <CheckmarkRegular /> : <CopyRegular />}
                    onClick={() => handleCopy(createdShare.shareToken)}
                    appearance="secondary"
                  >
                    {copiedToken === createdShare.shareToken ? 'Copied' : 'Copy link'}
                  </Button>
                </div>
              )}
            </div>

            {/* Existing Shares Section */}
            <div className={styles.section} style={{ borderBottom: 'none' }}>
              <Text className={styles.sectionTitle}>Active sharing links ({shares.length})</Text>
              {isLoadingShares ? (
                <Spinner size="small" label="Loading active shares..." />
              ) : shares.length === 0 ? (
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  This file is not shared yet.
                </Text>
              ) : (
                <div className={styles.sharesList}>
                  {shares.map((share) => (
                    <div key={share.id} className={styles.shareItem} data-testid={`share-item-${share.id}`}>
                      <div className={styles.shareDetails}>
                        {share.scope === 'ANYONE_WITH_LINK' ? (
                          <GlobeRegular />
                        ) : share.scope === 'ORGANIZATION' ? (
                          <PeopleRegular />
                        ) : (
                          <PersonRegular />
                        )}
                        <div>
                          <Text weight="medium" size={300} block>
                            {share.scope === 'ANYONE_WITH_LINK'
                              ? 'Anyone with link'
                              : share.scope === 'ORGANIZATION'
                              ? 'BCC Organization'
                              : 'Specific people'}
                          </Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            Permission: {share.permission}
                          </Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS, alignItems: 'center' }}>
                        {share.shareToken && (
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={copiedToken === share.shareToken ? <CheckmarkRegular /> : <CopyRegular />}
                            onClick={() => handleCopy(share.shareToken)}
                            aria-label="Copy share link"
                          />
                        )}
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          onClick={() => handleRevokeShare(share.id)}
                          aria-label="Revoke share access"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Done
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
