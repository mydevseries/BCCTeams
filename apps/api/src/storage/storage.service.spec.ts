import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'S3_BUCKET') return 'test-bucket';
              if (key === 'S3_ENDPOINT') return 'http://localhost:8333';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('uploads, checks existence, downloads, and deletes file successfully', async () => {
    const testKey = `test-${Date.now()}.txt`;
    const content = Buffer.from('Hello BCC Teams SeaweedFS Storage!');
    const mimeType = 'text/plain';

    // 1. Upload
    const result = await service.upload(testKey, content, mimeType);
    expect(result.storageKey).toBe(testKey);
    expect(result.size).toBe(content.length);

    // 2. Exists
    const exists = await service.exists(testKey);
    expect(exists).toBe(true);

    // 3. Download
    const downloaded = await service.download(testKey);
    expect(downloaded.toString('utf-8')).toBe(content.toString('utf-8'));

    // 4. Delete
    await service.delete(testKey);
    const existsAfterDelete = await service.exists(testKey);
    expect(existsAfterDelete).toBe(false);
  });
});
