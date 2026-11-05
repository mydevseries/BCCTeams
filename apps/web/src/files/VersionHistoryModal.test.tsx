import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { VersionHistoryModal } from './VersionHistoryModal';
import { filesApi } from './files.api';
import { FileItemDto, FileVersionDto } from './types';

vi.mock('./files.api', () => ({
  filesApi: {
    getVersionHistory: vi.fn(),
    restoreVersion: vi.fn(),
  },
}));

describe('VersionHistoryModal (D-005)', () => {
  const renderModal = (props: any) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <VersionHistoryModal {...props} />
      </FluentProvider>
    );
  };

  const mockFile: FileItemDto = {
    id: 'f-1',
    name: 'document.pdf',
    size: 2048,
    mimeType: 'application/pdf',
    isFolder: false,
    ownerId: 'u1',
    currentVersion: 2,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  };

  const mockVersions: FileVersionDto[] = [
    {
      id: 'v-2',
      fileId: 'f-1',
      versionNumber: 2,
      size: 2048,
      storageKey: 'key-v2',
      createdById: 'u1',
      createdAt: '2026-01-02T00:00:00Z',
      changeSummary: 'Second update',
    },
    {
      id: 'v-1',
      fileId: 'f-1',
      versionNumber: 1,
      size: 1024,
      storageKey: 'key-v1',
      createdById: 'u1',
      createdAt: '2026-01-01T00:00:00Z',
      changeSummary: 'Initial upload',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.getVersionHistory).mockResolvedValue(mockVersions);
  });

  it('renders version history list with Current badge on version 2', async () => {
    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
      onVersionRestored: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByTestId('version-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('version-item-1')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByTestId('restore-button-1')).toBeInTheDocument();
    });
  });

  it('restores version 1 when clicking restore button', async () => {
    const onVersionRestored = vi.fn();
    const updatedFile = { ...mockFile, currentVersion: 1 };
    vi.mocked(filesApi.restoreVersion).mockResolvedValue(updatedFile);

    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
      onVersionRestored,
    });

    await waitFor(() => {
      expect(screen.getByTestId('restore-button-1')).toBeInTheDocument();
    });

    const restoreBtn = screen.getByTestId('restore-button-1');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(filesApi.restoreVersion).toHaveBeenCalledWith('test-token', 'f-1', 1);
      expect(onVersionRestored).toHaveBeenCalledWith(updatedFile);
    });
  });
});
