import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember, GroupRole } from './entities/group-member.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GroupsService {
    constructor(
        @InjectRepository(Group)
        private groupsRepository: Repository<Group>,
        @InjectRepository(GroupMember)
        private groupMembersRepository: Repository<GroupMember>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findAll() {
        return this.groupsRepository.find({ relations: ['country', 'members'] });
    }

    async findOne(id: number) {
        return this.groupsRepository.findOne({
            where: { id },
            relations: ['country', 'members', 'members.user']
        });
    }

    async findByUser(userId: number) {
        // Find group members records for user, then get groups
        // Or QueryBuilder
        // relations: ['group', 'group.country'] on GroupMember
        const memberships = await this.groupMembersRepository.find({
            where: { userId },
            relations: ['group', 'group.country'],
        });

        return memberships.map(m => ({
            id: m.group.id,
            name: m.group.name,
            role: m.role,
            country: m.group.country
        }));
    }

    async addMemberByEmail(groupId: number, email: string): Promise<GroupMember> {
        const group = await this.groupsRepository.findOneBy({ id: groupId });
        if (!group) throw new NotFoundException('Group not found');

        const user = await this.usersRepository.findOneBy({ email });
        if (!user) throw new BadRequestException('User with this email not found');

        // Check if already member
        const existing = await this.groupMembersRepository.findOne({
            where: { groupId, userId: user.id } // Removed IsNull() usage, standard property check
        });
        if (existing) throw new BadRequestException('User is already a member');

        const member = new GroupMember();
        member.group = group;
        member.user = user;
        member.role = GroupRole.MEMBER;
        return this.groupMembersRepository.save(member);
    }

    async removeMember(groupId: number, userId: number) {
        return this.groupMembersRepository.delete({ groupId, userId });
    }
    async update(id: number, data: { countryId?: number }) {
        const group = await this.groupsRepository.findOneBy({ id });
        if (!group) throw new NotFoundException('Group not found');

        if (data.countryId) {
            group.country = <any>{ id: data.countryId }; // Simple relation set
        }

        return this.groupsRepository.save(group);
    }
}
