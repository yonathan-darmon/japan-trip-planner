import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

export enum GroupRole {
    ADMIN = 'admin',
    MEMBER = 'member',
}

@Entity('group_members')
export class GroupMember {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.groups, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @Column({ name: 'group_id' })
    groupId: number;

    @Column({
        type: 'enum',
        enum: GroupRole,
        default: GroupRole.MEMBER,
    })
    role: GroupRole;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;
}
