import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { FilePreviewModal } from './FilePreviewModal';
import { filesApi } from './files.api';
import { FileItemDto } from './types';

vi.mock('./files.api', () => ({
  filesApi: {
    getPreviewUrl: vi.fn((id: string) => `/api/files/${id}/preview`),
    downloadBlob: vi.fn(),
  },
}));

describe('FilePreviewModal (D-003)', () => {
  const renderModal = (props: any) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <FilePreviewModal {...props} />
      </FluentProvider>
    );
  };

  const mockFile: FileItemDto = {
    id: 'f-image-1',
    name: 'sunset.png',
    size: 1048576,
    mimeType: 'image/png',
    extension: 'png',
    isFolder: false,
    ownerId: 'u1',
    currentVersion: 1,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    } else {
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  it('renders image preview with zoom controls', () => {
    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    expect(screen.getByText('sunset.png')).toBeInTheDocument();
    expect(screen.getByTestId('image-preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
  });

  it('zooms in and out when clicking zoom buttons', () => {
    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    const zoomInBtn = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByLabelText('Zoom out');
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders PDF preview frame for PDF documents', () => {
    const pdfFile: FileItemDto = {
      ...mockFile,
      id: 'f-pdf-1',
      name: 'annual-report.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
    };

    renderModal({
      file: pdfFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    expect(screen.getByTestId('pdf-preview-frame')).toBeInTheDocument();
  });

  it('renders video and audio players for media files', () => {
    const videoFile: FileItemDto = {
      ...mockFile,
      id: 'f-vid-1',
      name: 'recording.mp4',
      mimeType: 'video/mp4',
      extension: 'mp4',
    };

    const { unmount } = renderModal({
      file: videoFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    unmount();

    const audioFile: FileItemDto = {
      ...mockFile,
      id: 'f-aud-1',
      name: 'voice.mp3',
      mimeType: 'audio/mpeg',
      extension: 'mp3',
    };

    renderModal({
      file: audioFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
  });

  it('renders fallback with download button for unsupported file types', () => {
    const binaryFile: FileItemDto = {
      ...mockFile,
      id: 'f-bin-1',
      name: 'archive.zip',
      mimeType: 'application/zip',
      extension: 'zip',
    };

    renderModal({
      file: binaryFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    expect(screen.getByTestId('unsupported-preview')).toBeInTheDocument();
    expect(screen.getByText(/No preview available for this file type/i)).toBeInTheDocument();
  });

  it('triggers download when download button clicked', async () => {
    const mockBlob = new Blob(['data'], { type: 'image/png' });
    vi.mocked(filesApi.downloadBlob).mockResolvedValue({
      blob: mockBlob,
      filename: 'sunset.png',
    });

    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    const downloadBtn = screen.getByLabelText('Download file');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(filesApi.downloadBlob).toHaveBeenCalledWith('test-token', 'f-image-1', undefined);
    });
  });
});
