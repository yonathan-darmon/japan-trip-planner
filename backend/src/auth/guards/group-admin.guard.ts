import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember, GroupRole } from '../../groups/entities/group-member.entity';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class GroupAdminGuard implements CanActivate {
    constructor(
        @InjectRepository(GroupMember)
        private groupMembersRepository: Repository<GroupMember>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Utilisateur non authentifié');
        }

        // Super Admin can access everything
        if (user.role === UserRole.SUPER_ADMIN) {
            return true;
        }

        // Extract groupId from params or query
        const groupId = request.params.groupId || request.query.groupId;

        if (!groupId) {
            throw new ForbiddenException('Group ID manquant');
        }

        // Check if user is admin of this group
        const membership = await this.groupMembersRepository.findOne({
            where: {
                userId: user.id,
                groupId: +groupId,
            },
        });

        if (!membership) {
            throw new ForbiddenException('Vous n\'êtes pas membre de ce groupe');
        }

        if (membership.role !== GroupRole.ADMIN) {
            throw new ForbiddenException('Vous devez être administrateur du groupe');
        }

        return true;
    }
}
