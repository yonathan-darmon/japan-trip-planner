import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMapAndRightsChangelog1781300000000 implements MigrationInterface {
    name = 'AddMapAndRightsChangelog1781300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.7', '🗺️ Nouvelle Carte Interactive : Placez vos suggestions précisément grâce au marqueur déplaçable ! 🆓 Visibilité : Vos suggestions sont maintenant publiques par défaut pour en faire profiter tout le monde. 🔒 Droits Admin : Corrections des permissions.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.7'`);
    }
}
