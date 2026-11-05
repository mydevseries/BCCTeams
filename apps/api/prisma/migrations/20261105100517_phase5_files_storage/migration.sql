-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('VIEW', 'EDIT');

-- CreateEnum
CREATE TYPE "ShareScope" AS ENUM ('SPECIFIC_PEOPLE', 'ORGANIZATION', 'ANYONE_WITH_LINK');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "FileItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "ownerId" TEXT NOT NULL,
    "storageKey" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileVersion" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "size" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShare" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sharedWithUserId" TEXT,
    "permission" "SharePermission" NOT NULL DEFAULT 'VIEW',
    "scope" "ShareScope" NOT NULL DEFAULT 'SPECIFIC_PEOPLE',
    "shareToken" TEXT,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAccessRequest" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requestedPermission" "SharePermission" NOT NULL DEFAULT 'VIEW',
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileItem_ownerId_idx" ON "FileItem"("ownerId");

-- CreateIndex
CREATE INDEX "FileItem_parentId_idx" ON "FileItem"("parentId");

-- CreateIndex
CREATE INDEX "FileItem_isFolder_idx" ON "FileItem"("isFolder");

-- CreateIndex
CREATE INDEX "FileVersion_fileId_idx" ON "FileVersion"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileVersion_fileId_versionNumber_key" ON "FileVersion"("fileId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FileShare_shareToken_key" ON "FileShare"("shareToken");

-- CreateIndex
CREATE INDEX "FileShare_fileId_idx" ON "FileShare"("fileId");

-- CreateIndex
CREATE INDEX "FileShare_sharedWithUserId_idx" ON "FileShare"("sharedWithUserId");

-- CreateIndex
CREATE INDEX "FileShare_shareToken_idx" ON "FileShare"("shareToken");

-- CreateIndex
CREATE INDEX "FileAccessRequest_fileId_idx" ON "FileAccessRequest"("fileId");

-- CreateIndex
CREATE INDEX "FileAccessRequest_requesterId_idx" ON "FileAccessRequest"("requesterId");

-- CreateIndex
CREATE INDEX "FileAccessRequest_status_idx" ON "FileAccessRequest"("status");

-- CreateIndex
CREATE INDEX "Attachment_fileId_idx" ON "Attachment"("fileId");

-- CreateIndex
CREATE INDEX "Attachment_uploaderId_idx" ON "Attachment"("uploaderId");

-- AddForeignKey
ALTER TABLE "FileItem" ADD CONSTRAINT "FileItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileItem" ADD CONSTRAINT "FileItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FileItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVersion" ADD CONSTRAINT "FileVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccessRequest" ADD CONSTRAINT "FileAccessRequest_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccessRequest" ADD CONSTRAINT "FileAccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccessRequest" ADD CONSTRAINT "FileAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE "FileItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FileVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FileShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FileAccessRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
