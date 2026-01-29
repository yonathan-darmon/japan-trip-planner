import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Group, GroupMember])],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
