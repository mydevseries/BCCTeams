import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { FilesView } from './FilesView';
import { filesApi } from './files.api';
import * as AuthContext from '../auth/AuthContext';
import { FileListResponse } from './types';

vi.mock('./files.api', () => ({
  filesApi: {
    getMyFiles: vi.fn(),
    getRecentFiles: vi.fn(),
    getSharedWithMe: vi.fn(),
    createFolder: vi.fn(),
    uploadFile: vi.fn(),
    downloadBlob: vi.fn(),
    renameItem: vi.fn(),
    moveItem: vi.fn(),
    deleteItem: vi.fn(),
    getPendingRequests: vi.fn(),
    getFileShares: vi.fn(),
    getVersionHistory: vi.fn(),
    getPreviewUrl: vi.fn((id: string) => `/api/files/${id}/preview`),
  },
  ApiError: class extends Error {
    status: number;
    constructor(msg: string, status: number) {
      super(msg);
      this.status = status;
    }
  },
}));

describe('FilesView (D-001 & D-002)', () => {
  const mockUser = {
    id: 'u1',
    email: 'user@bcc.com',
    displayName: 'Test User',
    role: 'MEMBER' as const,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockFileList: FileListResponse = {
    items: [
      {
        id: 'f-folder-1',
        name: 'Project Docs',
        size: 0,
        mimeType: 'application/x-directory',
        isFolder: true,
        ownerId: 'u1',
        currentVersion: 1,
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'f-file-1',
        name: 'Design.pdf',
        size: 10240,
        mimeType: 'application/pdf',
        isFolder: false,
        ownerId: 'u1',
        currentVersion: 1,
        isDeleted: false,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ],
    breadcrumbs: [{ id: null, name: 'My files' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    vi.mocked(filesApi.getMyFiles).mockResolvedValue(mockFileList);
    vi.mocked(filesApi.getRecentFiles).mockResolvedValue([mockFileList.items[1]]);
    vi.mocked(filesApi.getSharedWithMe).mockResolvedValue([]);
    vi.mocked(filesApi.getPendingRequests).mockResolvedValue([]);
  });

  const renderView = () => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <FilesView />
      </FluentProvider>
    );
  };

  it('renders files view with sidebar and file list', async () => {
    renderView();

    expect(screen.getByTestId('tab-my-files')).toBeInTheDocument();
    expect(screen.getByTestId('tab-recent')).toBeInTheDocument();
    expect(screen.getByTestId('tab-shared-with-me')).toBeInTheDocument();
    expect(screen.getByTestId('tab-access-requests')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Project Docs')).toBeInTheDocument();
      expect(screen.getByText('Design.pdf')).toBeInTheDocument();
    });
  });

  it('switches tabs to Recent and Shared with me', async () => {
    renderView();

    const recentTab = screen.getByTestId('tab-recent');
    fireEvent.click(recentTab);

    await waitFor(() => {
      expect(filesApi.getRecentFiles).toHaveBeenCalledWith('test-token');
      expect(screen.getByText('Design.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Project Docs')).not.toBeInTheDocument();
    });

    const sharedTab = screen.getByTestId('tab-shared-with-me');
    fireEvent.click(sharedTab);

    await waitFor(() => {
      expect(filesApi.getSharedWithMe).toHaveBeenCalledWith('test-token');
      expect(screen.getByText(/No files have been shared with you yet/i)).toBeInTheDocument();
    });
  });

  it('creates a new folder via the dialog', async () => {
    vi.mocked(filesApi.createFolder).mockResolvedValue({
      id: 'f-folder-new',
      name: 'Marketing',
      size: 0,
      mimeType: 'application/x-directory',
      isFolder: true,
      ownerId: 'u1',
      currentVersion: 1,
      isDeleted: false,
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-03T00:00:00Z',
    });

    renderView();

    const newFolderBtn = screen.getByTestId('new-folder-btn');
    fireEvent.click(newFolderBtn);

    const input = screen.getByTestId('new-folder-input');
    fireEvent.change(input, { target: { value: 'Marketing' } });

    const createBtn = screen.getByTestId('create-folder-confirm');
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(filesApi.createFolder).toHaveBeenCalledWith('test-token', 'Marketing', undefined);
    });
  });

  it('filters file list by search input', async () => {
    renderView();

    await waitFor(() => {
      expect(screen.getByText('Project Docs')).toBeInTheDocument();
      expect(screen.getByText('Design.pdf')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Filter files...');
    fireEvent.change(searchInput, { target: { value: 'Design' } });

    expect(screen.getByText('Design.pdf')).toBeInTheDocument();
    expect(screen.queryByText('Project Docs')).not.toBeInTheDocument();
  });
});
