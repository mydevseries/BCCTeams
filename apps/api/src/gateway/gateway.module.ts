import { Global, Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { PresenceModule } from '../presence/presence.module';

@Global()
@Module({
  imports: [forwardRef(() => PresenceModule)],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
