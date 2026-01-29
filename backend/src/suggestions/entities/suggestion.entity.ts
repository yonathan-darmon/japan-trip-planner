import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserPreference } from '../../preferences/entities/user-preference.entity';
import { Country } from '../../countries/entities/country.entity';

export enum SuggestionCategory {
    RESTAURANT = 'Restaurant',
    TEMPLE = 'Temple',
    MUSEE = 'Musée',
    NATURE = 'Nature',
    SHOPPING = 'Shopping',
    ACTIVITE = 'Activité',
    HEBERGEMENT = 'Hébergement',
}

@Entity('suggestions')
export class Suggestion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255 })
    location: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'photo_url', length: 500, nullable: true })
    photoUrl: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price: number;

    @Column({
        type: 'enum',
        enum: SuggestionCategory,
    })
    category: SuggestionCategory;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    longitude: number;

    @Column({
        type: 'decimal',
        precision: 3,
        scale: 1,
        default: 2.0,
        name: 'duration_hours'
    })
    durationHours: number;

    @ManyToOne(() => Country, { nullable: true })
    @JoinColumn({ name: 'country_id' })
    country: Country;

    @Column({ name: 'country_id', nullable: true })
    countryId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ name: 'created_by' })
    createdById: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => UserPreference, (preference) => preference.suggestion)
    preferences: UserPreference[];

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
