import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { TripConfig } from '../../trip-config/entities/trip-config.entity';
import { GroupMember } from './group-member.entity';
import { Country } from '../../countries/entities/country.entity';
import { ManyToOne } from 'typeorm';

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @OneToOne(() => TripConfig, { nullable: true })
    @JoinColumn({ name: 'trip_config_id' })
    tripConfig: TripConfig;

    @Column({ name: 'trip_config_id', nullable: true })
    tripConfigId: number;

    @ManyToOne(() => Country, { nullable: true })
    @JoinColumn({ name: 'country_id' })
    country: Country;

    @Column({ name: 'country_id', nullable: true })
    countryId: number;

    @OneToMany(() => GroupMember, member => member.group)
    members: GroupMember[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
