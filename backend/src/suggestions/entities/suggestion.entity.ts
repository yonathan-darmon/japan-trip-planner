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
    TRANSPORT = 'Transport',
    AUTRE = 'Autre',
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
    price: number | null;

    @Column({
        type: 'enum',
        enum: SuggestionCategory,
    })
    category: SuggestionCategory;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    latitude: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    longitude: number | null;

    @Column({
        type: 'decimal',
        precision: 3,
        scale: 1,
        default: 2.0,
        name: 'duration_hours'
    })
    durationHours: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: User | null;

    @Column({ name: 'created_by', nullable: true })
    createdById: number | null;

    @Column({ name: 'group_id', type: 'int', nullable: true })
    groupId: number | null;

    @ManyToOne(() => Country, { nullable: true })
    @JoinColumn({ name: 'country_id' })
    country: Country | null;

    @Column({ name: 'country_id', type: 'int', nullable: true })
    countryId: number | null;

    @Column({ name: 'is_global', default: false })
    isGlobal: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => UserPreference, (preference) => preference.suggestion)
    preferences: UserPreference[];

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
