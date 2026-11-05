import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Spinner,
  Text,
  Input,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  FolderRegular,
  FolderFilled,
  FolderAddRegular,
  ArrowUploadRegular,
  ArrowDownloadRegular,
  ShareRegular,
  HistoryRegular,
  DeleteRegular,
  EditRegular,
  EyeRegular,
  SearchRegular,
  MoreHorizontalRegular,
  ClockRegular,
  PeopleRegular,
  DocumentRegular,
  ImageRegular,
  VideoRegular,
  MusicNote2Regular,
  CodeRegular,
  ChevronRightRegular,
  ArrowRightRegular,
  LockClosedRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../auth/AuthContext';
import {
  FileItemDto,
  FolderBreadcrumb,
  FilesTab,
} from './types';
import { filesApi, ApiError } from './files.api';
import { FilePreviewModal } from './FilePreviewModal';
import { ShareModal } from './ShareModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { RequestAccessModal } from './RequestAccessModal';
import { AccessRequestsTab } from './AccessRequestsTab';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.overflow('hidden'),
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalS),
    gap: tokens.spacingVerticalXS,
  },
  sidebarTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    color: tokens.colorNeutralForeground1,
  },
  navButton: {
    justifyContent: 'flex-start',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    width: '100%',
    textAlign: 'left',
    position: 'relative',
  },
  activeNavButton: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.margin(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.overflow('hidden'),
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '52px',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  searchBox: {
    minWidth: '220px',
    maxWidth: '320px',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    cursor: 'pointer',
    color: tokens.colorBrandForegroundLink,
    ':hover': {
      textDecoration: 'underline',
    },
  },
  breadcrumbCurrent: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  dropZone: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    ...shorthands.overflow('auto'),
    position: 'relative',
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colorBrandBackgroundInverted,
    opacity: 0.9,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    zIndex: 100,
    border: `2px dashed ${tokens.colorBrandStroke1}`,
  },
  fileList: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalL),
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    gap: tokens.spacingHorizontalM,
  },
  iconCell: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
  },
  nameCell: {
    flex: 2,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  fileNameText: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    whiteSpace: 'nowrap',
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
  },
  dateCell: {
    flex: 1,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    minWidth: '120px',
  },
  sizeCell: {
    width: '80px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: 'right',
  },
  actionCell: {
    width: '40px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    flex: 1,
    textAlign: 'center',
  },
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(item: FileItemDto) {
  if (item.isFolder) {
    return <FolderFilled style={{ color: '#D4B106' }} />;
  }
  const mime = item.mimeType.toLowerCase();
  if (mime.startsWith('image/')) return <ImageRegular style={{ color: '#0078D4' }} />;
  if (mime.startsWith('video/')) return <VideoRegular style={{ color: '#D83B01' }} />;
  if (mime.startsWith('audio/')) return <MusicNote2Regular style={{ color: '#107C41' }} />;
  if (mime.includes('code') || mime.includes('javascript') || mime.includes('json'))
    return <CodeRegular style={{ color: '#8764B8' }} />;
  return <DocumentRegular style={{ color: '#5C2D91' }} />;
}

export const FilesView: React.FC = () => {
  const styles = useStyles();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab & navigation state
  const [activeTab, setActiveTab] = useState<FilesTab>('my-files');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([{ id: null, name: 'My files' }]);
  const [items, setItems] = useState<FileItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Drag & drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Modal dialog states
  const [previewFile, setPreviewFile] = useState<FileItemDto | null>(null);
  const [shareFile, setShareFile] = useState<FileItemDto | null>(null);
  const [historyFile, setHistoryFile] = useState<FileItemDto | null>(null);
  const [accessDeniedFile, setAccessDeniedFile] = useState<{ id: string; name: string } | null>(null);

  // Operation dialogs
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<FileItemDto | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItemDto | null>(null);
  const [moveTarget, setMoveTarget] = useState<FileItemDto | null>(null);
  const [availableFolders, setAvailableFolders] = useState<FileItemDto[]>([]);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      if (activeTab === 'my-files') {
        const res = await filesApi.getMyFiles(token, currentFolderId || undefined);
        setItems(res.items);
        setBreadcrumbs(res.breadcrumbs);
      } else if (activeTab === 'recent') {
        const res = await filesApi.getRecentFiles(token);
        setItems(res);
      } else if (activeTab === 'shared-with-me') {
        const res = await filesApi.getSharedWithMe(token);
        setItems(res);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403 && currentFolderId) {
        setAccessDeniedFile({ id: currentFolderId, name: 'Restricted Folder' });
      }
      console.error('Error loading files', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingCount = async () => {
    if (!token) return;
    try {
      const pending = await filesApi.getPendingRequests(token);
      setPendingRequestsCount(pending.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    loadPendingCount();
  }, [token, activeTab, currentFolderId]);

  // Folder navigation
  const handleItemClick = (item: FileItemDto) => {
    if (item.isFolder) {
      setCurrentFolderId(item.id);
    } else {
      setPreviewFile(item);
    }
  };

  const handleBreadcrumbClick = (id: string | null) => {
    setCurrentFolderId(id);
  };

  // Upload handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      setIsLoading(true);
      await filesApi.uploadFile(token, file, currentFolderId || undefined);
      await loadData();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0 || !token) return;

    try {
      setIsLoading(true);
      for (let i = 0; i < files.length; i++) {
        await filesApi.uploadFile(token, files[i], currentFolderId || undefined);
      }
      await loadData();
    } catch (err) {
      console.error('Drop upload failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Folder Creation
  const handleCreateFolder = async () => {
    if (!token || !newFolderName.trim()) return;
    try {
      await filesApi.createFolder(token, newFolderName.trim(), currentFolderId || undefined);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create folder', err);
    }
  };

  // Rename
  const handleRenameSubmit = async () => {
    if (!token || !renameTarget || !newName.trim()) return;
    try {
      await filesApi.renameItem(token, renameTarget.id, newName.trim());
      setRenameTarget(null);
      setNewName('');
      await loadData();
    } catch (err) {
      console.error('Failed to rename item', err);
    }
  };

  // Move
  const handleOpenMove = async (item: FileItemDto) => {
    if (!token) return;
    setMoveTarget(item);
    setTargetMoveFolderId(null);
    try {
      const res = await filesApi.getMyFiles(token);
      const folders = res.items.filter((i) => i.isFolder && i.id !== item.id);
      setAvailableFolders(folders);
    } catch {
      setAvailableFolders([]);
    }
  };

  const handleMoveSubmit = async () => {
    if (!token || !moveTarget) return;
    try {
      await filesApi.moveItem(token, moveTarget.id, targetMoveFolderId);
      setMoveTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to move item', err);
    }
  };

  // Delete
  const handleDeleteSubmit = async () => {
    if (!token || !deleteTarget) return;
    try {
      await filesApi.deleteItem(token, deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  // Download
  const handleDownload = async (item: FileItemDto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!token) return;
    try {
      const { blob, filename } = await filesApi.downloadBlob(token, item.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        setAccessDeniedFile({ id: item.id, name: item.name });
      }
      console.error('Download error', err);
    }
  };

  // Filter items by search
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.root}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Sidebar navigation */}
      <div className={styles.sidebar}>
        <Text className={styles.sidebarTitle}>Files</Text>

        <Button
          appearance="subtle"
          icon={<FolderRegular />}
          className={`${styles.navButton} ${activeTab === 'my-files' ? styles.activeNavButton : ''}`}
          onClick={() => {
            setActiveTab('my-files');
            setCurrentFolderId(null);
          }}
          data-testid="tab-my-files"
        >
          My files
        </Button>

        <Button
          appearance="subtle"
          icon={<ClockRegular />}
          className={`${styles.navButton} ${activeTab === 'recent' ? styles.activeNavButton : ''}`}
          onClick={() => {
            setActiveTab('recent');
            setCurrentFolderId(null);
          }}
          data-testid="tab-recent"
        >
          Recent
        </Button>

        <Button
          appearance="subtle"
          icon={<PeopleRegular />}
          className={`${styles.navButton} ${activeTab === 'shared-with-me' ? styles.activeNavButton : ''}`}
          onClick={() => {
            setActiveTab('shared-with-me');
            setCurrentFolderId(null);
          }}
          data-testid="tab-shared-with-me"
        >
          Shared with me
        </Button>

        <Button
          appearance="subtle"
          icon={<LockClosedRegular />}
          className={`${styles.navButton} ${activeTab === 'requests' ? styles.activeNavButton : ''}`}
          onClick={() => setActiveTab('requests')}
          data-testid="tab-access-requests"
        >
          Access requests
          {pendingRequestsCount > 0 && (
            <Badge appearance="filled" color="danger" size="small" style={{ marginLeft: 'auto' }}>
              {pendingRequestsCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main content pane */}
      <div className={styles.mainArea}>
        {activeTab === 'requests' ? (
          <AccessRequestsTab
            token={token}
            onRequestReviewed={() => {
              loadPendingCount();
              loadData();
            }}
          />
        ) : (
          <>
            {/* Top action bar */}
            <div className={styles.topBar}>
              <div className={styles.actionGroup}>
                {activeTab === 'my-files' && (
                  <>
                    <Button
                      appearance="primary"
                      icon={<ArrowUploadRegular />}
                      onClick={handleUploadClick}
                      data-testid="upload-file-btn"
                    >
                      Upload
                    </Button>
                    <Button
                      appearance="secondary"
                      icon={<FolderAddRegular />}
                      onClick={() => setIsNewFolderOpen(true)}
                      data-testid="new-folder-btn"
                    >
                      New folder
                    </Button>
                  </>
                )}
              </div>

              <div className={styles.searchBox}>
                <Input
                  contentBefore={<SearchRegular />}
                  placeholder="Filter files..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Breadcrumb row (for My files) */}
            {activeTab === 'my-files' && (
              <div className={styles.breadcrumbs} data-testid="folder-breadcrumbs">
                {breadcrumbs.map((b, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={b.id || 'root'}>
                      {idx > 0 && <ChevronRightRegular />}
                      <span
                        className={isLast ? styles.breadcrumbCurrent : styles.breadcrumbItem}
                        onClick={() => !isLast && handleBreadcrumbClick(b.id)}
                        role="button"
                        tabIndex={0}
                      >
                        {b.name}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Drop zone & table */}
            <div
              className={styles.dropZone}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-testid="file-drop-zone"
            >
              {isDraggingOver && (
                <div className={styles.dragOverlay}>
                  <ArrowUploadRegular style={{ fontSize: '48px', color: tokens.colorBrandForeground1 }} />
                  <Text weight="semibold" size={500}>
                    Drop files here to upload
                  </Text>
                </div>
              )}

              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                  <Spinner label="Loading items..." />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className={styles.emptyState} data-testid="files-empty-state">
                  <DocumentRegular style={{ fontSize: '56px' }} />
                  <Text weight="semibold" size={400}>
                    {searchQuery
                      ? 'No items match your filter.'
                      : activeTab === 'my-files'
                      ? 'This folder is empty.'
                      : activeTab === 'recent'
                      ? 'No recent files found.'
                      : 'No files have been shared with you yet.'}
                  </Text>
                  {activeTab === 'my-files' && !searchQuery && (
                    <Text size={200}>Upload a file or create a folder to get started.</Text>
                  )}
                </div>
              ) : (
                <div className={styles.fileList} role="table">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={styles.fileRow}
                      onClick={() => handleItemClick(item)}
                      data-testid={`file-row-${item.id}`}
                      role="row"
                    >
                      <div className={styles.iconCell}>{getFileIcon(item)}</div>

                      <div className={styles.nameCell}>
                        <Text className={styles.fileNameText}>{item.name}</Text>
                        {item.owner && activeTab === 'shared-with-me' && (
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
                            Shared by {item.owner.displayName || item.owner.email}
                          </Text>
                        )}
                      </div>

                      <div className={styles.dateCell}>
                        {new Date(item.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>

                      <div className={styles.sizeCell}>
                        {item.isFolder ? '--' : formatBytes(item.size)}
                      </div>

                      <div className={styles.actionCell} onClick={(e) => e.stopPropagation()}>
                        <Menu>
                          <MenuTrigger disableButtonEnhancement>
                            <Button
                              appearance="subtle"
                              icon={<MoreHorizontalRegular />}
                              aria-label={`Options for ${item.name}`}
                              data-testid={`menu-trigger-${item.id}`}
                            />
                          </MenuTrigger>
                          <MenuList>
                            {!item.isFolder && (
                              <MenuItem
                                icon={<EyeRegular />}
                                onClick={() => setPreviewFile(item)}
                                data-testid={`action-preview-${item.id}`}
                              >
                                Preview
                              </MenuItem>
                            )}

                            {!item.isFolder && (
                              <MenuItem
                                icon={<ArrowDownloadRegular />}
                                onClick={(e) => handleDownload(item, e)}
                                data-testid={`action-download-${item.id}`}
                              >
                                Download
                              </MenuItem>
                            )}

                            <MenuItem
                              icon={<ShareRegular />}
                              onClick={() => setShareFile(item)}
                              data-testid={`action-share-${item.id}`}
                            >
                              Share
                            </MenuItem>

                            {!item.isFolder && (
                              <MenuItem
                                icon={<HistoryRegular />}
                                onClick={() => setHistoryFile(item)}
                                data-testid={`action-history-${item.id}`}
                              >
                                Version history
                              </MenuItem>
                            )}

                            <MenuItem
                              icon={<EditRegular />}
                              onClick={() => {
                                setRenameTarget(item);
                                setNewName(item.name);
                              }}
                              data-testid={`action-rename-${item.id}`}
                            >
                              Rename
                            </MenuItem>

                            <MenuItem
                              icon={<ArrowRightRegular />}
                              onClick={() => handleOpenMove(item)}
                              data-testid={`action-move-${item.id}`}
                            >
                              Move to...
                            </MenuItem>

                            <MenuItem
                              icon={<DeleteRegular />}
                              onClick={() => setDeleteTarget(item)}
                              data-testid={`action-delete-${item.id}`}
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals & Dialogs */}

      {/* Preview Modal (D-003) */}
      <FilePreviewModal
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        token={token}
      />

      {/* Share Modal (D-004) */}
      <ShareModal
        file={shareFile}
        isOpen={Boolean(shareFile)}
        onClose={() => setShareFile(null)}
        token={token}
      />

      {/* Version History Modal (D-005) */}
      <VersionHistoryModal
        file={historyFile}
        isOpen={Boolean(historyFile)}
        onClose={() => setHistoryFile(null)}
        token={token}
        onVersionRestored={(updated) => {
          setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />

      {/* Request Access Modal (D-009) */}
      {accessDeniedFile && (
        <RequestAccessModal
          fileId={accessDeniedFile.id}
          fileName={accessDeniedFile.name}
          isOpen={Boolean(accessDeniedFile)}
          onClose={() => setAccessDeniedFile(null)}
          token={token}
        />
      )}

      {/* New Folder Dialog */}
      <Dialog
        open={isNewFolderOpen}
        onOpenChange={(_, data) => !data.open && setIsNewFolderOpen(false)}
      >
        <DialogSurface aria-label="Create new folder">
          <DialogTitle>New folder</DialogTitle>
          <DialogBody>
            <DialogContent>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(_, data) => setNewFolderName(data.value)}
                style={{ width: '100%', marginTop: '8px' }}
                autoFocus
                data-testid="new-folder-input"
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsNewFolderOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                data-testid="create-folder-confirm"
              >
                Create
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(_, data) => !data.open && setRenameTarget(null)}
      >
        <DialogSurface aria-label="Rename item">
          <DialogTitle>Rename "{renameTarget?.name}"</DialogTitle>
          <DialogBody>
            <DialogContent>
              <Input
                value={newName}
                onChange={(_, data) => setNewName(data.value)}
                style={{ width: '100%', marginTop: '8px' }}
                autoFocus
                data-testid="rename-input"
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleRenameSubmit}
                disabled={!newName.trim()}
                data-testid="rename-confirm-btn"
              >
                Save
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Move Dialog */}
      <Dialog
        open={Boolean(moveTarget)}
        onOpenChange={(_, data) => !data.open && setMoveTarget(null)}
      >
        <DialogSurface aria-label="Move item">
          <DialogTitle>Move "{moveTarget?.name}" to</DialogTitle>
          <DialogBody>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <Button
                  appearance={targetMoveFolderId === null ? 'primary' : 'subtle'}
                  icon={<FolderRegular />}
                  onClick={() => setTargetMoveFolderId(null)}
                  style={{ justifyContent: 'flex-start' }}
                  data-testid="move-to-root"
                >
                  Root (My files)
                </Button>
                {availableFolders.map((f) => (
                  <Button
                    key={f.id}
                    appearance={targetMoveFolderId === f.id ? 'primary' : 'subtle'}
                    icon={<FolderRegular />}
                    onClick={() => setTargetMoveFolderId(f.id)}
                    style={{ justifyContent: 'flex-start' }}
                    data-testid={`move-to-folder-${f.id}`}
                  >
                    {f.name}
                  </Button>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setMoveTarget(null)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleMoveSubmit} data-testid="move-confirm-btn">
                Move here
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(_, data) => !data.open && setDeleteTarget(null)}
      >
        <DialogSurface aria-label="Confirm deletion">
          <DialogTitle>Delete {deleteTarget?.isFolder ? 'folder' : 'file'}?</DialogTitle>
          <DialogBody>
            <DialogContent>
              <Text>
                Are you sure you want to delete "{deleteTarget?.name}"?
                {deleteTarget?.isFolder && ' All files and folders inside it will also be deleted.'}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleDeleteSubmit}
                data-testid="delete-confirm-btn"
              >
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
