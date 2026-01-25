import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

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

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STANDARD,
    })
    role: UserRole;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
