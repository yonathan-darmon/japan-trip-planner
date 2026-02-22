import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUXDashboardRedesignChangelog1783000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.7.0',
        '🎨 Refonte de l''accueil & du guide

🗺️ Tableau de bord repensé :
• Progression étape par étape (Groupe → Suggestions → Votes → Itinéraire)
• Bannière d''accueil pour les nouveaux utilisateurs sans groupe
• Lien rapide ❓ vers le guide intégré dans l''accueil

📖 Page Guide enrichie :
• FAQ interactive avec 8 questions/réponses (suggestions privées, votes, drag & drop...)
• Section Rôles (Participant vs Admin)
• Boutons d''action contextuels après chaque étape

🔍 Navigation :
• Lien "❓ Guide" mis en valeur dans la barre de navigation',
        NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "changelogs" WHERE "version" = 'v1.7.0'
    `);
  }
}
