import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('trip_config')
export class TripConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'duration_days',
        type: 'int',
        default: 21,
    })
    durationDays: number;

    @Column({ name: 'start_date', type: 'date', nullable: true })
    startDate: Date | null;

    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate: Date | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updatedBy: User;

    @Column({ name: 'updated_by', nullable: true })
    updatedById: number;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
