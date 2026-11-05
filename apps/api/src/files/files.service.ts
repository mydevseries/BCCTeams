import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE_TOKEN, IStorageService } from '../storage/storage.interface';
import { CreateShareDto, CreateAccessRequestDto, ReviewAccessRequestDto } from './dto/share-and-access.dto';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN) private readonly storageService: IStorageService
  ) {}

  // ==========================================
  // D-001: Files App Views (My files, Recent, Shared with me)
  // ==========================================

  async getMyFiles(userId: string, parentId?: string) {
    let breadcrumbs: BreadcrumbItem[] = [];

    if (parentId) {
      const parent = await this.prisma.fileItem.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.isDeleted) {
        throw new NotFoundException('Folder not found');
      }

      // Check permission
      await this.verifyAccess(parentId, userId, 'VIEW');

      // Build breadcrumbs
      breadcrumbs = await this.buildBreadcrumbs(parentId);
    }

    const items = await this.prisma.fileItem.findMany({
      where: {
        ownerId: userId,
        parentId: parentId || null,
        isDeleted: false,
      },
      orderBy: [
        { isFolder: 'desc' }, // Folders first
        { name: 'asc' },
      ],
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return {
      items: items.map(this.serializeFileItem),
      breadcrumbs,
    };
  }

  async getRecentFiles(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await this.prisma.fileItem.findMany({
      where: {
        ownerId: userId,
        isFolder: false,
        isDeleted: false,
        updatedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return items.map(this.serializeFileItem);
  }

  async getSharedWithMe(userId: string) {
    const shares = await this.prisma.fileShare.findMany({
      where: {
        OR: [
          { sharedWithUserId: userId },
          { scope: 'ORGANIZATION' },
        ],
        file: { isDeleted: false },
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ],
      },
      include: {
        file: {
          include: {
            owner: {
              select: { id: true, displayName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares.map((s) => ({
      ...this.serializeFileItem(s.file),
      sharePermission: s.permission,
      shareScope: s.scope,
      sharedAt: s.createdAt,
    }));
  }

  // ==========================================
  // D-002: Folders & File Operations
  // ==========================================

  async createFolder(userId: string, name: string, parentId?: string) {
    if (parentId) {
      await this.verifyAccess(parentId, userId, 'EDIT');
    }

    const folder = await this.prisma.fileItem.create({
      data: {
        name: name.trim(),
        mimeType: 'application/vnd.bccteams.folder',
        isFolder: true,
        size: BigInt(0),
        ownerId: userId,
        parentId: parentId || null,
      },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serializeFileItem(folder);
  }

  async uploadFile(userId: string, file: Express.Multer.File, parentId?: string) {
    if (parentId) {
      await this.verifyAccess(parentId, userId, 'EDIT');
    }

    const filename = file.originalname || 'unnamed-file';
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const storageKey = `files/${userId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${filename}`;

    // 1. Upload bytes to SeaweedFS / Storage
    await this.storageService.upload(storageKey, file.buffer, file.mimetype);

    // 2. Check if a file with the same name exists in this folder (Version History D-005)
    const existing = await this.prisma.fileItem.findFirst({
      where: {
        ownerId: userId,
        parentId: parentId || null,
        name: filename,
        isFolder: false,
        isDeleted: false,
      },
    });

    if (existing) {
      const nextVersion = existing.currentVersion + 1;

      // Create new FileVersion record
      await this.prisma.fileVersion.create({
        data: {
          fileId: existing.id,
          versionNumber: nextVersion,
          size: BigInt(file.size),
          storageKey,
          createdById: userId,
          changeSummary: `Uploaded version ${nextVersion}`,
        },
      });

      // Update current active file metadata
      const updated = await this.prisma.fileItem.update({
        where: { id: existing.id },
        data: {
          size: BigInt(file.size),
          storageKey,
          currentVersion: nextVersion,
          mimeType: file.mimetype,
          extension: ext,
        },
        include: {
          owner: {
            select: { id: true, displayName: true, email: true, avatarUrl: true },
          },
        },
      });

      return this.serializeFileItem(updated);
    }

    // 3. Brand new file
    const newFile = await this.prisma.fileItem.create({
      data: {
        name: filename,
        size: BigInt(file.size),
        mimeType: file.mimetype,
        extension: ext,
        isFolder: false,
        ownerId: userId,
        parentId: parentId || null,
        storageKey,
        currentVersion: 1,
        versions: {
          create: {
            versionNumber: 1,
            size: BigInt(file.size),
            storageKey,
            createdById: userId,
            changeSummary: 'Initial upload',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serializeFileItem(newFile);
  }

  async getFileMetadata(fileId: string, userId: string, shareToken?: string) {
    await this.verifyAccess(fileId, userId, 'VIEW', shareToken);

    const item = await this.prisma.fileItem.findUnique({
      where: { id: fileId },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundException('File not found');
    }

    return this.serializeFileItem(item);
  }

  async downloadFile(fileId: string, userId: string, shareToken?: string) {
    await this.verifyAccess(fileId, userId, 'VIEW', shareToken);

    const file = await this.prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted || !file.storageKey) {
      throw new NotFoundException('File not found or has no content');
    }

    const buffer = await this.storageService.download(file.storageKey);

    return {
      name: file.name,
      mimeType: file.mimeType,
      size: Number(file.size),
      buffer,
    };
  }

  async renameItem(fileId: string, userId: string, newName: string) {
    await this.verifyAccess(fileId, userId, 'EDIT');

    const trimmed = newName.trim();
    if (!trimmed) {
      throw new BadRequestException('Name cannot be empty');
    }

    const ext = path.extname(trimmed).toLowerCase().replace('.', '');

    const updated = await this.prisma.fileItem.update({
      where: { id: fileId },
      data: {
        name: trimmed,
        extension: ext || null,
      },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serializeFileItem(updated);
  }

  async moveItem(fileId: string, userId: string, targetParentId?: string | null) {
    await this.verifyAccess(fileId, userId, 'EDIT');

    if (targetParentId) {
      if (targetParentId === fileId) {
        throw new BadRequestException('Cannot move an item into itself');
      }
      const target = await this.prisma.fileItem.findUnique({
        where: { id: targetParentId },
      });
      if (!target || !target.isFolder || target.isDeleted) {
        throw new NotFoundException('Target folder not found');
      }
      await this.verifyAccess(targetParentId, userId, 'EDIT');
    }

    const updated = await this.prisma.fileItem.update({
      where: { id: fileId },
      data: { parentId: targetParentId || null },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serializeFileItem(updated);
  }

  async deleteItem(fileId: string, userId: string) {
    const item = await this.prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundException('File or folder not found');
    }

    if (item.ownerId !== userId) {
      throw new ForbiddenException('Only the file owner can delete this item');
    }

    // Cascade delete storage and sub-files
    await this.cascadeDelete(fileId);

    return { success: true, deletedId: fileId };
  }

  // ==========================================
  // D-004: Sharing Links & Permissions
  // ==========================================

  async createShare(fileId: string, userId: string, dto: CreateShareDto) {
    await this.verifyAccess(fileId, userId, 'EDIT');

    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const share = await this.prisma.fileShare.create({
      data: {
        fileId,
        createdById: userId,
        sharedWithUserId: dto.sharedWithUserId || null,
        permission: dto.permission,
        scope: dto.scope,
        shareToken,
        expiresAt,
      },
    });

    return share;
  }

  async getFileShares(fileId: string, userId: string) {
    const item = await this.prisma.fileItem.findUnique({
      where: { id: fileId },
    });
    if (!item || item.isDeleted) throw new NotFoundException('File not found');
    if (item.ownerId !== userId) throw new ForbiddenException('Only the file owner can view shares');

    return this.prisma.fileShare.findMany({
      where: { fileId },
      include: {
        sharedWithUser: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeShare(shareId: string, userId: string) {
    const share = await this.prisma.fileShare.findUnique({
      where: { id: shareId },
      include: { file: true },
    });

    if (!share) throw new NotFoundException('Share not found');
    if (share.file.ownerId !== userId && share.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to revoke this share');
    }

    await this.prisma.fileShare.delete({ where: { id: shareId } });
    return { success: true, revokedId: shareId };
  }

  async getByShareToken(token: string) {
    const share = await this.prisma.fileShare.findUnique({
      where: { shareToken: token },
      include: {
        file: {
          include: {
            owner: {
              select: { id: true, displayName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!share || share.file.isDeleted) {
      throw new NotFoundException('Shared file link is invalid or file was removed');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new ForbiddenException('This sharing link has expired');
    }

    return {
      file: this.serializeFileItem(share.file),
      permission: share.permission,
      scope: share.scope,
    };
  }

  // ==========================================
  // D-005: Version History & Restore
  // ==========================================

  async getVersionHistory(fileId: string, userId: string) {
    await this.verifyAccess(fileId, userId, 'VIEW');

    const versions = await this.prisma.fileVersion.findMany({
      where: { fileId },
      include: {
        createdBy: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map((v) => ({
      id: v.id,
      fileId: v.fileId,
      versionNumber: v.versionNumber,
      size: Number(v.size),
      storageKey: v.storageKey,
      changeSummary: v.changeSummary,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
    }));
  }

  async restoreVersion(fileId: string, userId: string, versionNumber: number) {
    await this.verifyAccess(fileId, userId, 'EDIT');

    const targetVersion = await this.prisma.fileVersion.findUnique({
      where: {
        fileId_versionNumber: {
          fileId,
          versionNumber,
        },
      },
    });

    if (!targetVersion) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Set file to historical version's storageKey and size
    const updated = await this.prisma.fileItem.update({
      where: { id: fileId },
      data: {
        storageKey: targetVersion.storageKey,
        size: targetVersion.size,
        currentVersion: targetVersion.versionNumber,
      },
      include: {
        owner: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });

    return this.serializeFileItem(updated);
  }

  // ==========================================
  // D-009: File Access Requests
  // ==========================================

  async createAccessRequest(userId: string, dto: CreateAccessRequestDto) {
    const file = await this.prisma.fileItem.findUnique({
      where: { id: dto.fileId },
    });

    if (!file || file.isDeleted) {
      throw new NotFoundException('File not found');
    }

    if (file.ownerId === userId) {
      throw new BadRequestException('You are already the owner of this file');
    }

    // Check if pending request exists
    const existing = await this.prisma.fileAccessRequest.findFirst({
      where: {
        fileId: dto.fileId,
        requesterId: userId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.fileAccessRequest.create({
      data: {
        fileId: dto.fileId,
        requesterId: userId,
        requestedPermission: dto.requestedPermission || 'VIEW',
        note: dto.note || null,
      },
      include: {
        requester: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        file: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getPendingRequestsForOwner(ownerId: string) {
    return this.prisma.fileAccessRequest.findMany({
      where: {
        file: { ownerId },
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        file: {
          select: { id: true, name: true, mimeType: true, isFolder: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewAccessRequest(requestId: string, ownerId: string, dto: ReviewAccessRequestDto) {
    const request = await this.prisma.fileAccessRequest.findUnique({
      where: { id: requestId },
      include: { file: true },
    });

    if (!request) {
      throw new NotFoundException('Access request not found');
    }

    if (request.file.ownerId !== ownerId) {
      throw new ForbiddenException('Only the file owner can approve or deny this request');
    }

    const reviewed = await this.prisma.fileAccessRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        reviewedById: ownerId,
        reviewedAt: new Date(),
      },
    });

    // If APPROVED, grant permission by creating a FileShare for the requester
    if (dto.status === 'APPROVED') {
      await this.prisma.fileShare.create({
        data: {
          fileId: request.fileId,
          createdById: ownerId,
          sharedWithUserId: request.requesterId,
          permission: dto.grantedPermission || request.requestedPermission,
          scope: 'SPECIFIC_PEOPLE',
        },
      });
    }

    return reviewed;
  }

  // ==========================================
  // Generic Attachment API (Shared with Chat C-011)
  // ==========================================

  async createAttachment(uploaderId: string, file: Express.Multer.File, fileId?: string) {
    const filename = file.originalname || 'attachment';
    const storageKey = `attachments/${uploaderId}/${Date.now()}-${filename}`;

    await this.storageService.upload(storageKey, file.buffer, file.mimetype);

    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: filename,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        storageKey,
        uploaderId,
        fileId: fileId || null,
      },
    });

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: Number(attachment.fileSize),
      mimeType: attachment.mimeType,
      storageKey: attachment.storageKey,
      fileId: attachment.fileId,
      uploaderId: attachment.uploaderId,
      createdAt: attachment.createdAt,
    };
  }

  async getAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const buffer = await this.storageService.download(attachment.storageKey);

    return {
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: Number(attachment.fileSize),
        mimeType: attachment.mimeType,
        createdAt: attachment.createdAt,
      },
      buffer,
    };
  }

  // ==========================================
  // Helper & Permission Utilities
  // ==========================================

  private async verifyAccess(
    fileId: string,
    userId: string,
    required: 'VIEW' | 'EDIT',
    shareToken?: string
  ) {
    const item = await this.prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!item || item.isDeleted) {
      throw new NotFoundException('File or folder not found');
    }

    // 1. Owner always has full access
    if (item.ownerId === userId) {
      return true;
    }

    // 2. Share token validation
    if (shareToken) {
      const share = await this.prisma.fileShare.findUnique({
        where: { shareToken },
      });
      if (share && share.fileId === fileId && (!share.expiresAt || share.expiresAt > new Date())) {
        if (required === 'VIEW' || share.permission === 'EDIT') {
          return true;
        }
      }
    }

    // 3. User direct or organization share
    const userShare = await this.prisma.fileShare.findFirst({
      where: {
        fileId,
        OR: [{ sharedWithUserId: userId }, { scope: 'ORGANIZATION' }],
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
    });

    if (userShare) {
      if (required === 'VIEW' || userShare.permission === 'EDIT') {
        return true;
      }
    }

    throw new ForbiddenException(
      `Forbidden: You do not have permission to ${required.toLowerCase()} this file. Please request access.`
    );
  }

  private async buildBreadcrumbs(folderId: string): Promise<BreadcrumbItem[]> {
    const crumbs: BreadcrumbItem[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder: { id: string; name: string; parentId: string | null } | null =
        await this.prisma.fileItem.findUnique({
          where: { id: currentId },
          select: { id: true, name: true, parentId: true },
        });

      if (!folder) break;
      crumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return crumbs;
  }

  private async cascadeDelete(itemId: string) {
    const item = await this.prisma.fileItem.findUnique({
      where: { id: itemId },
      include: { children: true },
    });

    if (!item) return;

    if (item.isFolder) {
      for (const child of item.children) {
        await this.cascadeDelete(child.id);
      }
    } else if (item.storageKey) {
      await this.storageService.delete(item.storageKey);
    }

    await this.prisma.fileItem.delete({ where: { id: itemId } });
  }

  private serializeFileItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      size: Number(item.size),
      mimeType: item.mimeType,
      extension: item.extension,
      isFolder: item.isFolder,
      parentId: item.parentId,
      ownerId: item.ownerId,
      currentVersion: item.currentVersion,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      owner: item.owner,
    };
  }
}
