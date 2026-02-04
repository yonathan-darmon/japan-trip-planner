import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureTripConfigPerGroup1782600000000 implements MigrationInterface {
    name = 'EnsureTripConfigPerGroup1782600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔧 Starting migration: Ensure TripConfig per Group');

        // 1. Find all groups without a trip_config_id
        const groupsWithoutConfig = await queryRunner.query(
            `SELECT id, name FROM groups WHERE trip_config_id IS NULL`
        );

        console.log(`📊 Found ${groupsWithoutConfig.length} groups without TripConfig`);

        // 2. For each group, create a TripConfig and link it
        for (const group of groupsWithoutConfig) {
            // Create TripConfig with default values
            const result = await queryRunner.query(
                `INSERT INTO trip_config (duration_days, start_date, end_date, updated_at) 
                 VALUES (21, NULL, NULL, NOW()) 
                 RETURNING id`
            );

            const tripConfigId = result[0].id;

            // Link to group
            await queryRunner.query(
                `UPDATE groups SET trip_config_id = $1 WHERE id = $2`,
                [tripConfigId, group.id]
            );

            console.log(`✅ Created TripConfig #${tripConfigId} for Group #${group.id} (${group.name})`);
        }

        console.log('✅ Migration completed: All groups now have a TripConfig');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('⚠️ Rolling back migration: EnsureTripConfigPerGroup');

        // Note: We don't delete the TripConfigs created, just unlink them
        // This is safer to avoid data loss
        await queryRunner.query(
            `UPDATE groups SET trip_config_id = NULL WHERE trip_config_id IS NOT NULL`
        );

        console.log('✅ Rollback completed: Unlinked TripConfigs from groups');
    }
}
