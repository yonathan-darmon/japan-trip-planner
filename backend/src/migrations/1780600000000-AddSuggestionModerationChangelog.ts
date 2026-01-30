import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuggestionModerationChangelog1780600000000 implements MigrationInterface {
    name = 'AddSuggestionModerationChangelog1780600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.0', '⛩️ Modération des Suggestions : Le Super Admin peut désormais gérer toutes les suggestions du site, les attribuer à des pays spécifiques et les "globaliser" pour qu''elles soient visibles par tous les voyageurs !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.0'`);
    }
}
