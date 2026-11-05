import React, { useState, useEffect } from 'react';
import {
  Button,
  Spinner,
  Text,
  Badge,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  CheckmarkRegular,
  DismissRegular,
  PersonRegular,
  DocumentRegular,
  ClockRegular,
  ChevronDownRegular,
} from '@fluentui/react-icons';
import { FileAccessRequestDto, SharePermission, AccessRequestStatus } from './types';
import { filesApi } from './files.api';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    maxWidth: '1000px',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  requesterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  noteText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
    marginTop: tokens.spacingVerticalXXS,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    gap: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
  },
});

export interface AccessRequestsTabProps {
  token: string | null;
  onRequestReviewed?: () => void;
}

export const AccessRequestsTab: React.FC<AccessRequestsTabProps> = ({
  token,
  onRequestReviewed,
}) => {
  const styles = useStyles();
  const [requests, setRequests] = useState<FileAccessRequestDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await filesApi.getPendingRequests(token);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load pending requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token]);

  const handleReview = async (
    requestId: string,
    status: AccessRequestStatus,
    grantedPermission?: SharePermission
  ) => {
    if (!token) return;
    try {
      setProcessingId(requestId);
      await filesApi.reviewAccessRequest(token, requestId, {
        status,
        grantedPermission,
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onRequestReviewed?.();
    } catch (err) {
      console.error('Failed to review request', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Pending Access Requests</Text>
        <Button size="small" appearance="subtle" onClick={loadRequests}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner label="Loading pending access requests..." />
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState} data-testid="no-access-requests">
          <DocumentRegular style={{ fontSize: '48px' }} />
          <Text weight="semibold" size={400}>
            No pending access requests
          </Text>
          <Text size={200}>
            When someone requests access to your files or folders, their requests will appear here.
          </Text>
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map((req) => (
            <div key={req.id} className={styles.card} data-testid={`request-card-${req.id}`}>
              <div className={styles.cardContent}>
                <div className={styles.requesterRow}>
                  <PersonRegular />
                  <Text weight="semibold">
                    {req.requester?.displayName || req.requester?.email || 'Unknown User'}
                  </Text>
                  <Badge appearance="tint" color="brand">
                    Requested: {req.requestedPermission}
                  </Badge>
                </div>

                <div className={styles.fileRow}>
                  <DocumentRegular />
                  <Text>{req.file?.name || 'File'}</Text>
                  <span>•</span>
                  <ClockRegular />
                  <Text>{new Date(req.createdAt).toLocaleDateString()}</Text>
                </div>

                {req.note && <Text className={styles.noteText}>"{req.note}"</Text>}
              </div>

              <div className={styles.actions}>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance="primary"
                      icon={<CheckmarkRegular />}
                      iconPosition="before"
                      disabled={processingId === req.id}
                      data-testid={`approve-btn-${req.id}`}
                    >
                      Approve <ChevronDownRegular />
                    </Button>
                  </MenuTrigger>
                  <MenuList>
                    <MenuItem
                      onClick={() => handleReview(req.id, 'APPROVED', 'VIEW')}
                      data-testid={`approve-view-${req.id}`}
                    >
                      Approve with View access
                    </MenuItem>
                    <MenuItem
                      onClick={() => handleReview(req.id, 'APPROVED', 'EDIT')}
                      data-testid={`approve-edit-${req.id}`}
                    >
                      Approve with Edit access
                    </MenuItem>
                  </MenuList>
                </Menu>

                <Button
                  appearance="secondary"
                  icon={<DismissRegular />}
                  disabled={processingId === req.id}
                  onClick={() => handleReview(req.id, 'DENIED')}
                  data-testid={`deny-btn-${req.id}`}
                >
                  Deny
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
