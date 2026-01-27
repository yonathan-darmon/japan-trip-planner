import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by' })
    createdById: number;

    @CreateDateColumn({ name: 'generated_at' })
    generatedAt: Date;
}
