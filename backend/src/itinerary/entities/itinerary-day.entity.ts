import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';

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
}
