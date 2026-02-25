import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileOptimizationChangelog1783300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.7.3',
        '📱 Amélioration Mobile Majeure — Une application plus fluide

📱 Refonte de l''affichage mobile :
• Le menu latéral navigue désormais parfaitement et est scrollable.
• Les filtres et les boutons sur les suggestions s''empilent intelligemment sur petit écran.
• Le tableau de bord et l''Itinéraire s''ajustent 100% à la largeur de votre téléphone.
• Plus aucun texte ne dépasse de ses marges !',
        NOW()
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.7.3'`);
    }
}
