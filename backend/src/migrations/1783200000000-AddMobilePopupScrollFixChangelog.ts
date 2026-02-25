import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobilePopupScrollFixChangelog1783200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.7.2',
        '📱 Amélioration Mobile — Pop-up de Nouveautés

🤏 Défilement ajouté :
• La pop-up des nouveautés sur la page d''accueil est maintenant scrollable
• Le bouton "C''est parti !" reste toujours accessible, même sur les petits écrans mobiles',
        NOW()
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.7.2'`);
    }
}
