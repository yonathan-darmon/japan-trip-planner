import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoLinkageChangelog1781600000000 implements MigrationInterface {
    name = 'AutoLinkageChangelog1781600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "changelogs" ("version", "content") VALUES ('v1.3.10', '🤖 Automatisation : Vos suggestions sont désormais automatiquement liées à votre voyage si vous n''en avez qu''un ! 🗺️ Visibilité : Le formulaire d''ajout affiche maintenant clairement la destination de votre suggestion.')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.3.10'`);
    }
}
