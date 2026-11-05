export interface UploadResult {
  storageKey: string;
  size: number;
  mimeType: string;
}

export interface IStorageService {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export const STORAGE_SERVICE_TOKEN = 'IStorageService';
