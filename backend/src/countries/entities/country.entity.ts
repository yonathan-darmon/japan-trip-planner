import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('countries')
export class Country {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;

    @Column({ length: 3, unique: true })
    code: string;

    @Column({ type: 'jsonb', name: 'supported_features', default: {} })
    supportedFeatures: Record<string, boolean>;

    @Column({ name: 'currency_code', length: 3, default: 'EUR' })
    currencyCode: string;

    @Column({ name: 'currency_symbol', length: 5, default: '€' })
    currencySymbol: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
