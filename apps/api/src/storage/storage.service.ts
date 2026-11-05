import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageService, UploadResult } from './storage.interface';

@Injectable()
export class StorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucket: string;
  private isS3Available = false;
  private readonly localStorageDir: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'bccteams';
    this.localStorageDir = path.resolve(process.cwd(), 'uploads', 'storage');

    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
    }
  }

  async onModuleInit() {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:8333';
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY') || 'any';
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY') || 'any';

    try {
      this.s3Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Required for SeaweedFS
      });

      // Probe connection and ensure bucket exists
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (err: any) {
        // BucketAlreadyExists / BucketAlreadyOwnedByYou is normal
        if (err.name !== 'BucketAlreadyOwnedByYou' && err.name !== 'BucketAlreadyExists') {
          // check if accessible
          await this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: '__probe__' })).catch(() => {});
        }
      }

      this.isS3Available = true;
      this.logger.log(`SeaweedFS S3 storage initialized at ${endpoint} (bucket: ${this.bucket})`);
    } catch (err) {
      this.isS3Available = false;
      this.logger.warn(`SeaweedFS not reachable at ${endpoint}. Using local dev storage at ${this.localStorageDir}`);
    }
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    if (this.isS3Available && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        return { storageKey: key, size: buffer.length, mimeType };
      } catch (err) {
        this.logger.warn(`S3 upload failed for ${key}, falling back to local storage: ${err}`);
      }
    }

    // Local storage fallback
    const localFilePath = path.join(this.localStorageDir, key);
    const parentDir = path.dirname(localFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, buffer);

    return { storageKey: key, size: buffer.length, mimeType };
  }

  async download(key: string): Promise<Buffer> {
    if (this.isS3Available && this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        );

        if (response.Body) {
          const stream = response.Body as any;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          return Buffer.concat(chunks);
        }
      } catch (err) {
        this.logger.warn(`S3 download failed for ${key}, falling back to local storage: ${err}`);
      }
    }

    // Local storage fallback
    const localFilePath = path.join(this.localStorageDir, key);
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found in storage: ${key}`);
    }
    return fs.readFileSync(localFilePath);
  }

  async delete(key: string): Promise<void> {
    if (this.isS3Available && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        );
      } catch (err) {
        this.logger.warn(`S3 delete failed for ${key}: ${err}`);
      }
    }

    // Local storage delete
    const localFilePath = path.join(this.localStorageDir, key);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.isS3Available && this.s3Client) {
      try {
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        );
        return true;
      } catch {
        // fall through to local
      }
    }

    const localFilePath = path.join(this.localStorageDir, key);
    return fs.existsSync(localFilePath);
  }
}
