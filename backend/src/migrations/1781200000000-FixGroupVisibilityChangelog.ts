import { MigrationInterface, QueryRunner } from "typeorm";

export class FixGroupVisibilityChangelog1781200000000 implements MigrationInterface {
    name = 'FixGroupVisibilityChangelog1781200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.6', '🐛 Correctif : Les membres du groupe peuvent enfin voir les itinéraires et les suggestions ! Le partage fonctionne maintenant correctement pour tout le monde. 🗺️')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.6'`);
    }
}
