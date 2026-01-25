import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Suggestion } from '../../suggestions/entities/suggestion.entity';

export enum Priority {
    INDISPENSABLE = 'INDISPENSABLE',
    SI_POSSIBLE = 'SI_POSSIBLE',
    BONUS = 'BONUS',
}

@Entity('user_preferences')
export class UserPreference {
    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @PrimaryColumn({ name: 'suggestion_id' })
    suggestionId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Suggestion)
    @JoinColumn({ name: 'suggestion_id' })
    suggestion: Suggestion;

    @Column({ default: false })
    selected: boolean;

    @Column({
        type: 'enum',
        enum: Priority,
        nullable: true,
    })
    priority: Priority;
}
