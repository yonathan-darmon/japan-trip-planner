import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { User } from '../users/entities/user.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
    imports: [TypeOrmModule.forFeature([Group, GroupMember, User])],
    controllers: [GroupsController],
    providers: [GroupsService],
    exports: [TypeOrmModule, GroupsService], // Export Service for Auth/Admin usage
})
export class GroupsModule { }
