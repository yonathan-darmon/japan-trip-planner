import { MigrationInterface, QueryRunner } from "typeorm";

export class ForceLogoutFixChangelog1781700000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "changelogs" ("version", "content") 
            VALUES ('v1.3.1', '🔌 Déconnexion Forcée : Correction du système pour garantir l''invalidation des sessions utilisateurs.');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "changelogs" WHERE "version" = 'v1.3.1';
        `);
    }

}
