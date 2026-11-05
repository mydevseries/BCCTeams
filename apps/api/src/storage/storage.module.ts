import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { STORAGE_SERVICE_TOKEN } from './storage.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    StorageService,
    {
      provide: STORAGE_SERVICE_TOKEN,
      useExisting: StorageService,
    },
  ],
  exports: [StorageService, STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
