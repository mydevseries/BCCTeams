import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ShareModal } from './ShareModal';
import { filesApi } from './files.api';
import { FileItemDto, FileShareDto } from './types';

vi.mock('./files.api', () => ({
  filesApi: {
    getFileShares: vi.fn(),
    createShare: vi.fn(),
    revokeShare: vi.fn(),
  },
}));

describe('ShareModal (D-004)', () => {
  const renderModal = (props: any) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <ShareModal {...props} />
      </FluentProvider>
    );
  };

  const mockFile: FileItemDto = {
    id: 'f-1',
    name: 'project-proposal.docx',
    size: 50000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    isFolder: false,
    ownerId: 'u1',
    currentVersion: 1,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockShares: FileShareDto[] = [
    {
      id: 'share-1',
      fileId: 'f-1',
      scope: 'ORGANIZATION',
      permission: 'VIEW',
      shareToken: 'tok-org-123',
      createdById: 'u1',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(filesApi.getFileShares).mockResolvedValue(mockShares);
  });

  it('renders modal and existing active shares', async () => {
    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    expect(screen.getByText(/Share "project-proposal.docx"/i)).toBeInTheDocument();
    await waitFor(() => {
      const shareItem = screen.getByTestId('share-item-share-1');
      expect(shareItem).toBeInTheDocument();
      expect(shareItem).toHaveTextContent('BCC Organization');
    });
  });

  it('generates a new share link and displays it', async () => {
    const newShare: FileShareDto = {
      id: 'share-2',
      fileId: 'f-1',
      scope: 'ANYONE_WITH_LINK',
      permission: 'VIEW',
      shareToken: 'tok-public-999',
      createdById: 'u1',
      createdAt: '2026-01-02T00:00:00Z',
    };
    vi.mocked(filesApi.createShare).mockResolvedValue(newShare);

    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    const generateBtn = screen.getByText('Generate share link');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(filesApi.createShare).toHaveBeenCalledWith('test-token', 'f-1', {
        scope: 'ORGANIZATION',
        permission: 'VIEW',
      });
      expect(screen.getByTestId('generated-share-link')).toBeInTheDocument();
    });
  });

  it('revokes an existing share', async () => {
    vi.mocked(filesApi.revokeShare).mockResolvedValue({ success: true, revokedId: 'share-1' });

    renderModal({
      file: mockFile,
      isOpen: true,
      onClose: vi.fn(),
      token: 'test-token',
    });

    await waitFor(() => {
      expect(screen.getByTestId('share-item-share-1')).toBeInTheDocument();
    });

    const revokeBtn = screen.getByLabelText('Revoke share access');
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(filesApi.revokeShare).toHaveBeenCalledWith('test-token', 'share-1');
      expect(screen.queryByTestId('share-item-share-1')).not.toBeInTheDocument();
    });
  });
});
