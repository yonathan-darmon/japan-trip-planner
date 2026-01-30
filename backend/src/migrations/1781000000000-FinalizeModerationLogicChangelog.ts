import { MigrationInterface, QueryRunner } from "typeorm";

export class FinalizeModerationLogicChangelog1781000000000 implements MigrationInterface {
    name = 'FinalizeModerationLogicChangelog1781000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.4', '🛠️ Excellence & Cohérence : L''algorithme de génération d''itinéraire inclut désormais vos idées de groupe privées ! Le panel admin permet maintenant d''assigner une suggestion à un groupe spécifique, offrant un contrôle total sur la visibilité.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.4'`);
    }
}
