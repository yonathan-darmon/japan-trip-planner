import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { GroupMember } from '../../groups/entities/group-member.entity';

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    STANDARD = 'standard',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 50 })
    username: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STANDARD,
    })
    role: UserRole;

    @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
    groups: GroupMember[];

    @Column({ name: 'last_viewed_changelog_at', nullable: true })
    lastViewedChangelogAt: Date;

    @Column({ name: 'token_version', default: 1 })
    tokenVersion: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
