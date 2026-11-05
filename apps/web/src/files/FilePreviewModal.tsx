import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Spinner,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowDownloadRegular,
  ZoomInRegular,
  ZoomOutRegular,
  ArrowResetRegular,
  DocumentRegular,
} from '@fluentui/react-icons';
import { FileItemDto } from './types';
import { filesApi } from './files.api';

const useStyles = makeStyles({
  surface: {
    maxWidth: '900px',
    width: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    ...shorthands.overflow('hidden'),
  },
  titleText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    ...shorthands.overflow('hidden'),
  },
  metaText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    maxHeight: '70vh',
    ...shorthands.overflow('auto'),
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'relative',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  imageWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.overflow('auto'),
    width: '100%',
    height: '100%',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '65vh',
    objectFit: 'contain',
    transition: 'transform 0.15s ease-out',
    userSelect: 'none',
  },
  zoomControls: {
    position: 'absolute',
    bottom: tokens.spacingVerticalM,
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    boxShadow: tokens.shadow8,
    zIndex: 10,
  },
  pdfFrame: {
    width: '100%',
    height: '65vh',
    border: 'none',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: '#ffffff',
  },
  textContainer: {
    width: '100%',
    height: '65vh',
    ...shorthands.overflow('auto'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  mediaPlayer: {
    maxWidth: '100%',
    maxHeight: '65vh',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  fallbackContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    textAlign: 'center',
  },
  fallbackIcon: {
    fontSize: '64px',
    color: tokens.colorNeutralForeground4,
  },
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface FilePreviewModalProps {
  file: FileItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  shareToken?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  token,
  shareToken,
}) => {
  const styles = useStyles();
  const [zoom, setZoom] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) {
      setZoom(1);
      setTextContent(null);
      return;
    }

    setZoom(1);
    const mime = file.mimeType.toLowerCase();
    const isText =
      mime.startsWith('text/') ||
      mime.includes('json') ||
      mime.includes('javascript') ||
      mime.includes('typescript') ||
      mime.includes('markdown') ||
      file.extension === 'txt' ||
      file.extension === 'md' ||
      file.extension === 'json' ||
      file.extension === 'ts' ||
      file.extension === 'js';

    if (isText) {
      setIsLoadingText(true);
      const url = filesApi.getPreviewUrl(file.id, shareToken);
      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.text() : Promise.reject('Failed to load text preview')))
        .then((text) => setTextContent(text))
        .catch(() => setTextContent('Unable to load file content preview.'))
        .finally(() => setIsLoadingText(false));
    }
  }, [file, isOpen, token, shareToken]);

  if (!file) return null;

  const mime = file.mimeType.toLowerCase();
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  const isAudio = mime.startsWith('audio/');
  const isVideo = mime.startsWith('video/');
  const isText =
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('markdown') ||
    file.extension === 'txt' ||
    file.extension === 'md' ||
    file.extension === 'json' ||
    file.extension === 'ts' ||
    file.extension === 'js';

  const previewUrl = filesApi.getPreviewUrl(file.id, shareToken);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const { blob, filename } = await filesApi.downloadBlob(token || '', file.id, shareToken);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface} aria-label={`Preview of ${file.name}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Text className={styles.titleText}>{file.name}</Text>
            <Text className={styles.metaText}>
              {formatBytes(file.size)} • Version {file.currentVersion} • {file.mimeType}
            </Text>
          </div>
          <div className={styles.actionsGroup}>
            <Button
              appearance="subtle"
              icon={<ArrowDownloadRegular />}
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label="Download file"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
              aria-label="Close preview"
            />
          </div>
        </div>

        <DialogBody style={{ padding: 0 }}>
          <DialogContent style={{ padding: 0 }}>
            <div className={styles.contentContainer} data-testid="preview-content-container">
              {isImage && (
                <div className={styles.imageWrapper}>
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className={styles.image}
                    style={{ transform: `scale(${zoom})` }}
                    data-testid="image-preview"
                  />
                  <div className={styles.zoomControls}>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<ZoomInRegular />}
                      onClick={handleZoomIn}
                      aria-label="Zoom in"
                      disabled={zoom >= 3}
                    />
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<ZoomOutRegular />}
                      onClick={handleZoomOut}
                      aria-label="Zoom out"
                      disabled={zoom <= 0.5}
                    />
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<ArrowResetRegular />}
                      onClick={handleResetZoom}
                      aria-label="Reset zoom"
                    >
                      {Math.round(zoom * 100)}%
                    </Button>
                  </div>
                </div>
              )}

              {isPdf && (
                <iframe
                  src={previewUrl}
                  title={file.name}
                  className={styles.pdfFrame}
                  data-testid="pdf-preview-frame"
                />
              )}

              {isText && (
                <div className={styles.textContainer} data-testid="text-preview-container">
                  {isLoadingText ? (
                    <Spinner label="Loading preview content..." />
                  ) : (
                    textContent || 'No preview available.'
                  )}
                </div>
              )}

              {isVideo && (
                <video
                  src={previewUrl}
                  controls
                  className={styles.mediaPlayer}
                  data-testid="video-player"
                >
                  Your browser does not support inline video preview.
                </video>
              )}

              {isAudio && (
                <audio
                  src={previewUrl}
                  controls
                  className={styles.mediaPlayer}
                  data-testid="audio-player"
                >
                  Your browser does not support inline audio preview.
                </audio>
              )}

              {!isImage && !isPdf && !isText && !isVideo && !isAudio && (
                <div className={styles.fallbackContainer} data-testid="unsupported-preview">
                  <DocumentRegular className={styles.fallbackIcon} />
                  <div>
                    <Text weight="semibold" size={400} block>
                      No preview available for this file type
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>
                      You can download {file.name} to view it on your device.
                    </Text>
                  </div>
                  <Button
                    appearance="primary"
                    icon={<ArrowDownloadRegular />}
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    Download to view ({formatBytes(file.size)})
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
