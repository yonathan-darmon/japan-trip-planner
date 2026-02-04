import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupIsolationChangelog1782700000000 implements MigrationInterface {
    name = 'AddGroupIsolationChangelog1782700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO changelogs (version, content, published_at) 
            VALUES (
                'v1.8.0',
                '🔒 Isolation des Groupes : Chaque groupe a maintenant sa propre configuration de voyage ! Les suggestions sont filtrées par pays pour éviter toute confusion. Les admins de groupe peuvent gérer leur voyage directement depuis le dashboard. 📚 Guide amélioré pour mieux démarrer votre aventure !',
                NOW()
            )
        `);

        console.log('✅ Added changelog entry for v1.8.0: Group Isolation');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM changelogs WHERE version = 'v1.8.0'
        `);

        console.log('✅ Removed changelog entry for v1.8.0');
    }
}
