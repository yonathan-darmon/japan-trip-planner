import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember, GroupRole } from '../groups/entities/group-member.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Group)
        private groupsRepository: Repository<Group>,
        @InjectRepository(GroupMember)
        private groupMembersRepository: Repository<GroupMember>,
    ) { }

    async findAllUsers() {
        return this.usersRepository.find({
            relations: ['groups', 'groups.group'],
            order: { id: 'ASC' },
        });
    }

    async findAllGroups() {
        return this.groupsRepository.find({
            relations: ['country', 'members', 'members.user'],
            order: { id: 'ASC' },
        });
    }

    async addUserToGroup(userId: number, groupId: number, role: GroupRole = GroupRole.MEMBER) {
        const user = await this.usersRepository.findOneBy({ id: userId });
        const group = await this.groupsRepository.findOneBy({ id: groupId });

        if (!user || !group) {
            throw new Error('User or Group not found');
        }

        // Check if already member
        const existing = await this.groupMembersRepository.findOneBy({
            userId: user.id,
            groupId: group.id,
        });

        if (existing) {
            // Update role if exists? Or error?
            // Let's allow updating role
            existing.role = role;
            return this.groupMembersRepository.save(existing);
        }

        const member = new GroupMember();
        member.user = user;
        member.group = group;
        member.role = role;
        return this.groupMembersRepository.save(member);
    }

    async getUserGroups(userId: number) {
        return this.groupMembersRepository.find({
            where: { userId },
            relations: ['group', 'group.country'],
        });
    }

    async removeMember(userId: number, groupId: number) {
        return this.groupMembersRepository.delete({ userId, groupId });
    }

    async forceLogout(userId: number) {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new Error('User not found');
        }
        user.tokenVersion = (user.tokenVersion || 1) + 1;
        return this.usersRepository.save(user);
    }

    async reattributeSuggestion(suggestionId: number, userId: number | null) {
        // We use query builder or raw update for simplicity if Suggesion repo is not injected
        return this.usersRepository.query(
            'UPDATE suggestions SET created_by = $1 WHERE id = $2',
            [userId, suggestionId]
        );
    }
}
