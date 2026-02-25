import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityUpdatesChangelog1783400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      INSERT INTO "changelogs" ("version", "content", "published_at")
      VALUES (
        'v1.8.0',
        '🔒 Mise à jour de Sécurité Majeure — Protégeons vos données

🛡️ Nouveautés et Correctifs :
• Possibilité de modifier de manière autonome votre mot de passe depuis les Paramètres du Profil.
• Validation renforcée (lettres, chiffres, caractères spéciaux) pour les nouveaux mots de passe.
• Validation fiabilisée des adresses email à l''inscription.
• Protections invisibles : limitation des requêtes abusives (Throttler) et sécurisation des échanges et des WebSockets (Helmet).',
        NOW()
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "changelogs" WHERE "version" = 'v1.8.0'`);
    }
}
