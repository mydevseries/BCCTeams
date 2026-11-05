import { Module, forwardRef } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [forwardRef(() => GatewayModule)],
  controllers: [PresenceController],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}

