import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBudgetTrackingChangelog1782900000000 implements MigrationInterface {
    name = 'AddBudgetTrackingChangelog1782900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO changelogs (version, content, published_at) 
            VALUES (
                'v1.9.0',
                '💰 Suivi du Budget v1 : Gardez le contrôle sur vos dépenses ! Visualisez le coût total estimé de votre voyage et suivez vos dépenses jour par jour grâce au nouveau graphique interactif. 📊 Intégration automatique des devises pour une estimation précise en Euros.',
                NOW()
            )
        `);

        console.log('✅ Added changelog entry for v1.9.0: Budget Tracking');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM changelogs WHERE version = 'v1.9.0'
        `);

        console.log('✅ Removed changelog entry for v1.9.0');
    }
}
