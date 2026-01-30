import { MigrationInterface, QueryRunner } from "typeorm";

export class FixModerationLogicChangelog1780800000000 implements MigrationInterface {
    name = 'FixModerationLogicChangelog1780800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.2', '🛠️ Correction & Workflow : Correction d''un bug qui empêchait la privatisation des suggestions. Le panel admin est maintenant organisé en onglets ("À Modérer" vs "Catalogue") pour un meilleur flux de travail. Le catalogue voyageur sépare désormais clairement le Guide Officiel des idées du groupe !')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.2'`);
    }
}
