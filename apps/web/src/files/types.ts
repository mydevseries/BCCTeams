export type SharePermission = 'VIEW' | 'EDIT';
export type ShareScope = 'SPECIFIC_PEOPLE' | 'ORGANIZATION' | 'ANYONE_WITH_LINK';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface FileItemDto {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  extension?: string | null;
  isFolder: boolean;
  parentId?: string | null;
  ownerId: string;
  currentVersion: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  permission?: SharePermission;
}

export interface FolderBreadcrumb {
  id: string | null;
  name: string;
}

export interface FileListResponse {
  items: FileItemDto[];
  breadcrumbs: FolderBreadcrumb[];
}

export interface FileVersionDto {
  id: string;
  fileId: string;
  versionNumber: number;
  size: number;
  storageKey: string;
  createdById: string;
  changeSummary?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface FileShareDto {
  id: string;
  fileId: string;
  sharedWithUserId?: string | null;
  permission: SharePermission;
  scope: ShareScope;
  shareToken?: string | null;
  createdById: string;
  expiresAt?: string | null;
  createdAt: string;
  sharedWithUser?: {
    id: string;
    email: string;
    displayName: string;
  } | null;
  createdBy?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface FileAccessRequestDto {
  id: string;
  fileId: string;
  requesterId: string;
  requestedPermission: SharePermission;
  status: AccessRequestStatus;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  file?: {
    id: string;
    name: string;
    isFolder: boolean;
    mimeType: string;
    size: number;
  };
  requester?: {
    id: string;
    email: string;
    displayName: string;
  };
  reviewedBy?: {
    id: string;
    email: string;
    displayName: string;
  } | null;
}

export type FilesTab = 'my-files' | 'recent' | 'shared-with-me' | 'requests';
