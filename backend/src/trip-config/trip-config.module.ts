import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripConfig } from './entities/trip-config.entity';
import { TripConfigService } from './trip-config.service';
import { TripConfigController } from './trip-config.controller';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TripConfig, Group, GroupMember])],
    controllers: [TripConfigController],
    providers: [TripConfigService],
    exports: [TripConfigService],
})
export class TripConfigModule { }

