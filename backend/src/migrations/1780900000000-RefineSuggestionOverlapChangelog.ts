import { MigrationInterface, QueryRunner } from "typeorm";

export class RefineSuggestionOverlapChangelog1780900000000 implements MigrationInterface {
    name = 'RefineSuggestionOverlapChangelog1780900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.3', '🍱 Raffinement du Catalogue : Les suggestions créées par votre groupe restent désormais dans l''onglet "Nos Idées" même après avoir été promues au Catalogue Officiel. Correction également d''un problème de types sur les coordonnées géographiques.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.3'`);
    }
}
