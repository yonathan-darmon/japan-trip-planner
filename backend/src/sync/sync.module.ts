import { Module, Global } from '@nestjs/common';
import { SyncGateway } from './sync.gateway';

@Global() // Make it global so we can inject SyncGateway anywhere easily
@Module({
    providers: [SyncGateway],
    exports: [SyncGateway],
})
export class SyncModule { }
