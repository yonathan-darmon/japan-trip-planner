import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Suggestion } from '../../suggestions/entities/suggestion.entity';

@Entity('itinerary_days')
export class ItineraryDay {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'itinerary_id' })
    itineraryId: number;

    @Column({ name: 'day_number' })
    dayNumber: number;

    @Column({ type: 'date', nullable: true })
    date: Date | null;

    @OneToMany('ItineraryActivity', 'dayId', { eager: true, cascade: true })
    activities: any[];

    @ManyToOne(() => Suggestion, { nullable: true, eager: true })
    @JoinColumn({ name: 'accommodation_id' })
    accommodation: Suggestion;
}
