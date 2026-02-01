import { MigrationInterface, QueryRunner } from "typeorm";

export class ForceLogoutFixChangelog1769958370036 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "changelogs" ("version", "description", "icon", "created_at") 
            VALUES ('v1.3.1', 'Correction du système de déconnexion forcée par les administrateurs pour garantir l''invalidation des sessions.', '🔌', NOW());
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "changelogs" WHERE "version" = 'v1.3.1';
        `);
    }

}
