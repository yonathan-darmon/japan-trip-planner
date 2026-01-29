import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('changelogs')
export class Changelog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50 })
    version: string;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn({ name: 'published_at' })
    publishedAt: Date;
}
