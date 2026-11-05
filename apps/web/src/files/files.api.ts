import {
  FileListResponse,
  FileItemDto,
  FileVersionDto,
  FileShareDto,
  FileAccessRequestDto,
  SharePermission,
  ShareScope,
  AccessRequestStatus,
} from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.message ||
      (res.status === 403
        ? 'Forbidden: Access denied to this file or folder'
        : res.statusText || 'Request failed');
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }
  return res.json();
}

export const filesApi = {
  // D-001: Views
  async getMyFiles(token: string, parentId?: string): Promise<FileListResponse> {
    const url = parentId
      ? `${API_BASE}/files/my-files?parentId=${encodeURIComponent(parentId)}`
      : `${API_BASE}/files/my-files`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileListResponse>(res);
  },

  async getRecentFiles(token: string): Promise<FileItemDto[]> {
    const res = await fetch(`${API_BASE}/files/recent`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileItemDto[]>(res);
  },

  async getSharedWithMe(token: string): Promise<FileItemDto[]> {
    const res = await fetch(`${API_BASE}/files/shared-with-me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileItemDto[]>(res);
  },

  // D-002: Folders & File Operations
  async createFolder(token: string, name: string, parentId?: string): Promise<FileItemDto> {
    const res = await fetch(`${API_BASE}/files/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, parentId }),
    });
    return handleResponse<FileItemDto>(res);
  },

  async uploadFile(token: string, file: File, parentId?: string): Promise<FileItemDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) {
      formData.append('parentId', parentId);
    }

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse<FileItemDto>(res);
  },

  async getFileMetadata(token: string, fileId: string, shareToken?: string): Promise<FileItemDto> {
    const url = shareToken
      ? `${API_BASE}/files/${fileId}?shareToken=${encodeURIComponent(shareToken)}`
      : `${API_BASE}/files/${fileId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileItemDto>(res);
  },

  getDownloadUrl(fileId: string, shareToken?: string): string {
    return shareToken
      ? `${API_BASE}/files/${fileId}/download?shareToken=${encodeURIComponent(shareToken)}`
      : `${API_BASE}/files/${fileId}/download`;
  },

  getPreviewUrl(fileId: string, shareToken?: string): string {
    return shareToken
      ? `${API_BASE}/files/${fileId}/preview?shareToken=${encodeURIComponent(shareToken)}`
      : `${API_BASE}/files/${fileId}/preview`;
  },

  async downloadBlob(token: string, fileId: string, shareToken?: string): Promise<{ blob: Blob; filename: string }> {
    const url = this.getDownloadUrl(fileId, shareToken);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Download failed', res.status);
    }
    const disposition = res.headers.get('content-disposition') || '';
    let filename = 'download';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }
    const blob = await res.blob();
    return { blob, filename };
  },

  async renameItem(token: string, fileId: string, name: string): Promise<FileItemDto> {
    const res = await fetch(`${API_BASE}/files/${fileId}/rename`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    return handleResponse<FileItemDto>(res);
  },

  async moveItem(token: string, fileId: string, targetParentId?: string | null): Promise<FileItemDto> {
    const res = await fetch(`${API_BASE}/files/${fileId}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetParentId }),
    });
    return handleResponse<FileItemDto>(res);
  },

  async deleteItem(token: string, fileId: string): Promise<{ success: boolean; deletedId: string }> {
    const res = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<{ success: boolean; deletedId: string }>(res);
  },

  // D-004: Sharing
  async createShare(
    token: string,
    fileId: string,
    dto: {
      permission: SharePermission;
      scope: ShareScope;
      sharedWithUserId?: string;
      expiresAt?: string;
    }
  ): Promise<FileShareDto> {
    const res = await fetch(`${API_BASE}/files/${fileId}/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    return handleResponse<FileShareDto>(res);
  },

  async getFileShares(token: string, fileId: string): Promise<FileShareDto[]> {
    const res = await fetch(`${API_BASE}/files/${fileId}/shares`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileShareDto[]>(res);
  },

  async revokeShare(token: string, shareId: string): Promise<{ success: boolean; revokedId: string }> {
    const res = await fetch(`${API_BASE}/files/shares/${shareId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<{ success: boolean; revokedId: string }>(res);
  },

  async getByShareToken(shareToken: string): Promise<{ file: FileItemDto; permission: SharePermission; scope: ShareScope }> {
    const res = await fetch(`${API_BASE}/files/shared/token/${encodeURIComponent(shareToken)}`);
    return handleResponse<{ file: FileItemDto; permission: SharePermission; scope: ShareScope }>(res);
  },

  // D-005: Version History
  async getVersionHistory(token: string, fileId: string): Promise<FileVersionDto[]> {
    const res = await fetch(`${API_BASE}/files/${fileId}/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileVersionDto[]>(res);
  },

  async restoreVersion(token: string, fileId: string, versionNumber: number): Promise<FileItemDto> {
    const res = await fetch(`${API_BASE}/files/${fileId}/versions/${versionNumber}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileItemDto>(res);
  },

  // D-009: File Access Requests
  async createAccessRequest(
    token: string,
    dto: {
      fileId: string;
      requestedPermission?: SharePermission;
      note?: string;
    }
  ): Promise<FileAccessRequestDto> {
    const res = await fetch(`${API_BASE}/files/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    return handleResponse<FileAccessRequestDto>(res);
  },

  async getPendingRequests(token: string): Promise<FileAccessRequestDto[]> {
    const res = await fetch(`${API_BASE}/files/access-requests/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<FileAccessRequestDto[]>(res);
  },

  async reviewAccessRequest(
    token: string,
    requestId: string,
    dto: {
      status: AccessRequestStatus;
      grantedPermission?: SharePermission;
    }
  ): Promise<FileAccessRequestDto> {
    const res = await fetch(`${API_BASE}/files/access-requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    return handleResponse<FileAccessRequestDto>(res);
  },
};
