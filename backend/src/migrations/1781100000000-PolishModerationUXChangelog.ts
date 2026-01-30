import { MigrationInterface, QueryRunner } from "typeorm";

export class PolishModerationUXChangelog1781100000000 implements MigrationInterface {
    name = 'PolishModerationUXChangelog1781100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.5', '✨ Finition & UX : La modération est maintenant 100% réactive (les éléments disparaissent dès validation). Pour les voyageurs, une idée de groupe qui devient officielle est désormais fièrement marquée "⭐ Sélectionnée" !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.5'`);
    }
}
