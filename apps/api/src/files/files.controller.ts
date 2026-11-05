import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import { CreateFolderDto, RenameItemDto, MoveItemDto } from './dto/file-operations.dto';
import { CreateShareDto, CreateAccessRequestDto, ReviewAccessRequestDto } from './dto/share-and-access.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // ==========================================
  // D-001: Views
  // ==========================================

  @Get('my-files')
  @UseGuards(JwtAuthGuard)
  async getMyFiles(
    @Req() req: AuthenticatedRequest,
    @Query('parentId') parentId?: string
  ) {
    return this.filesService.getMyFiles(req.user.id, parentId);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecentFiles(@Req() req: AuthenticatedRequest) {
    return this.filesService.getRecentFiles(req.user.id);
  }

  @Get('shared-with-me')
  @UseGuards(JwtAuthGuard)
  async getSharedWithMe(@Req() req: AuthenticatedRequest) {
    return this.filesService.getSharedWithMe(req.user.id);
  }

  // ==========================================
  // D-002: Folders & File Operations
  // ==========================================

  @Post('folder')
  @UseGuards(JwtAuthGuard)
  async createFolder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFolderDto
  ) {
    return this.filesService.createFolder(req.user.id, dto.name, dto.parentId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  async uploadFile(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body('parentId') parentId?: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.filesService.uploadFile(req.user.id, file, parentId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getFileMetadata(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Query('shareToken') shareToken?: string
  ) {
    return this.filesService.getFileMetadata(id, req.user.id, shareToken);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async downloadFile(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('shareToken') shareToken?: string
  ) {
    const file = await this.filesService.downloadFile(id, req.user.id, shareToken);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', file.size);
    res.send(file.buffer);
  }

  // ==========================================
  // D-003: Preview Stream
  // ==========================================

  @Get(':id/preview')
  @UseGuards(JwtAuthGuard)
  async previewFile(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('shareToken') shareToken?: string
  ) {
    const file = await this.filesService.downloadFile(id, req.user.id, shareToken);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    res.send(file.buffer);
  }

  @Patch(':id/rename')
  @UseGuards(JwtAuthGuard)
  async renameItem(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RenameItemDto
  ) {
    return this.filesService.renameItem(id, req.user.id, dto.name);
  }

  @Patch(':id/move')
  @UseGuards(JwtAuthGuard)
  async moveItem(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: MoveItemDto
  ) {
    return this.filesService.moveItem(id, req.user.id, dto.targetParentId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteItem(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.filesService.deleteItem(id, req.user.id);
  }

  // ==========================================
  // D-004: Sharing Links
  // ==========================================

  @Post(':id/shares')
  @UseGuards(JwtAuthGuard)
  async createShare(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateShareDto
  ) {
    return this.filesService.createShare(id, req.user.id, dto);
  }

  @Get(':id/shares')
  @UseGuards(JwtAuthGuard)
  async getFileShares(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.filesService.getFileShares(id, req.user.id);
  }

  @Delete('shares/:shareId')
  @UseGuards(JwtAuthGuard)
  async revokeShare(
    @Param('shareId') shareId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.filesService.revokeShare(shareId, req.user.id);
  }

  @Get('shared/token/:token')
  async getByShareToken(@Param('token') token: string) {
    return this.filesService.getByShareToken(token);
  }

  // ==========================================
  // D-005: Version History
  // ==========================================

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  async getVersionHistory(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.filesService.getVersionHistory(id, req.user.id);
  }

  @Post(':id/versions/:versionNumber/restore')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.filesService.restoreVersion(id, req.user.id, Number(versionNumber));
  }

  // ==========================================
  // D-009: File Access Requests
  // ==========================================

  @Post('access-requests')
  @UseGuards(JwtAuthGuard)
  async createAccessRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAccessRequestDto
  ) {
    return this.filesService.createAccessRequest(req.user.id, dto);
  }

  @Get('access-requests/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingRequests(@Req() req: AuthenticatedRequest) {
    return this.filesService.getPendingRequestsForOwner(req.user.id);
  }

  @Patch('access-requests/:requestId')
  @UseGuards(JwtAuthGuard)
  async reviewAccessRequest(
    @Param('requestId') requestId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReviewAccessRequestDto
  ) {
    return this.filesService.reviewAccessRequest(requestId, req.user.id, dto);
  }

  // ==========================================
  // Generic Attachment API (Shared for Chat C-011)
  // ==========================================

  @Post('attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadAttachment(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
    @Body('fileId') fileId?: string
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.filesService.createAttachment(req.user.id, file, fileId);
  }

  @Get('attachments/:id')
  @UseGuards(JwtAuthGuard)
  async getAttachment(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const { attachment, buffer } = await this.filesService.getAttachment(id);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.fileName)}"`);
    res.send(buffer);
  }
}
