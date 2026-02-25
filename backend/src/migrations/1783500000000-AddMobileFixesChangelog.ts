import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileFixesChangelog1783500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.8.1',
        '📱 Amélioration de l''Expérience Mobile
        
🛠️ Corrections Apportées :
• Correction d''un problème au survol du menu hamburger sur mobile.
• Le menu de l''itinéraire et le bouton « Supprimer » s''affichent à présent correctement (sans dépassement horizontal).
• Les %. de la charge quotidienne s''adaptent parfaitement à l''écran.',
        NOW()
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.8.1'`);
    }
}
