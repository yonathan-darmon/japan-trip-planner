import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('itineraries')
export class Itinerary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @Column({ name: 'total_days' })
    totalDays: number;

    @Column({ type: 'jsonb' })
    days: any; // JSON structure with daily activities

    @Column({
        name: 'total_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    totalCost: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by', nullable: true })
    createdById: number | null;

    @CreateDateColumn({ name: 'generated_at' })
    generatedAt: Date;

    @ManyToOne(() => Group, { nullable: true })
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @Column({ name: 'group_id', type: 'int', nullable: true })
    groupId: number | null;
}
