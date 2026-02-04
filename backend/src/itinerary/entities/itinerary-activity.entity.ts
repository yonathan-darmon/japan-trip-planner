import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Suggestion } from '../../suggestions/entities/suggestion.entity';

@Entity('itinerary_activities')
export class ItineraryActivity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'day_id' })
    dayId: number;

    @Column({ name: 'suggestion_id' })
    suggestionId: number;

    @Column({ name: 'order_in_day' })
    orderInDay: number;

    @ManyToOne(() => Suggestion, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'suggestion_id' })
    suggestion: Suggestion;
}
